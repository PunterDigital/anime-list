<?php

namespace Tests\Feature\Auth;

use App\Models\Passkey;
use App\Models\User;
use ParagonIE\ConstantTime\Base64UrlSafe;
use Tests\Support\RegistersPasskeys;
use Tests\Support\SoftwareAuthenticator;
use Tests\TestCase;

/**
 * Passkeys on laravel/passkeys (card 4237): real assertions signed by a
 * software authenticator.
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

    public function test_an_rs256_passkey_signs_the_user_in(): void
    {
        $user = User::factory()->create();
        $authenticator = $this->registerPasskey($user, authenticator: SoftwareAuthenticator::rs256($user->getPasskeyUserHandle()));

        $this->signInWith($authenticator)->assertOk();

        $this->assertAuthenticatedAs($user);
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
}
