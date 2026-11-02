<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Laragear\WebAuthn\Contracts\WebAuthnAuthenticatable;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * "Sign in to track this anime" sends the guest to /login?redirect=/anime/<slug>;
 * after signing in (password or passkey) or signing up they land back there.
 */
class SignInRedirectTest extends TestCase
{
    private const ANIME_PATH = '/anime/cowboy-bebop';

    /**
     * @return array<string, array{string}>
     */
    public static function offSiteTargets(): array
    {
        return [
            'absolute url' => ['https://evil.com/anime/cowboy-bebop'],
            'protocol-relative' => ['//evil.com'],
            'slash backslash' => ['/\evil.com'],
            'tab between slashes' => ["/\t/evil.com"],
            'javascript url' => ['javascript:alert(1)'],
        ];
    }

    public function test_the_login_page_receives_a_safe_redirect(): void
    {
        $this->get(route('login', ['redirect' => self::ANIME_PATH]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('LoginPage')
                ->where('redirect', self::ANIME_PATH));
    }

    #[DataProvider('offSiteTargets')]
    public function test_the_login_page_drops_an_off_site_redirect(string $target): void
    {
        $this->get(route('login', ['redirect' => $target]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('LoginPage')
                ->where('redirect', null));
    }

    public function test_the_register_page_receives_a_safe_redirect(): void
    {
        $this->get(route('register', ['redirect' => self::ANIME_PATH]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('RegisterPage')
                ->where('redirect', self::ANIME_PATH));
    }

    public function test_the_register_page_drops_an_off_site_redirect(): void
    {
        $this->get(route('register', ['redirect' => '//evil.com']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('RegisterPage')
                ->where('redirect', null));
    }

    public function test_password_login_returns_to_the_redirect_path(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
            'redirect' => self::ANIME_PATH,
        ])->assertRedirect(self::ANIME_PATH);

        $this->assertAuthenticatedAs($user);
    }

    #[DataProvider('offSiteTargets')]
    public function test_password_login_ignores_an_off_site_redirect(string $target): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
            'redirect' => $target,
        ]);

        $response->assertRedirect(route('home'));
        $this->assertStringNotContainsString('evil.com', (string) $response->headers->get('Location'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_password_login_without_a_redirect_still_goes_to_the_intended_page(): void
    {
        $user = User::factory()->create();

        $this->get('/list')->assertRedirect('/login');

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertRedirect('/list');
    }

    public function test_the_redirect_path_wins_over_an_older_intended_page(): void
    {
        $user = User::factory()->create();

        $this->get('/list')->assertRedirect('/login');

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
            'redirect' => self::ANIME_PATH,
        ])->assertRedirect(self::ANIME_PATH)
            ->assertSessionMissing('url.intended');
    }

    public function test_registration_returns_to_the_redirect_path(): void
    {
        Event::fake([Registered::class]);

        $this->post('/register', $this->registration(['redirect' => self::ANIME_PATH]))
            ->assertRedirect(self::ANIME_PATH);

        $this->assertAuthenticated();
    }

    #[DataProvider('offSiteTargets')]
    public function test_registration_ignores_an_off_site_redirect(string $target): void
    {
        Event::fake([Registered::class]);

        $this->post('/register', $this->registration(['redirect' => $target]))
            ->assertRedirect(route('home'));

        $this->assertAuthenticated();
    }

    public function test_passkey_login_returns_the_redirect_path(): void
    {
        $this->fakePasskeyLogin(User::factory()->create());

        $this->postJson(route('webauthn.login', ['redirect' => self::ANIME_PATH]))
            ->assertOk()
            ->assertJsonPath('redirect', self::ANIME_PATH);

        $this->assertAuthenticated();
    }

    #[DataProvider('offSiteTargets')]
    public function test_passkey_login_ignores_an_off_site_redirect(string $target): void
    {
        $this->fakePasskeyLogin(User::factory()->create());

        $this->postJson(route('webauthn.login', ['redirect' => $target]))
            ->assertOk()
            ->assertJsonPath('redirect', route('home'));
    }

    public function test_passkey_login_without_a_redirect_goes_to_the_intended_page_or_home(): void
    {
        $this->fakePasskeyLogin(User::factory()->create());

        $this->postJson(route('webauthn.login'))
            ->assertOk()
            ->assertJsonPath('redirect', route('home'));
    }

    public function test_passkey_login_uses_the_intended_page_when_there_is_no_redirect(): void
    {
        $this->fakePasskeyLogin(User::factory()->create());

        $this->withSession(['url.intended' => url('/list')])
            ->postJson(route('webauthn.login'))
            ->assertOk()
            ->assertJsonPath('redirect', url('/list'));
    }

    /**
     * @param  array<string, string>  $extra
     * @return array<string, string>
     */
    private function registration(array $extra = []): array
    {
        return [
            'name' => 'Test User',
            'username' => 'test_user',
            'email' => 'test@example.com',
            'password' => 'password-123',
            'password_confirmation' => 'password-123',
            ...$extra,
        ];
    }

    /**
     * Skip the WebAuthn ceremony: the assertion "succeeds" and logs the user in,
     * so the test covers only what the controller does afterwards.
     */
    private function fakePasskeyLogin(User $user): void
    {
        $this->app->bind(AssertedRequest::class, fn () => new class($user) extends AssertedRequest
        {
            public function __construct(private ?User $fakeUser = null)
            {
                parent::__construct();
            }

            public function rules(): array
            {
                return [];
            }

            public function login(
                ?string $guard = null,
                ?bool $remember = null,
                bool $destroySession = false,
                callable|array|null $callbacks = null,
            ): ?WebAuthnAuthenticatable {
                Auth::login($this->fakeUser);

                return $this->fakeUser;
            }
        });
    }
}
