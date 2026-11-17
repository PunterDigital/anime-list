<?php

namespace Tests\Support;

use ParagonIE\ConstantTime\Base64UrlSafe;
use RuntimeException;

/**
 * A passkey authenticator in PHP for tests (card 4237): a real key pair that
 * signs real WebAuthn assertions, so the controller and laravel/passkeys'
 * verification run unchanged.
 */
class SoftwareAuthenticator
{
    public readonly string $credentialId;

    private int $counter = 0;

    private function __construct(
        public readonly string $type,
        private readonly mixed $privateKey,
        public readonly string $publicKeyPem,
        public string $userHandle,
    ) {
        $this->credentialId = random_bytes(32);
    }

    public static function es256(string $userHandle = ''): self
    {
        $key = self::newKey(['private_key_type' => OPENSSL_KEYTYPE_EC, 'curve_name' => 'prime256v1']);

        return new self('es256', $key, openssl_pkey_get_details($key)['key'], $userHandle);
    }

    public static function rs256(string $userHandle = ''): self
    {
        $key = self::newKey(['private_key_type' => OPENSSL_KEYTYPE_RSA, 'private_key_bits' => 2048]);

        return new self('rs256', $key, openssl_pkey_get_details($key)['key'], $userHandle);
    }

    /**
     * Windows PHP builds have no default openssl.cnf, so key generation fails
     * there unless it is pointed at the one PHP ships in extras/ssl.
     *
     * @param  array<string, mixed>  $options
     */
    private static function newKey(array $options): \OpenSSLAsymmetricKey
    {
        $key = openssl_pkey_new($options);

        $bundled = dirname(PHP_BINARY).'/extras/ssl/openssl.cnf';

        if ($key === false && is_file($bundled)) {
            $key = openssl_pkey_new([...$options, 'config' => $bundled]);
        }

        return $key ?: throw new RuntimeException('openssl_pkey_new failed: '.openssl_error_string());
    }

    public function credentialIdB64(): string
    {
        return Base64UrlSafe::encodeUnpadded($this->credentialId);
    }

    /**
     * The public key as a COSE_Key in CBOR, the form a browser hands over at
     * registration and laravel/passkeys stores (P-256 is ES256, RSA is RS256).
     */
    public function coseKey(): string
    {
        $details = openssl_pkey_get_details(openssl_pkey_get_public($this->publicKeyPem)
            ?: throw new RuntimeException('public key could not be read'));

        if (isset($details['ec'])) {
            return self::cborMap([
                1 => 2,   // kty: EC2
                3 => -7,  // alg: ES256
                -1 => 1,  // crv: P-256
                -2 => ['bytes' => str_pad($details['ec']['x'], 32, "\0", STR_PAD_LEFT)],
                -3 => ['bytes' => str_pad($details['ec']['y'], 32, "\0", STR_PAD_LEFT)],
            ]);
        }

        return self::cborMap([
            1 => 3,    // kty: RSA
            3 => -257, // alg: RS256
            -1 => ['bytes' => $details['rsa']['n']],
            -2 => ['bytes' => $details['rsa']['e']],
        ]);
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

    /**
     * The `credential` body a browser posts after navigator.credentials.get().
     *
     * @param  array{challenge: string, rpId?: string}  $options  the JSON options the server sent
     * @return array<string, mixed>
     */
    public function assert(array $options, ?string $origin = null): array
    {
        $rpId = $options['rpId'] ?? parse_url((string) config('app.url'), PHP_URL_HOST);
        $origin ??= rtrim((string) config('app.url'), '/');

        $clientData = json_encode([
            'type' => 'webauthn.get',
            'challenge' => $options['challenge'],
            'origin' => $origin,
            'crossOrigin' => false,
        ], JSON_UNESCAPED_SLASHES);

        $this->counter++;
        // rpIdHash, flags UP|UV, sign counter
        $authData = hash('sha256', $rpId, true).chr(0x05).pack('N', $this->counter);

        return [
            'id' => $this->credentialIdB64(),
            'rawId' => $this->credentialIdB64(),
            'type' => 'public-key',
            'response' => [
                'clientDataJSON' => Base64UrlSafe::encodeUnpadded($clientData),
                'authenticatorData' => Base64UrlSafe::encodeUnpadded($authData),
                'signature' => Base64UrlSafe::encodeUnpadded($this->sign($authData.hash('sha256', $clientData, true))),
                'userHandle' => Base64UrlSafe::encodeUnpadded($this->userHandle),
            ],
            'clientExtensionResults' => [],
        ];
    }

    private function sign(string $data): string
    {
        if (! openssl_sign($data, $signature, $this->privateKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('signing failed');
        }

        return $signature;
    }
}
