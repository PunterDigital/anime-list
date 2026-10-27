<?php

namespace Tests\Unit\Models;

use App\Models\AiringSchedule;
use App\Models\Anime;
use App\Models\Character;
use App\Models\Genre;
use App\Models\Studio;
use Tests\TestCase;

class AnimeTest extends TestCase
{
    public function test_it_uses_slug_as_route_key_name(): void
    {
        $anime = new Anime;
        $this->assertSame('slug', $anime->getRouteKeyName());
    }

    public function test_it_generates_a_slug_from_the_english_title_on_save(): void
    {
        $anime = Anime::factory()->create([
            'title_english' => 'Attack on Titan',
            'title_romaji' => 'Shingeki no Kyojin',
        ]);

        $this->assertSame('attack-on-titan', $anime->slug);
    }

    public function test_it_falls_back_to_romaji_title_when_english_is_missing(): void
    {
        $anime = Anime::factory()->create([
            'title_english' => null,
            'title_romaji' => 'Shingeki no Kyojin',
        ]);

        $this->assertSame('shingeki-no-kyojin', $anime->slug);
    }

    public function test_it_generates_unique_slugs_on_collision(): void
    {
        Anime::factory()->create([
            'title_english' => 'One Piece',
            'title_romaji' => 'One Piece',
        ]);

        $second = Anime::factory()->create([
            'title_english' => 'One Piece',
            'title_romaji' => 'One Piece',
        ]);

        $this->assertSame('one-piece-2', $second->slug);
    }

    public function test_it_regenerates_slug_when_title_changes(): void
    {
        $anime = Anime::factory()->create([
            'title_english' => 'Original Title',
        ]);

        $anime->update(['title_english' => 'Renamed Title']);

        $this->assertSame('renamed-title', $anime->slug);
    }

    public function test_it_casts_attributes_correctly(): void
    {
        $anime = Anime::factory()->create([
            'is_adult' => 1,
            'title_synonyms' => ['Alt Title', 'Another Alt'],
        ]);

        $this->assertIsBool($anime->is_adult);
        $this->assertTrue($anime->is_adult);
        $this->assertIsArray($anime->title_synonyms);
        $this->assertCount(2, $anime->title_synonyms);
    }

    public function test_it_belongs_to_many_genres(): void
    {
        $anime = Anime::factory()->create();
        $genre = Genre::factory()->create();

        $anime->genres()->attach($genre->id);

        $this->assertTrue($anime->genres->contains($genre));
    }

    public function test_it_belongs_to_many_studios_with_is_main_pivot(): void
    {
        $anime = Anime::factory()->create();
        $studio = Studio::factory()->create();

        $anime->studios()->attach($studio->id, ['is_main' => true]);

        $this->assertTrue((bool) $anime->studios->first()->pivot->is_main);
    }

    public function test_it_belongs_to_many_characters_with_role_pivot(): void
    {
        $anime = Anime::factory()->create();
        $character = Character::factory()->create();

        $anime->characters()->attach($character->id, ['role' => 'MAIN']);

        $this->assertSame('MAIN', $anime->characters->first()->pivot->role);
    }

    public function test_it_has_many_airing_schedules(): void
    {
        $anime = Anime::factory()->create();

        AiringSchedule::create([
            'anime_id' => $anime->id,
            'anilist_airing_id' => 1,
            'episode' => 1,
            'airs_at' => now()->addDay(),
        ]);

        $this->assertCount(1, $anime->airingSchedules);
    }

    public function test_it_scopes_releasing_and_finished_correctly(): void
    {
        Anime::factory()->finished()->create();
        Anime::factory()->releasing()->create();

        $this->assertCount(1, Anime::finished()->get());
        $this->assertCount(1, Anime::releasing()->get());
    }

    public function test_it_filters_adult_content_unless_included(): void
    {
        Anime::factory()->adult()->create();
        Anime::factory()->create(['is_adult' => false]);

        $this->assertCount(1, Anime::adultContent(false)->get());
        $this->assertCount(2, Anime::adultContent(true)->get());
    }

    public function test_it_normalizes_score_from_zero_to_hundred_to_display_scale(): void
    {
        $this->assertSame(8.5, Anime::normalizeScore(85));
        $this->assertSame(10.0, Anime::normalizeScore(100));
        $this->assertNull(Anime::normalizeScore(null));
    }

    public function test_it_produces_expected_searchable_array(): void
    {
        $anime = Anime::factory()->create([
            'title_english' => 'Berserk',
            'title_romaji' => 'Berserk',
            'format' => 'TV',
            'season_year' => 1997,
        ]);

        $array = $anime->toSearchableArray();

        $this->assertSame('Berserk', $array['title_english']);
        $this->assertSame('TV', $array['format']);
        $this->assertSame(1997, $array['season_year']);
    }
}
