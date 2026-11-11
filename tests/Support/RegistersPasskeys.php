<?php

namespace Tests\Support;

use App\Models\User;
use Illuminate\Testing\TestResponse;
use Laravel\Passkeys\Support\WebAuthn;
use Symfony\Component\Uid\Uuid;
use Webauthn\CredentialRecord;
use Webauthn\TrustPath\EmptyTrustPath;

trait RegistersPasskeys
{
    /**
     * Store a passkey the way laravel/passkeys' StorePasskey does after a
     * registration, for a software authenticator holding the user's handle.
     */
    protected function registerPasskey(User $user, string $name = 'Passkey'): SoftwareAuthenticator
    {
        $authenticator = SoftwareAuthenticator::es256($user->getPasskeyUserHandle());

        $record = CredentialRecord::create(
            publicKeyCredentialId: $authenticator->credentialId,
            type: 'public-key',
            transports: ['internal'],
            attestationType: 'none',
            trustPath: EmptyTrustPath::create(),
            aaguid: Uuid::fromString('00000000-0000-0000-0000-000000000000'),
            credentialPublicKey: $authenticator->coseKey(),
            userHandle: $user->getPasskeyUserHandle(),
            counter: 0,
        );

        $user->passkeys()->create([
            'name' => $name,
            'credential_id' => $authenticator->credentialIdB64(),
            'credential' => json_decode(WebAuthn::toJson($record), true),
        ]);

        return $authenticator;
    }

    /**
     * Fetch login options and post the authenticator's signed assertion.
     *
     * @param  array<string, string>  $query
     */
    protected function signInWith(SoftwareAuthenticator $authenticator, array $query = []): TestResponse
    {
        $options = $this->getJson(route('passkeys.login.options'))->assertOk()->json('options');

        return $this->postJson(route('passkeys.login', $query), ['credential' => $authenticator->assert($options)]);
    }
}
