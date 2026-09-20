<?php

namespace Tests\Feature\Admin;

use App\Models\Anime;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminAnimeContentReviewTest extends TestCase
{
    private function words(int $count): string
    {
        return trim(str_repeat('word ', $count));
    }

    public function test_synopsis_word_count_is_stored_when_an_anime_is_saved(): void
    {
        $anime = Anime::factory()->create([
            'synopsis' => "<i>One</i> two<br>three\nfour   five (Source: <b>MAL</b>)",
        ]);

        $this->assertSame(7, $anime->fresh()->synopsis_word_count);

        $anime->forceFill(['synopsis' => $this->words(200)])->save();
        $this->assertSame(200, $anime->fresh()->synopsis_word_count);

        $anime->forceFill(['synopsis' => null])->save();
        $this->assertSame(0, $anime->fresh()->synopsis_word_count);
    }

    public function test_thin_content_scope_and_flag_use_the_minimum_word_count(): void
    {
        $thin = Anime::factory()->create(['synopsis' => $this->words(Anime::MIN_INDEXABLE_SYNOPSIS_WORDS - 1)]);
        $exact = Anime::factory()->create(['synopsis' => $this->words(Anime::MIN_INDEXABLE_SYNOPSIS_WORDS)]);
        $empty = Anime::factory()->create(['synopsis' => null]);

        $flagged = Anime::query()->thinContent()->pluck('id');

        $this->assertEqualsCanonicalizing([$thin->id, $empty->id], $flagged->all());
        $this->assertTrue($thin->hasThinContent());
        $this->assertTrue($empty->hasThinContent());
        $this->assertFalse($exact->hasThinContent());
    }

    public function test_admin_anime_list_flags_thin_pages_and_reports_the_total(): void
    {
        $this->actingAsAdmin();

        $thin = Anime::factory()->create(['synopsis' => $this->words(20), 'popularity' => 10]);
        $full = Anime::factory()->create(['synopsis' => $this->words(200), 'popularity' => 5]);

        $this->get('/admin/anime')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AnimeListPage')
                ->where('thin_content.min_words', Anime::MIN_INDEXABLE_SYNOPSIS_WORDS)
                ->where('thin_content.total', 1)
                ->where('filters.thin_only', false)
                ->has('anime.data', 2)
                ->where('anime.data.0.id', $thin->id)
                ->where('anime.data.0.synopsis_word_count', 20)
                ->where('anime.data.0.is_thin', true)
                ->where('anime.data.1.id', $full->id)
                ->where('anime.data.1.synopsis_word_count', 200)
                ->where('anime.data.1.is_thin', false)
            );
    }

    public function test_admin_anime_list_can_filter_to_thin_pages_only(): void
    {
        $this->actingAsAdmin();

        $thin = Anime::factory()->create(['synopsis' => $this->words(20)]);
        Anime::factory()->create(['synopsis' => $this->words(200)]);

        $this->get('/admin/anime?thin_only=1')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AnimeListPage')
                ->where('filters.thin_only', true)
                ->has('anime.data', 1)
                ->where('anime.data.0.id', $thin->id)
                ->where('anime.data.0.is_thin', true)
            );
    }

    public function test_thin_filter_combines_with_search(): void
    {
        $this->actingAsAdmin();

        $match = Anime::factory()->create(['title_english' => 'Cowboy Bebop', 'title_romaji' => 'Cowboy Bebop', 'synopsis' => $this->words(20)]);
        Anime::factory()->create(['title_english' => 'Cowboy Bebop Movie', 'title_romaji' => 'Cowboy Bebop Movie', 'synopsis' => $this->words(200)]);
        Anime::factory()->create(['title_english' => 'Trigun', 'title_romaji' => 'Trigun', 'synopsis' => $this->words(20)]);

        $this->get('/admin/anime?thin_only=1&search=Bebop')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('anime.data', 1)
                ->where('anime.data.0.id', $match->id)
            );
    }

    public function test_admin_edit_page_exposes_the_word_count_and_flag(): void
    {
        $this->actingAsAdmin();

        $anime = Anime::factory()->create(['synopsis' => $this->words(20)]);

        $this->get("/admin/anime/{$anime->id}/edit")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AnimeEditPage')
                ->where('anime.synopsis_word_count', 20)
                ->where('anime.is_thin', true)
                ->where('min_words', Anime::MIN_INDEXABLE_SYNOPSIS_WORDS)
            );
    }

    public function test_saving_a_longer_synopsis_clears_the_flag(): void
    {
        $this->actingAsAdmin();

        $anime = Anime::factory()->create(['synopsis' => $this->words(20)]);
        $this->assertTrue($anime->hasThinContent());

        $this->patch("/admin/anime/{$anime->id}", ['synopsis' => $this->words(160)])
            ->assertRedirect("/admin/anime/{$anime->id}/edit");

        $anime->refresh();
        $this->assertSame(160, $anime->synopsis_word_count);
        $this->assertFalse($anime->hasThinContent());
        $this->assertCount(0, Anime::query()->thinContent()->get());
    }

    public function test_dashboard_reports_the_number_of_thin_pages(): void
    {
        $this->actingAsAdmin();

        Anime::factory()->count(2)->create(['synopsis' => $this->words(20)]);
        Anime::factory()->create(['synopsis' => $this->words(200)]);

        $this->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/DashboardPage')
                ->where('stats.thin_content_anime', 2)
                ->where('stats.thin_content_min_words', Anime::MIN_INDEXABLE_SYNOPSIS_WORDS)
            );
    }

    public function test_non_admins_cannot_view_the_anime_content_list(): void
    {
        $user = \App\Models\User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin/anime?thin_only=1')->assertForbidden();
    }
}
