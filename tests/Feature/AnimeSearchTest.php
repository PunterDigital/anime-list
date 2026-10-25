<?php

namespace Tests\Feature;

use App\Models\Anime;
use Tests\TestCase;

class AnimeSearchTest extends TestCase
{
    private function komi(): Anime
    {
        return Anime::factory()->create([
            'title_romaji' => 'Komi-san wa, Komyushou desu.',
            'title_english' => "Komi Can't Communicate",
            'title_native' => '古見さんは、コミュ症です。',
            'title_synonyms' => ['Komi-san Can\'t Communicate'],
            'is_adult' => false,
        ]);
    }

    public function test_search_ignores_missing_apostrophes(): void
    {
        $this->komi();

        $this->getJson('/api/search?q='.urlencode('Komi cant communicate'))
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.title_english', "Komi Can't Communicate")
            ->assertJsonPath('source', 'local');
    }

    public function test_search_still_matches_the_exact_title(): void
    {
        $this->komi();

        $this->getJson('/api/search?q='.urlencode("Komi Can't Communicate"))
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_search_ignores_case_punctuation_and_word_order(): void
    {
        $this->komi();

        foreach (['KOMI-SAN WA', 'komisan', 'communicate komi', 'komi’s cant'] as $q) {
            $this->getJson('/api/search?q='.urlencode($q))
                ->assertOk()
                ->assertJsonPath('total', 1, "No match for [{$q}]");
        }
    }

    public function test_search_matches_without_accents_and_spaces(): void
    {
        Anime::factory()->create([
            'title_romaji' => 'Re:Zero kara Hajimeru Isekai Seikatsu',
            'title_english' => 'Re:ZERO -Starting Life in Another World-',
            'is_adult' => false,
        ]);
        Anime::factory()->create([
            'title_romaji' => 'Pokémon',
            'title_english' => 'Pokémon',
            'is_adult' => false,
        ]);

        $this->getJson('/api/search?q=rezero')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/search?q=re+zero')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/search?q=pokemon')->assertOk()->assertJsonPath('data.0.title_english', 'Pokémon');
    }

    public function test_search_orders_results_by_popularity(): void
    {
        Anime::factory()->create(['title_english' => 'Naruto Shippuden', 'popularity' => 100, 'is_adult' => false]);
        Anime::factory()->create(['title_english' => 'Naruto', 'popularity' => 900, 'is_adult' => false]);

        $this->getJson('/api/search?q=naruto')
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonPath('data.0.title_english', 'Naruto')
            ->assertJsonPath('data.1.title_english', 'Naruto Shippuden');
    }

    public function test_search_excludes_adult_and_hidden_titles(): void
    {
        $this->komi();
        Anime::factory()->adult()->create(['title_english' => "Komi Can't Communicate Adult"]);
        Anime::factory()->create(['title_english' => "Komi Can't Communicate Hidden", 'hidden_at' => now()]);

        $this->getJson('/api/search?q=komi+cant')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.title_english', "Komi Can't Communicate");
    }

    public function test_browse_filter_uses_the_same_matching(): void
    {
        $this->komi();
        Anime::factory()->create(['title_english' => 'One Piece', 'is_adult' => false]);

        $this->get('/anime?filter%5Bsearch%5D='.urlencode('komi cant communicate'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('AnimeIndexPage')
                ->has('anime.data', 1)
                ->where('anime.data.0.title_english', "Komi Can't Communicate"));
    }

    public function test_search_text_is_rebuilt_when_a_title_changes(): void
    {
        $anime = $this->komi();

        $anime->update(['title_english' => 'Komi Cannot Talk']);

        $searchText = $anime->fresh()->search_text;
        $this->assertStringContainsString('komi cannot talk', $searchText);
        $this->assertStringNotContainsString('komi cant communicate', $searchText);
    }
}
