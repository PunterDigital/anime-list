<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Anime;
use App\Models\Studio;
use App\Models\User;
use Tests\TestCase;

/**
 * Card 5710: Inertia visits leave out the Ziggy route list and the browse
 * filter options the client already has; non-admins get no admin.* or
 * horizon.* route names.
 */
class LighterPagesTest extends TestCase
{
    /** @return array<string, string> */
    private function inertiaHeaders(array $extra = []): array
    {
        return [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
            ...$extra,
        ];
    }

    private function seedBrowse(): void
    {
        $studio = Studio::factory()->create(['name' => 'Sunrise', 'is_animation_studio' => true]);
        foreach (range(1, 30) as $n) {
            $anime = Anime::factory()->create(['is_adult' => false, 'title_romaji' => "Browse {$n}"]);
            $anime->studios()->attach($studio->id, ['is_main' => true]);
        }
    }

    public function test_a_first_load_has_the_route_list_and_the_filter_options(): void
    {
        $this->seedBrowse();

        $page = $this->get('/anime')->assertOk()->viewData('page');

        $this->assertArrayHasKey('ziggy', $page['props']);
        $this->assertArrayHasKey('studios', $page['props']);
        $this->assertSame('Sunrise', $page['props']['studios'][0]['name']);
        $this->assertContains('studios', array_keys($page['onceProps'] ?? []));
    }

    public function test_a_second_inertia_visit_sends_neither_the_route_list_nor_the_filter_options(): void
    {
        $this->seedBrowse();

        $json = $this->get('/anime?page=2', $this->inertiaHeaders([
            'X-Inertia-Except-Once-Props' => 'genres,studios',
        ]))->assertOk()->json();

        $this->assertSame('AnimeIndexPage', $json['component']);
        $this->assertArrayNotHasKey('ziggy', $json['props']);
        $this->assertArrayNotHasKey('studios', $json['props']);
        $this->assertArrayNotHasKey('genres', $json['props']);
        $this->assertNotEmpty($json['props']['anime']['data']);
    }

    public function test_an_inertia_visit_without_the_once_props_still_gets_them(): void
    {
        $this->seedBrowse();

        $json = $this->get('/anime?page=2', $this->inertiaHeaders())->assertOk()->json();

        $this->assertArrayNotHasKey('ziggy', $json['props']);
        $this->assertSame('Sunrise', $json['props']['studios'][0]['name']);
    }

    public function test_guests_and_members_get_no_admin_or_horizon_route_names(): void
    {
        foreach ([null, User::factory()->create()] as $viewer) {
            $response = $viewer ? $this->actingAs($viewer)->get('/schedule') : $this->get('/schedule');
            $html = $response->assertOk()->getContent();
            $routes = array_keys($response->viewData('page')['props']['ziggy']['routes']);

            $this->assertStringNotContainsString('"admin.dashboard"', $html);
            $this->assertStringNotContainsString('"horizon.', $html);
            $this->assertNotContains('admin.dashboard', $routes);
            $this->assertContains('anime.show', $routes);
            $this->assertStringContainsString('"anime.show"', $html);
        }
    }

    public function test_admins_get_every_route_name(): void
    {
        $response = $this->actingAs(User::factory()->admin()->create())->get('/schedule');

        $this->assertStringContainsString('"admin.dashboard"', $response->assertOk()->getContent());
        $this->assertContains('admin.dashboard', array_keys($response->viewData('page')['props']['ziggy']['routes']));
    }

    public function test_an_admin_signing_in_to_an_admin_page_gets_a_full_page_load(): void
    {
        $admin = User::factory()->admin()->create(['password' => bcrypt('a-long-test-password-1')]);

        $this->post('/login', ['email' => $admin->email, 'password' => 'a-long-test-password-1', 'redirect' => '/admin/blog'], $this->inertiaHeaders())
            ->assertStatus(409)
            ->assertHeader('X-Inertia-Location', '/admin/blog');
    }

    public function test_other_sign_ins_stay_inertia_redirects(): void
    {
        $admin = User::factory()->admin()->create(['password' => bcrypt('a-long-test-password-1')]);
        $member = User::factory()->create(['password' => bcrypt('a-long-test-password-1')]);

        $this->post('/login', ['email' => $admin->email, 'password' => 'a-long-test-password-1'], $this->inertiaHeaders())
            ->assertRedirect(route('home'));
        $this->post('/logout', [], $this->inertiaHeaders());

        $this->post('/login', ['email' => $member->email, 'password' => 'a-long-test-password-1', 'redirect' => '/admin/blog'], $this->inertiaHeaders())
            ->assertRedirect('/admin/blog');
    }

    public function test_pages_preconnect_to_the_anilist_cdn(): void
    {
        $this->get('/schedule')->assertOk()
            ->assertSee('<link rel="preconnect" href="https://s4.anilist.co">', false);
    }
}
