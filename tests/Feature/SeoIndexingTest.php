<?php

namespace Tests\Feature;

use App\Models\Anime;
use Tests\TestCase;

class SeoIndexingTest extends TestCase
{
    private function longSynopsis(int $words = 160): string
    {
        return trim(str_repeat('word ', $words));
    }

    private function indexableAnime(array $overrides = []): Anime
    {
        return Anime::factory()->create(array_merge([
            'is_adult' => false,
            'synopsis' => $this->longSynopsis(),
            'episodes' => 12,
            'average_score' => 80,
        ], $overrides));
    }

    public function test_synopsis_word_count_ignores_html_and_line_breaks(): void
    {
        $anime = Anime::factory()->make([
            'synopsis' => "<i>One</i> two<br>three\nfour   five (Source: <b>MAL</b>)",
        ]);

        $this->assertSame(7, $anime->synopsisWordCount());
        $this->assertSame(0, Anime::factory()->make(['synopsis' => null])->synopsisWordCount());
    }

    public function test_complete_title_is_indexable(): void
    {
        $this->assertTrue($this->indexableAnime()->isIndexable());
    }

    public function test_short_or_missing_synopsis_is_not_indexable(): void
    {
        $this->assertFalse($this->indexableAnime(['synopsis' => $this->longSynopsis(149)])->isIndexable());
        $this->assertFalse($this->indexableAnime(['synopsis' => null])->isIndexable());
        $this->assertTrue($this->indexableAnime(['synopsis' => $this->longSynopsis(150)])->isIndexable());
    }

    public function test_missing_score_is_not_indexable(): void
    {
        $this->assertFalse($this->indexableAnime(['average_score' => null])->isIndexable());
        $this->assertFalse($this->indexableAnime(['average_score' => 0])->isIndexable());
    }

    public function test_missing_episode_data_is_not_indexable(): void
    {
        $this->assertFalse($this->indexableAnime(['episodes' => null])->isIndexable());
        $this->assertFalse($this->indexableAnime(['episodes' => 0])->isIndexable());
    }

    public function test_episode_rows_count_as_episode_data(): void
    {
        $anime = $this->indexableAnime(['episodes' => null, 'episode_count_unknown' => true]);
        $anime->episodeList()->create(['number' => 1, 'title' => 'Pilot']);

        $this->assertTrue($anime->fresh()->isIndexable());
    }

    public function test_detail_page_does_not_noindex_complete_titles(): void
    {
        $anime = $this->indexableAnime();

        $this->get("/anime/{$anime->slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('og.noindex', false));
    }

    public function test_detail_page_noindexes_thin_titles(): void
    {
        $shortSynopsis = $this->indexableAnime(['synopsis' => 'Too short.']);
        $noEpisodes = $this->indexableAnime(['episodes' => null]);
        $noScore = $this->indexableAnime(['average_score' => null]);

        foreach ([$shortSynopsis, $noEpisodes, $noScore] as $anime) {
            $this->get("/anime/{$anime->slug}")
                ->assertOk()
                ->assertInertia(fn ($page) => $page->where('og.noindex', true));
        }
    }

    public function test_sitemap_only_lists_indexable_titles(): void
    {
        $complete = $this->indexableAnime(['title_english' => 'Complete Title']);
        $withEpisodeRows = $this->indexableAnime(['title_english' => 'Episode Rows Title', 'episodes' => null]);
        $withEpisodeRows->episodeList()->create(['number' => 1]);

        $shortSynopsis = $this->indexableAnime(['title_english' => 'Short Synopsis Title', 'synopsis' => 'Too short.']);
        $noEpisodes = $this->indexableAnime(['title_english' => 'No Episodes Title', 'episodes' => null]);
        $noScore = $this->indexableAnime(['title_english' => 'No Score Title', 'average_score' => null]);
        $adult = Anime::factory()->adult()->create(['title_english' => 'Adult Title']);

        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertSee(route('anime.show', $complete), false);
        $response->assertSee(route('anime.show', $withEpisodeRows), false);
        $response->assertDontSee(route('anime.show', $shortSynopsis), false);
        $response->assertDontSee(route('anime.show', $noEpisodes), false);
        $response->assertDontSee(route('anime.show', $noScore), false);
        $response->assertDontSee(route('anime.show', $adult), false);
    }
}
