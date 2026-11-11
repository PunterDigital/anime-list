<?php

namespace Tests\Feature;

use App\Models\Anime;
use App\Models\Genre;
use App\Models\Recommendation;
use App\Models\User;
use App\Services\FeatureFlagService;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ErrorPageTest extends TestCase
{
    private function enableFlag(): void
    {
        app(FeatureFlagService::class)->setGlobalStatus('error-pages', 'everyone');
    }

    private function hiddenAnime(): Anime
    {
        return Anime::factory()->create([
            'title_english' => 'Secret Hidden Show',
            'hidden_at' => now(),
            'hidden_reason' => 'Takedown',
        ]);
    }

    public function test_the_flag_off_keeps_the_standalone_page(): void
    {
        $this->get('/no-such-page')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ErrorPage')
                ->where('status', 404)
                ->missing('layout')
                ->missing('alternatives'));
    }

    public function test_a_404_uses_the_site_layout_with_the_signed_in_user(): void
    {
        $this->enableFlag();
        $user = User::factory()->create();

        $this->actingAs($user)->get('/no-such-page')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ErrorPage')
                ->where('status', 404)
                ->where('layout', true)
                ->where('suggestedSearch', null)
                ->where('auth.user.id', $user->id)
                ->has('ziggy'));
    }

    public function test_a_missing_anime_url_suggests_a_search_and_shares_the_layout_props(): void
    {
        $this->enableFlag();

        // Route model binding fails before HandleInertiaRequests runs.
        $this->get('/anime/cowboy-bebop-2')
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page
                ->where('layout', true)
                ->where('suggestedSearch', 'cowboy bebop 2')
                ->where('auth.user', null)
                ->has('features')
                ->has('ziggy'));
    }

    public function test_a_hidden_anime_suggests_its_visible_recommendations_first(): void
    {
        $this->enableFlag();
        $hidden = $this->hiddenAnime();
        $genre = Genre::factory()->create();
        $hidden->genres()->attach($genre);

        $best = Anime::factory()->create(['title_english' => 'Best Pick']);
        $second = Anime::factory()->create(['title_english' => 'Second Pick']);
        $alsoHidden = Anime::factory()->create(['hidden_at' => now()]);
        $adult = Anime::factory()->adult()->create();
        foreach ([[$second, 10], [$best, 50], [$alsoHidden, 90], [$adult, 80]] as [$anime, $rating]) {
            Recommendation::create([
                'anime_id' => $hidden->id,
                'recommended_anime_id' => $anime->id,
                'source' => 'anilist',
                'rating' => $rating,
            ]);
        }

        // Fills the rest from the same genre, best score first.
        $genreTop = Anime::factory()->create(['title_english' => 'Genre Top', 'bayesian_score' => 95]);
        $genreLow = Anime::factory()->create(['title_english' => 'Genre Low', 'bayesian_score' => 60]);
        $genreTop->genres()->attach($genre);
        $genreLow->genres()->attach($genre);
        Anime::factory()->create(['title_english' => 'Other Genre']);

        $response = $this->get("/anime/{$hidden->slug}")->assertStatus(451);

        $response->assertInertia(fn (Assert $page) => $page
            ->where('status', 451)
            ->where('layout', true)
            ->has('alternatives', 4)
            ->where('alternatives.0.id', $best->id)
            ->where('alternatives.1.id', $second->id)
            ->where('alternatives.2.id', $genreTop->id)
            ->where('alternatives.3.id', $genreLow->id));

        // Nothing about the hidden anime itself reaches the page.
        $this->assertStringNotContainsString('Secret Hidden Show', $response->getContent());
        $this->assertStringNotContainsString($hidden->slug, json_encode($response->viewData('page')['props']['alternatives']));
    }

    public function test_alternatives_stop_at_six(): void
    {
        $this->enableFlag();
        $hidden = $this->hiddenAnime();
        $genre = Genre::factory()->create();
        $hidden->genres()->attach($genre);
        Anime::factory()->count(8)->create()->each(fn (Anime $a) => $a->genres()->attach($genre));

        $this->get("/anime/{$hidden->slug}")
            ->assertStatus(451)
            ->assertInertia(fn (Assert $page) => $page->has('alternatives', 6));
    }

    public function test_a_hidden_anime_without_recommendations_or_genres_has_no_alternatives(): void
    {
        $this->enableFlag();
        $hidden = $this->hiddenAnime();
        Anime::factory()->create();

        $this->get("/anime/{$hidden->slug}")
            ->assertStatus(451)
            ->assertInertia(fn (Assert $page) => $page->where('alternatives', []));
    }

    public function test_500_stays_standalone_with_the_flag_on(): void
    {
        $this->enableFlag();
        Route::get('/e2e-boom', fn () => abort(500));

        $this->get('/e2e-boom')
            ->assertStatus(500)
            ->assertInertia(fn (Assert $page) => $page->where('status', 500)->missing('layout'));
    }

    public function test_api_errors_stay_json(): void
    {
        $this->enableFlag();

        $this->getJson('/api/v1/no-such-endpoint')->assertNotFound()->assertJsonStructure(['message']);
        $this->assertStringNotContainsString('ErrorPage', $this->get('/api/v1/no-such-endpoint')->assertNotFound()->getContent());
        $this->getJson('/no-such-page')->assertNotFound()->assertJsonStructure(['message']);
    }

    public function test_other_methods_on_unknown_urls_still_404(): void
    {
        $this->post('/no-such-page')->assertNotFound();
        $this->delete('/no-such-page')->assertNotFound();
    }

    // PHPUnit skips the CSRF check, so a POST above can't tell whether the
    // fallback really skips it: check the route's middleware instead (card 4488).
    public function test_the_fallback_skips_the_csrf_middleware_that_real_routes_run(): void
    {
        $router = app('router');
        $fallback = collect($router->getRoutes()->getRoutes())->first(fn ($route) => $route->isFallback);
        $login = $router->getRoutes()->getByName('login');

        $this->assertNotNull($fallback);
        $this->assertContains('web', $fallback->gatherMiddleware());
        $this->assertNotContains(PreventRequestForgery::class, $router->gatherRouteMiddleware($fallback));
        $this->assertContains(PreventRequestForgery::class, $router->gatherRouteMiddleware($login));
    }
}
