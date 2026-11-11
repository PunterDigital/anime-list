<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Laravel\Passkeys\Support\WebAuthn;
use ParagonIE\ConstantTime\Base64UrlSafe;
use RuntimeException;
use Symfony\Component\Uid\Uuid;
use Throwable;
use Webauthn\CredentialRecord;
use Webauthn\TrustPath\EmptyTrustPath;

/**
 * Copies passkeys registered with laragear/webauthn (table `webauthn_credentials`)
 * into laravel/passkeys' `passkeys` table, so nobody has to register again (card 4237).
 *
 * Laragear kept the public key as an encrypted PEM; laravel/passkeys keeps a
 * webauthn-lib CredentialRecord whose key is COSE (CBOR). Laragear always verified
 * with SHA-256 (or Ed25519), so P-256 keys are ES256, RSA keys RS256 and Ed25519 EdDSA.
 *
 * The user handle has to stay the bytes the authenticator holds. Laragear sent the
 * user's UUID as 32 hex characters, and its browser client (SimpleWebAuthn 13)
 * base64url-decoded that string into the user.id bytes, so those are the bytes the
 * authenticator returns at sign-in.
 */
class LegacyPasskeys
{
    private const COSE_KTY_OKP = 1;

    private const COSE_KTY_EC2 = 2;

    private const COSE_KTY_RSA = 3;

    private const COSE_ALG_ES256 = -7;

    private const COSE_ALG_EDDSA = -8;

    private const COSE_ALG_RS256 = -257;

    /**
     * Copy every enabled laragear credential that isn't in `passkeys` yet.
     *
     * @return array{copied: int, skipped: list<string>}
     */
    public static function copyAll(): array
    {
        $result = ['copied' => 0, 'skipped' => []];

        if (! Schema::hasTable('webauthn_credentials')) {
            return $result;
        }

        $userTypes = array_unique([User::class, (new User)->getMorphClass()]);

        $rows = DB::table('webauthn_credentials')->orderBy('created_at')->get();

        foreach ($rows as $row) {
            $label = 'credential '.substr((string) $row->id, 0, 12).'... (user '.$row->authenticatable_id.')';

            if (! in_array($row->authenticatable_type, $userTypes, true)) {
                $result['skipped'][] = "$label: not a user credential";

                continue;
            }

            if ($row->disabled_at !== null) {
                $result['skipped'][] = "$label: disabled";

                continue;
            }

            if (! DB::table('users')->where('id', $row->authenticatable_id)->exists()) {
                $result['skipped'][] = "$label: user no longer exists";

                continue;
            }

            try {
                $record = self::toCredentialRecord($row);
            } catch (Throwable $e) {
                $result['skipped'][] = "$label: ".$e->getMessage();

                continue;
            }

            $credentialId = Base64UrlSafe::encodeUnpadded($record->publicKeyCredentialId);

            if (DB::table('passkeys')->where('credential_id', $credentialId)->exists()) {
                continue;
            }

            DB::table('passkeys')->insert([
                'user_id' => $row->authenticatable_id,
                'name' => self::name($row->alias),
                'credential_id' => $credentialId,
                'credential' => WebAuthn::toJson($record),
                'last_used_at' => null,
                'created_at' => $row->created_at,
                'updated_at' => now(),
            ]);

            $result['copied']++;
        }

        foreach ($result['skipped'] as $reason) {
            Log::warning("Passkey migration skipped $reason");
        }

        return $result;
    }

    /**
     * Build the CredentialRecord laravel/passkeys verifies against.
     */
    public static function toCredentialRecord(object $row): CredentialRecord
    {
        $rawId = Base64UrlSafe::decodeNoPadding(rtrim(strtr((string) $row->id, '+/', '-_'), '='));

        $pem = Crypt::decryptString((string) $row->public_key);

        $handleHex = strtolower(str_replace('-', '', (string) $row->user_id));

        if (! preg_match('/^[0-9a-f]{32}$/', $handleHex)) {
            throw new RuntimeException('user handle is not a UUID');
        }

        $transports = is_string($row->transports) ? json_decode($row->transports, true) : null;

        return CredentialRecord::create(
            publicKeyCredentialId: $rawId,
            type: 'public-key',
            transports: is_array($transports) ? array_values(array_filter($transports, 'is_string')) : [],
            attestationType: 'none',
            trustPath: EmptyTrustPath::create(),
            aaguid: $row->aaguid ? Uuid::fromString((string) $row->aaguid) : Uuid::fromString('00000000-0000-0000-0000-000000000000'),
            credentialPublicKey: self::pemToCose($pem),
            userHandle: Base64UrlSafe::decodeNoPadding($handleHex),
            counter: (int) ($row->counter ?? 0),
        );
    }

    /**
     * Convert a PEM public key (as laragear stored it) to a COSE_Key in CBOR.
     */
    public static function pemToCose(string $pem): string
    {
        $key = openssl_pkey_get_public($pem);

        if ($key === false) {
            throw new RuntimeException('public key could not be read');
        }

        $details = openssl_pkey_get_details($key);

        if (isset($details['ec'])) {
            if (($details['ec']['curve_name'] ?? null) !== 'prime256v1') {
                throw new RuntimeException('unsupported curve '.($details['ec']['curve_name'] ?? '?'));
            }

            return self::cborMap([
                1 => self::COSE_KTY_EC2,
                3 => self::COSE_ALG_ES256,
                -1 => 1, // P-256
                -2 => ['bytes' => str_pad($details['ec']['x'], 32, "\0", STR_PAD_LEFT)],
                -3 => ['bytes' => str_pad($details['ec']['y'], 32, "\0", STR_PAD_LEFT)],
            ]);
        }

        if (isset($details['rsa'])) {
            return self::cborMap([
                1 => self::COSE_KTY_RSA,
                3 => self::COSE_ALG_RS256,
                -1 => ['bytes' => $details['rsa']['n']],
                -2 => ['bytes' => $details['rsa']['e']],
            ]);
        }

        // Ed25519: the SubjectPublicKeyInfo ends with the 32-byte key.
        $der = base64_decode(preg_replace('/-----[^-]+-----|\s+/', '', $pem) ?? '', true);

        if (is_string($der) && strlen($der) === 44 && str_starts_with($der, "\x30\x2a\x30\x05\x06\x03\x2b\x65\x70")) {
            return self::cborMap([
                1 => self::COSE_KTY_OKP,
                3 => self::COSE_ALG_EDDSA,
                -1 => 6, // Ed25519
                -2 => ['bytes' => substr($der, -32)],
            ]);
        }

        throw new RuntimeException('unsupported key type');
    }

    public static function name(?string $alias): string
    {
        $alias = trim((string) $alias);

        return $alias === '' ? 'Passkey' : mb_substr($alias, 0, 255);
    }

    /**
     * Encode a map of int keys to ints or ['bytes' => string] as CBOR.
     *
     * @param  array<int, int|array{bytes: string}>  $map
     */
    private static function cborMap(array $map): string
    {
        $out = self::cborHead(5, count($map));

        foreach ($map as $key => $value) {
            $out .= self::cborInt($key);
            $out .= is_array($value) ? self::cborHead(2, strlen($value['bytes'])).$value['bytes'] : self::cborInt($value);
        }

        return $out;
    }

    private static function cborInt(int $value): string
    {
        return $value >= 0 ? self::cborHead(0, $value) : self::cborHead(1, -1 - $value);
    }

    private static function cborHead(int $major, int $length): string
    {
        $type = $major << 5;

        return match (true) {
            $length < 24 => chr($type | $length),
            $length < 0x100 => chr($type | 24).chr($length),
            $length < 0x10000 => chr($type | 25).pack('n', $length),
            default => chr($type | 26).pack('N', $length),
        };
    }
}
