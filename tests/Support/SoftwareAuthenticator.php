<?php

namespace Tests\Support;

use App\Support\LegacyPasskeys;
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

    public static function ed25519(string $userHandle = ''): self
    {
        $pair = sodium_crypto_sign_keypair();
        $der = hex2bin('302a300506032b6570032100').sodium_crypto_sign_publickey($pair);
        $pem = "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode($der), 64, "\n")."-----END PUBLIC KEY-----\n";

        return new self('ed25519', sodium_crypto_sign_secretkey($pair), $pem, $userHandle);
    }

    public function credentialIdB64(): string
    {
        return Base64UrlSafe::encodeUnpadded($this->credentialId);
    }

    public function coseKey(): string
    {
        return LegacyPasskeys::pemToCose($this->publicKeyPem);
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
        if ($this->type === 'ed25519') {
            return sodium_crypto_sign_detached($data, $this->privateKey);
        }

        if (! openssl_sign($data, $signature, $this->privateKey, OPENSSL_ALGO_SHA256)) {
            throw new RuntimeException('signing failed');
        }

        return $signature;
    }
}
