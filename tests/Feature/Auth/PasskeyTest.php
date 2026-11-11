<?php

namespace Tests\Feature\Auth;

use App\Models\Passkey;
use App\Models\User;
use App\Support\LegacyPasskeys;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use ParagonIE\ConstantTime\Base64UrlSafe;
use Tests\Support\RegistersPasskeys;
use Tests\Support\SoftwareAuthenticator;
use Tests\TestCase;

/**
 * Passkeys on laravel/passkeys (card 4237): real assertions signed by a
 * software authenticator, and the copy of laragear/webauthn's credentials.
 */
class PasskeyTest extends TestCase
{
    use RegistersPasskeys;

    public function test_a_passkey_signs_the_user_in(): void
    {
        $user = User::factory()->create(['name' => 'Kaori']);
        $authenticator = $this->registerPasskey($user);

        $this->signInWith($authenticator)
            ->assertOk()
            ->assertJson(['message' => 'Welcome back, Kaori!', 'redirect' => route('home')]);

        $this->assertAuthenticatedAs($user);

        $passkey = Passkey::query()->sole();
        $this->assertNotNull($passkey->last_used_at);
        $this->assertSame(1, $passkey->credential['counter']);
    }

    public function test_an_assertion_for_another_challenge_is_refused(): void
    {
        $authenticator = $this->registerPasskey(User::factory()->create());

        $this->getJson(route('passkeys.login.options'))->assertOk();

        $this->postJson(route('passkeys.login'), [
            'credential' => $authenticator->assert(['challenge' => Base64UrlSafe::encodeUnpadded(random_bytes(32))]),
        ])->assertUnprocessable()->assertJsonValidationErrors('credential');

        $this->assertGuest();
    }

    public function test_an_assertion_from_another_origin_is_refused(): void
    {
        $authenticator = $this->registerPasskey(User::factory()->create());

        $options = $this->getJson(route('passkeys.login.options'))->json('options');

        $this->postJson(route('passkeys.login'), [
            'credential' => $authenticator->assert($options, 'https://evil.example'),
        ])->assertUnprocessable();

        $this->assertGuest();
    }

    public function test_an_unknown_passkey_is_refused(): void
    {
        $this->registerPasskey(User::factory()->create());
        $stranger = SoftwareAuthenticator::es256('someone-else');

        $this->signInWith($stranger)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Passkey not recognized. It may have been removed from your account.');

        $this->assertGuest();
    }

    public function test_a_deleted_account_cannot_sign_in_with_its_passkey(): void
    {
        $user = User::factory()->create();
        $authenticator = $this->registerPasskey($user);
        $user->delete();

        $this->signInWith($authenticator)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Unable to sign in with this account.');

        $this->assertGuest();
    }

    public function test_passkey_sign_ins_are_throttled_per_ip_not_in_one_shared_bucket(): void
    {
        $this->registerPasskey(User::factory()->create());

        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1']);

        for ($i = 0; $i < 5; $i++) {
            $this->getJson(route('passkeys.login.options'))->assertOk();
        }

        $this->getJson(route('passkeys.login.options'))->assertTooManyRequests();

        // Another visitor (no email either) still gets through.
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
            ->getJson(route('passkeys.login.options'))
            ->assertOk();
    }

    public function test_signed_in_users_cannot_fetch_login_options(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route('passkeys.login.options'))
            ->assertRedirect();
    }

    public function test_registration_options_carry_the_users_handle(): void
    {
        $user = User::factory()->create(['email' => 'reg@example.com']);
        $this->registerPasskey($user);

        $options = $this->actingAs($user)
            ->getJson(route('settings.passkeys.options'))
            ->assertOk()
            ->json('options');

        $this->assertSame(Base64UrlSafe::encodeUnpadded($user->getPasskeyUserHandle()), $options['user']['id']);
        $this->assertSame('reg@example.com', $options['user']['name']);
        $this->assertCount(1, $options['excludeCredentials']);
        $this->assertSame('required', $options['authenticatorSelection']['residentKey']);
    }

    public function test_registration_needs_a_signed_in_user_and_a_valid_credential(): void
    {
        $this->getJson(route('settings.passkeys.options'))->assertUnauthorized();

        $user = User::factory()->create();
        $this->actingAs($user)->getJson(route('settings.passkeys.options'))->assertOk();

        $this->actingAs($user)->postJson(route('settings.passkeys.store'), [
            'name' => 'Laptop',
            'credential' => ['id' => 'x', 'rawId' => 'x', 'type' => 'public-key', 'response' => ['clientDataJSON' => 'x']],
        ])->assertUnprocessable();

        $this->assertDatabaseCount('passkeys', 0);
    }

    public function test_settings_lists_renames_and_removes_only_the_users_own_passkeys(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->registerPasskey($user, 'Phone');
        $this->registerPasskey($other, 'Not yours');
        $mine = Passkey::query()->where('user_id', $user->id)->sole();
        $theirs = Passkey::query()->where('user_id', $other->id)->sole();

        $this->actingAs($user)->get(route('settings'))
            ->assertInertia(fn ($page) => $page
                ->has('passkeys', 1)
                ->where('passkeys.0.id', (string) $mine->id)
                ->where('passkeys.0.alias', 'Phone'));

        $this->actingAs($user)->patch(route('settings.passkeys.update', $theirs), ['alias' => 'Mine now'])->assertNotFound();
        $this->actingAs($user)->delete(route('settings.passkeys.destroy', $theirs))->assertNotFound();
        $this->assertSame('Not yours', $theirs->fresh()->name);

        $this->actingAs($user)->patch(route('settings.passkeys.update', $mine), ['alias' => 'Work phone'])->assertRedirect();
        $this->assertSame('Work phone', $mine->fresh()->name);

        $this->actingAs($user)->delete(route('settings.passkeys.destroy', $mine))->assertRedirect();
        $this->assertModelMissing($mine);
        $this->assertModelExists($theirs);
    }

    public function test_laragear_passkeys_are_copied_and_still_sign_in(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $legacy = [
            [$user, $this->legacyRow($user, SoftwareAuthenticator::es256(), '0f3a52d4-6c1e-4b8e-9a7d-2c5b8e1f4a90', 'YubiKey')],
            [$user, $this->legacyRow($user, SoftwareAuthenticator::rs256(), '0f3a52d4-6c1e-4b8e-9a7d-2c5b8e1f4a90', null)],
            [$other, $this->legacyRow($other, SoftwareAuthenticator::es256(), 'ab12cd34ef56ab12cd34ef56ab12cd34', 'Phone')],
        ];

        $result = LegacyPasskeys::copyAll();

        $this->assertSame(['copied' => 3, 'skipped' => []], $result);
        $this->assertSame(['YubiKey', 'Passkey'], Passkey::query()->where('user_id', $user->id)->orderBy('id')->pluck('name')->all());

        // Running it again (a re-run migration) adds nothing.
        $this->assertSame(0, LegacyPasskeys::copyAll()['copied']);

        $this->assertLegacyPasskeysSignIn($legacy);
    }

    public function test_laragear_ed25519_passkeys_are_reported_not_copied(): void
    {
        // laravel/passkeys verifies ES256 and RS256 only: a copied Ed25519 key
        // failed at sign-in with "Unsupported algorithm" (a 500, first CI run).
        $user = User::factory()->create();
        $this->legacyRow($user, SoftwareAuthenticator::es256(), 'ab12cd34ef56ab12cd34ef56ab12cd34', 'Phone', [
            'public_key' => Crypt::encryptString(SoftwareAuthenticator::ed25519PublicKeyPem()),
        ]);

        $result = LegacyPasskeys::copyAll();

        $this->assertSame(0, $result['copied']);
        $this->assertCount(1, $result['skipped']);
        $this->assertStringContainsString('Ed25519 keys are not supported', $result['skipped'][0]);
        $this->assertDatabaseCount('passkeys', 0);
    }

    /**
     * @param  list<array{User, SoftwareAuthenticator}>  $legacy
     */
    private function assertLegacyPasskeysSignIn(array $legacy): void
    {
        // Two requests per sign-in; production allows 5 a minute per IP.
        config(['auth.throttle_per_minute' => 60]);

        foreach ($legacy as [$owner, $authenticator]) {
            $this->signInWith($authenticator)->assertOk();
            $this->assertAuthenticatedAs($owner);
            $this->post(route('logout'));
            $this->flushSession();
            auth()->forgetGuards();
        }
    }

    public function test_laragear_passkeys_that_cannot_be_used_are_reported_and_left_out(): void
    {
        $user = User::factory()->create();
        $gone = User::factory()->create();

        $this->legacyRow($user, SoftwareAuthenticator::es256(), '0f3a52d4-6c1e-4b8e-9a7d-2c5b8e1f4a90', 'Disabled', ['disabled_at' => now()]);
        $this->legacyRow($user, SoftwareAuthenticator::es256(), '0f3a52d4-6c1e-4b8e-9a7d-2c5b8e1f4a90', 'Broken', ['public_key' => Crypt::encryptString('not a key')]);
        $this->legacyRow($gone, SoftwareAuthenticator::es256(), 'ab12cd34ef56ab12cd34ef56ab12cd34', 'Gone');
        $gone->forceDelete();

        $result = LegacyPasskeys::copyAll();

        $this->assertSame(0, $result['copied']);
        $this->assertCount(3, $result['skipped']);
        $this->assertStringContainsString('disabled', $result['skipped'][0]);
        $this->assertStringContainsString('public key could not be read', $result['skipped'][1]);
        $this->assertStringContainsString('user no longer exists', $result['skipped'][2]);
        $this->assertDatabaseCount('passkeys', 0);
    }

    /**
     * A webauthn_credentials row as laragear/webauthn wrote it: the browser's
     * credential id, the user's UUID as the handle (the authenticator holds
     * base64url_decode(<32 hex chars>), as SimpleWebAuthn 13 sent it) and the
     * public key as an encrypted PEM.
     *
     * @param  array<string, mixed>  $overrides
     */
    private function legacyRow(User $user, SoftwareAuthenticator $authenticator, string $uuid, ?string $alias, array $overrides = []): SoftwareAuthenticator
    {
        $hex = str_replace('-', '', $uuid);
        $authenticator->userHandle = Base64UrlSafe::decodeNoPadding($hex);

        DB::table('webauthn_credentials')->insert([
            'id' => $authenticator->credentialIdB64(),
            'authenticatable_type' => User::class,
            'authenticatable_id' => $user->id,
            'user_id' => $hex,
            'alias' => $alias,
            'counter' => 0,
            'rp_id' => 'localhost',
            'origin' => rtrim((string) config('app.url'), '/'),
            'transports' => json_encode(['internal']),
            'aaguid' => '00000000-0000-0000-0000-000000000000',
            'public_key' => Crypt::encryptString($authenticator->publicKeyPem),
            'attestation_format' => 'none',
            'certificates' => null,
            'disabled_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
            ...$overrides,
        ]);

        return $authenticator;
    }
}
