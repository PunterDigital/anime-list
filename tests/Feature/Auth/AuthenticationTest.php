<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertOk();
    }

    public function test_users_can_authenticate_with_correct_credentials(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('home'));
    }

    public function test_users_cannot_authenticate_with_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_authenticated_users_can_log_out(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect(route('home'));
    }

    public function test_guests_cannot_access_the_list_page(): void
    {
        $response = $this->get('/list');

        $response->assertRedirect('/login');
    }

    // Production allows 5 auth requests a minute per IP and per email; only the
    // E2E servers raise it (AUTH_THROTTLE_PER_MINUTE, card 4479).
    public function test_the_sixth_login_attempt_in_a_minute_is_throttled(): void
    {
        $this->assertSame(5, config('auth.throttle_per_minute'));

        for ($i = 1; $i <= 5; $i++) {
            $this->post('/login', ['email' => "user{$i}@example.com", 'password' => 'wrong'])
                ->assertStatus(302);
        }

        $this->post('/login', ['email' => 'user6@example.com', 'password' => 'wrong'])
            ->assertStatus(429);
    }
}
