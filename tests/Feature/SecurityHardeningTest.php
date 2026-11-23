<?php

namespace Tests\Feature;

use App\Http\Controllers\AnimeController;
use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Services\AniListClient;
use App\Services\MalImportService;
use App\Support\ApiTokenLifetime;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Pennant\Feature;
use Mockery;
use Tests\TestCase;

/**
 * Card 5529: the low findings of the security audit (#5472).
 */
class SecurityHardeningTest extends TestCase
{
    public function test_horizon_is_for_admins_whatever_their_email(): void
    {
        $impostor = User::factory()->create(['email' => 'shay@shaypunter.co.uk', 'is_admin' => false]);
        $admin = User::factory()->create(['is_admin' => true]);

        $this->assertFalse(Gate::forUser($impostor)->allows('viewHorizon'));
        $this->assertTrue(Gate::forUser($admin)->allows('viewHorizon'));
        $this->assertFalse(Gate::allows('viewHorizon'));
    }

    public function test_profile_stats_leave_out_private_entries_for_other_viewers(): void
    {
        $owner = User::factory()->create(['list_is_public' => true]);
        UserAnimeList::factory()->for($owner)->create(['status' => UserAnimeList::STATUS_WATCHING, 'score' => 6, 'progress' => 3]);
        UserAnimeList::factory()->for($owner)->create(['status' => UserAnimeList::STATUS_COMPLETED, 'score' => 10, 'progress' => 24, 'is_private' => true]);

        $this->get(route('profile.show', $owner))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats_hidden', false)
                ->where('stats', ['watching' => 1])
                ->where('avg_score', 6)
                ->where('episodes_watched', 3));

        $this->actingAs($owner)->get(route('profile.show', $owner))
            ->assertInertia(fn ($page) => $page
                ->where('stats', ['watching' => 1, 'completed' => 1])
                ->where('avg_score', 8)
                ->where('episodes_watched', 27));
    }

    public function test_a_private_list_shows_no_profile_stats_to_others(): void
    {
        $owner = User::factory()->create(['list_is_public' => false]);
        UserAnimeList::factory()->for($owner)->create(['status' => UserAnimeList::STATUS_WATCHING, 'score' => 7, 'progress' => 5]);

        $hidden = fn ($page) => $page
            ->where('stats_hidden', true)
            ->where('stats', [])
            ->where('avg_score', null)
            ->where('episodes_watched', 0);

        $this->get(route('profile.show', $owner))->assertOk()->assertInertia($hidden);
        $this->actingAs(User::factory()->create())->get(route('profile.show', $owner))->assertInertia($hidden);

        $this->actingAs($owner)->get(route('profile.show', $owner))
            ->assertInertia(fn ($page) => $page->where('stats_hidden', false)->where('stats', ['watching' => 1]));
    }

    public function test_changing_the_password_signs_other_browsers_out_and_revokes_api_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('Chrome Extension');
        $oldHash = $user->getAuthPassword();

        $this->actingAs($user)
            ->patch(route('settings.password'), [
                'current_password' => 'password',
                'password' => 'a-new-password',
                'password_confirmation' => 'a-new-password',
            ])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('message', 'Password updated. You were signed out on your other devices, and your API tokens were revoked.');

        $this->assertSame(0, $user->tokens()->count());

        // This browser stays signed in.
        $this->get(route('settings'))->assertOk();

        // Another browser's session still holds the old password's hash: signed out.
        $this->flushSession();
        $this->actingAs($user->fresh())
            ->withSession(['password_hash_web' => $oldHash])
            ->get(route('settings'))
            ->assertRedirect(route('login'));
    }

    public function test_changing_the_email_needs_the_current_password(): void
    {
        $user = User::factory()->create(['email' => 'old@example.com', 'username' => 'email_tester']);
        $profile = [
            'name' => $user->name,
            'username' => $user->username,
            'email' => 'new@example.com',
            'timezone' => 'UTC',
        ];

        $this->actingAs($user)->patch(route('settings.profile'), $profile)
            ->assertSessionHasErrors(['current_password' => 'Enter your current password to change your email address.']);
        $this->actingAs($user)->patch(route('settings.profile'), [...$profile, 'current_password' => 'wrong'])
            ->assertSessionHasErrors('current_password');
        $this->assertSame('old@example.com', $user->fresh()->email);

        $this->actingAs($user)->patch(route('settings.profile'), [...$profile, 'current_password' => 'password'])
            ->assertSessionHasNoErrors();
        $this->assertSame('new@example.com', $user->fresh()->email);

        // Other profile edits (and a change of case only) need no password.
        $this->actingAs($user->fresh())->patch(route('settings.profile'), [...$profile, 'email' => 'New@example.com', 'bio' => 'Hi'])
            ->assertSessionHasNoErrors();
        $this->assertSame('Hi', $user->fresh()->bio);
    }

    public function test_api_tokens_unused_for_half_a_year_stop_working_and_are_pruned(): void
    {
        $user = User::factory()->create();
        Feature::for($user)->activate('public-api');

        $stale = $user->createToken('Old laptop');
        $stale->accessToken->forceFill(['last_used_at' => now()->subDays(ApiTokenLifetime::INACTIVE_DAYS + 1)])->save();
        $neverUsed = $user->createToken('Never used');
        $neverUsed->accessToken->forceFill(['created_at' => now()->subDays(ApiTokenLifetime::INACTIVE_DAYS + 1)])->save();
        $fresh = $user->createToken('Extension');

        $this->withToken($stale->plainTextToken)->getJson('/api/v1/user')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $this->withToken($fresh->plainTextToken)->getJson('/api/v1/user')->assertOk();

        $this->artisan('api-tokens:prune-unused')->assertSuccessful();

        $this->assertSame(['Extension'], $user->tokens()->pluck('name')->all());
    }

    public function test_on_demand_anilist_fetches_are_throttled_per_ip_and_site_wide(): void
    {
        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('interactive')->andReturnSelf();
        $client->shouldReceive('query')->andReturn(['Media' => null]);
        $this->instance(AniListClient::class, $client);

        for ($i = 1; $i <= AnimeController::ANILIST_FETCHES_PER_IP; $i++) {
            $this->get(route('anime.show.anilist', ['anilistId' => 900000 + $i]))->assertNotFound();
        }
        $this->get(route('anime.show.anilist', ['anilistId' => 900099]))
            ->assertRedirect(route('home'))
            ->assertSessionHas('flash.type', 'error');

        // Titles already in the database are never limited.
        $local = Anime::factory()->create();
        $this->get(route('anime.show.anilist', ['anilistId' => $local->anilist_id]))
            ->assertRedirect(route('anime.show', $local));

        // Another visitor still gets through until the site-wide cap.
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.7'])
            ->get(route('anime.show.anilist', ['anilistId' => 900100]))
            ->assertNotFound();

        RateLimiter::clear('anilist-fetch:ip:203.0.113.8');
        for ($i = 0; $i < AnimeController::ANILIST_FETCHES_PER_SITE; $i++) {
            RateLimiter::hit('anilist-fetch:site', 60);
        }
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.8'])
            ->get(route('anime.show.anilist', ['anilistId' => 900101]))
            ->assertRedirect(route('home'));
    }

    public function test_a_mal_import_that_inflates_past_the_cap_is_refused(): void
    {
        $service = app(MalImportService::class);
        $service->maxXmlBytes = 1000;
        $this->instance(MalImportService::class, $service);

        $xml = '<?xml version="1.0"?><myanimelist>'.str_repeat('<!-- padding -->', 200).'</myanimelist>';
        $path = tempnam(sys_get_temp_dir(), 'mal');
        file_put_contents($path, gzencode($xml));

        try {
            $this->expectException(\InvalidArgumentException::class);
            $this->expectExceptionMessage('over 50 MB unzipped');
            $service->parse($path, User::factory()->create()->id);
        } finally {
            @unlink($path);
        }
    }

    public function test_the_consent_mode_default_comes_before_the_google_tag_config(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $default = strpos($html, "gtag('consent','default'");
        $config = strpos($html, "gtag('config'");

        $this->assertNotFalse($default);
        $this->assertNotFalse($config);
        $this->assertLessThan($config, $default);
        $this->assertStringContainsString('"analytics_storage":"denied"', $html);
        $this->assertStringContainsString('"GB"', $html);
    }
}
