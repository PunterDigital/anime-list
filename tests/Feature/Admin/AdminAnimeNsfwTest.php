<?php

namespace Tests\Feature\Admin;

use App\Models\Anime;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Services\FeatureFlagService;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Card 4198: admins mark a title NSFW that AniList does not flag as adult.
 */
class AdminAnimeNsfwTest extends TestCase
{
    public function test_admin_marks_a_title_nsfw_and_clears_it_again(): void
    {
        $this->actingAsAdmin();
        $anime = Anime::factory()->create();

        $this->patch("/admin/anime/{$anime->id}/nsfw", ['nsfw' => true])
            ->assertRedirect(route('admin.anime.edit', $anime));

        $anime->refresh();
        $this->assertTrue($anime->isNsfw());
        $this->assertFalse($anime->is_adult);
        $since = $anime->nsfw_at;

        // Saving it again keeps the first date.
        $this->travel(1)->hours();
        $this->patch("/admin/anime/{$anime->id}/nsfw", ['nsfw' => true]);
        $this->assertEquals($since, $anime->fresh()->nsfw_at);

        $this->get("/admin/anime/{$anime->id}/edit")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('anime.is_nsfw', true)
                ->where('anime.is_adult', false));

        $this->patch("/admin/anime/{$anime->id}/nsfw", ['nsfw' => false])->assertRedirect();
        $this->assertFalse($anime->fresh()->isNsfw());
    }

    public function test_only_admins_mark_a_title_nsfw(): void
    {
        $anime = Anime::factory()->create();

        $this->actingAs(User::factory()->create())
            ->patch("/admin/anime/{$anime->id}/nsfw", ['nsfw' => true])
            ->assertForbidden();

        $this->assertFalse($anime->fresh()->isNsfw());
    }

    public function test_an_anilist_refresh_does_not_clear_the_mark(): void
    {
        $anime = Anime::factory()->create(['nsfw_at' => now()]);

        // A refresh writes AniList's fields, is_adult among them.
        $anime->forceFill(['is_adult' => false, 'title_english' => 'Refreshed'])->save();

        $this->assertTrue($anime->fresh()->isNsfw());
    }

    public function test_the_admin_list_filters_nsfw_only(): void
    {
        $this->actingAsAdmin();
        Anime::factory()->create(['title_english' => 'Plain']);
        $nsfw = Anime::factory()->create(['title_english' => 'Marked', 'nsfw_at' => now()]);

        $this->get('/admin/anime?nsfw_only=1')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('anime.data', 1)
                ->where('anime.data.0.id', $nsfw->id)
                ->where('anime.data.0.is_nsfw', true)
                ->where('filters.nsfw_only', true));
    }

    public function test_nsfw_titles_are_left_out_of_search_and_listings(): void
    {
        Anime::factory()->create(['title_english' => 'Komi Plain', 'popularity' => 10, 'average_score' => 80]);
        Anime::factory()->create(['title_english' => 'Komi Marked', 'popularity' => 20, 'average_score' => 90, 'nsfw_at' => now()]);

        $this->assertSame(['Komi Plain'], Anime::query()->safeForWork()->pluck('title_english')->all());

        $this->getJson('/api/search?q=komi')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.title_english', 'Komi Plain');

        $this->get('/top')->assertOk()->assertDontSee('Komi Marked');
        $this->get('/sitemap.xml')->assertOk()->assertDontSee('komi-marked');
    }

    public function test_a_cached_search_drops_a_title_marked_after_it(): void
    {
        $plain = Anime::factory()->create(['title_english' => 'Frieren One', 'popularity' => 10]);
        $later = Anime::factory()->create(['title_english' => 'Frieren Two', 'popularity' => 20]);

        $this->getJson('/api/search?q=frieren')->assertJsonPath('total', 2);

        $this->actingAsAdmin();
        $this->patch("/admin/anime/{$later->id}/nsfw", ['nsfw' => true]);

        $this->getJson('/api/search?q=frieren')
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.id', $plain->id);
    }

    public function test_a_guest_gets_a_sign_in_page_and_a_signed_in_user_the_title(): void
    {
        $anime = Anime::factory()->create(['title_english' => 'Marked Show', 'nsfw_at' => now()]);

        $this->get("/anime/{$anime->slug}")
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('AnimeNsfwGatePage')
                ->where('slug', $anime->slug)
                ->missing('anime'));

        $this->actingAs(User::factory()->create())
            ->get("/anime/{$anime->slug}")
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('AnimeDetailPage')
                ->where('anime.title_english', 'Marked Show')
                ->where('og.noindex', true));
    }

    public function test_guests_do_not_see_nsfw_titles_in_public_lists_and_playlists(): void
    {
        $owner = User::factory()->create(['list_is_public' => true]);
        $plain = Anime::factory()->create();
        $marked = Anime::factory()->create(['nsfw_at' => now()]);
        UserAnimeList::factory()->create(['user_id' => $owner->id, 'anime_id' => $plain->id]);
        UserAnimeList::factory()->create(['user_id' => $owner->id, 'anime_id' => $marked->id]);

        $this->get("/user/{$owner->username}/list")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('entries', 1)
                ->where('entries.0.anime.id', $plain->id));

        $viewer = User::factory()->create();
        $this->actingAs($viewer)->get("/user/{$owner->username}/list")
            ->assertInertia(fn (AssertableInertia $page) => $page->has('entries', 2));

        app(FeatureFlagService::class)->activateForUser('playlists', $owner);
        $playlist = Playlist::factory()->public()->create(['user_id' => $owner->id]);
        PlaylistItem::factory()->create(['playlist_id' => $playlist->id, 'anime_id' => $plain->id, 'position' => 1]);
        PlaylistItem::factory()->create(['playlist_id' => $playlist->id, 'anime_id' => $marked->id, 'position' => 2]);

        auth()->logout();
        $this->get("/playlist/{$playlist->slug}")
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->has('playlist.items', 1));

        $this->actingAs($viewer)->get("/playlist/{$playlist->slug}")
            ->assertInertia(fn (AssertableInertia $page) => $page->has('playlist.items', 2));

        // The owner's own list keeps it.
        $this->actingAs($owner)->get('/list')
            ->assertInertia(fn (AssertableInertia $page) => $page->has('entries', 2));
    }
}
