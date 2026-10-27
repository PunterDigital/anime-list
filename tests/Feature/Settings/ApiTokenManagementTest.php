<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use App\Services\FeatureFlagService;
use Laravel\Pennant\Feature;
use Tests\TestCase;

class ApiTokenManagementTest extends TestCase
{
    /**
     * Inertia XHR headers so the Laravel error handler returns JSON rather
     * than re-rendering the Inertia error page (which needs Vite).
     */
    private const INERTIA = [
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
    ];

    private function enabledUser(): User
    {
        $user = User::factory()->create();
        Feature::for($user)->activate('public-api');

        return $user;
    }

    public function test_settings_page_hides_tokens_section_when_feature_flag_is_off(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('publicApiEnabled', false)
                ->where('apiTokens', [])
            );
    }

    public function test_settings_page_shows_tokens_section_when_flag_is_global_everyone(): void
    {
        $user = User::factory()->create();
        // Simulate an admin flipping "public-api" to Everyone in /admin/features.
        app(FeatureFlagService::class)->setGlobalStatus('public-api', 'everyone');

        $this->actingAs($user)
            ->get('/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('publicApiEnabled', true)
                ->has('apiTokens')
            );
    }

    public function test_settings_page_lists_tokens_when_flag_is_on(): void
    {
        $user = $this->enabledUser();
        $user->createToken('Chrome Extension');

        $this->actingAs($user)
            ->get('/settings')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('publicApiEnabled', true)
                ->has('apiTokens', 1)
                ->where('apiTokens.0.name', 'Chrome Extension')
            );
    }

    public function test_users_can_create_an_api_token(): void
    {
        $user = $this->enabledUser();

        $this->actingAs($user)
            ->withHeaders(self::INERTIA)
            ->from('/settings')
            ->post('/settings/api-tokens', ['name' => 'My integration'])
            ->assertRedirect('/settings')
            ->assertSessionHas('newApiToken');

        $this->assertSame(1, $user->tokens()->count());
        $this->assertSame('My integration', $user->tokens()->first()->name);
    }

    public function test_creating_a_token_requires_a_name(): void
    {
        $user = $this->enabledUser();

        $this->actingAs($user)
            ->withHeaders(self::INERTIA)
            ->from('/settings')
            ->post('/settings/api-tokens', ['name' => ''])
            ->assertSessionHasErrors('name');

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_creating_a_token_is_forbidden_without_the_feature_flag(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withHeaders(self::INERTIA)
            ->from('/settings')
            ->post('/settings/api-tokens', ['name' => 'Anything'])
            ->assertForbidden();

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_users_can_revoke_their_own_token(): void
    {
        $user = $this->enabledUser();
        $token = $user->createToken('Chrome Extension')->accessToken;

        $this->actingAs($user)
            ->withHeaders(self::INERTIA)
            ->from('/settings')
            ->delete("/settings/api-tokens/{$token->id}")
            ->assertRedirect('/settings');

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_users_cannot_revoke_tokens_they_do_not_own(): void
    {
        $owner = $this->enabledUser();
        $intruder = $this->enabledUser();
        $token = $owner->createToken('Chrome Extension')->accessToken;

        $this->actingAs($intruder)
            ->withHeaders(self::INERTIA)
            ->from('/settings')
            ->delete("/settings/api-tokens/{$token->id}")
            ->assertNotFound();

        $this->assertSame(1, $owner->tokens()->count());
    }

    public function test_api_requests_record_token_usage_metadata(): void
    {
        $user = $this->enabledUser();
        $plain = $user->createToken('Chrome Extension')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $plain")
            ->withHeader('User-Agent', 'AniTrackChromeExt/1.0')
            ->withServerVariables(['REMOTE_ADDR' => '203.0.113.7'])
            ->getJson('/api/v1/user')
            ->assertOk();

        $token = $user->tokens()->first();
        $this->assertNotNull($token->last_used_at);
        $this->assertSame('203.0.113.7', $token->last_used_ip);
        $this->assertSame('AniTrackChromeExt/1.0', $token->last_used_user_agent);
    }
}
