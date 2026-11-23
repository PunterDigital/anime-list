<?php

namespace Tests\Feature;

use App\Models\Anime;
use App\Models\AnimeRelation;
use App\Models\Character;
use App\Models\Episode;
use App\Models\Genre;
use App\Models\Person;
use App\Models\Recommendation;
use App\Models\User;
use App\Models\UserAnimeList;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Card 5709: the anime page caches plain arrays (not an Eloquent graph),
 * with the season chain and the "similar" cards built once per cache fill.
 */
class AnimePageCacheTest extends TestCase
{
    /** @var list<Anime> */
    private array $seasons = [];

    /** @var list<Anime> */
    private array $similar = [];

    /**
     * A big franchise: five seasons (SEQUEL/PREQUEL), the third with 25
     * characters and their voice actors, 180 episodes, ten related titles
     * with long synopses and eight recommendations.
     */
    private function franchise(): Anime
    {
        $genres = Genre::factory()->count(3)->create();
        $long = str_repeat('A long synopsis sentence about the show. ', 60);

        foreach (range(1, 5) as $n) {
            $season = Anime::factory()->create([
                'title_romaji' => "Big Franchise Season {$n}",
                'synopsis' => $long,
                'is_adult' => false,
            ]);
            $season->genres()->attach($genres->pluck('id'));
            $this->seasons[] = $season;
        }
        foreach ($this->seasons as $i => $season) {
            if ($i > 0) {
                AnimeRelation::create(['anime_id' => $season->id, 'related_anime_id' => $this->seasons[$i - 1]->id, 'relation_type' => 'PREQUEL']);
            }
            if ($i < 4) {
                AnimeRelation::create(['anime_id' => $season->id, 'related_anime_id' => $this->seasons[$i + 1]->id, 'relation_type' => 'SEQUEL']);
            }
        }

        $anime = $this->seasons[2];

        foreach (range(1, 8) as $n) {
            $related = Anime::factory()->create(['title_romaji' => "Side Story {$n}", 'synopsis' => $long, 'is_adult' => false]);
            $related->genres()->attach($genres->pluck('id'));
            AnimeRelation::create(['anime_id' => $anime->id, 'related_anime_id' => $related->id, 'relation_type' => 'SIDE_STORY']);
        }

        foreach (range(1, 8) as $n) {
            $rec = Anime::factory()->create(['title_romaji' => "Similar Show {$n}", 'synopsis' => $long, 'is_adult' => false]);
            $rec->genres()->attach($genres->first()->id);
            Recommendation::create(['anime_id' => $anime->id, 'recommended_anime_id' => $rec->id, 'source' => 'anilist', 'rating' => 100 - $n]);
            $this->similar[] = $rec;
        }

        foreach (range(1, 25) as $n) {
            $character = Character::factory()->create();
            $anime->characters()->attach($character->id, ['role' => $n <= 3 ? 'MAIN' : 'SUPPORTING']);
            foreach (['JAPANESE', 'ENGLISH'] as $language) {
                $person = Person::factory()->create();
                DB::table('character_voice_actor')->insert([
                    'anime_id' => $anime->id, 'character_id' => $character->id, 'person_id' => $person->id,
                    'language' => $language, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        foreach (range(1, 180) as $n) {
            Episode::create(['anime_id' => $anime->id, 'number' => $n, 'title' => "Episode {$n}: a title of some length"]);
        }

        return $anime;
    }

    private function cachedValue(Anime $anime): mixed
    {
        return Cache::get(Anime::pageCacheKey($anime->id));
    }

    public function test_the_cached_page_is_plain_arrays(): void
    {
        $anime = $this->franchise();

        $this->get("/anime/{$anime->slug}")->assertOk();

        $cached = $this->cachedValue($anime);
        // Serialized size of this franchise's entry:
        // 855 KB as an Eloquent graph before card 5709, ~81 KB as arrays.
        $this->assertLessThan(200_000, strlen(serialize($cached)));

        $this->assertIsArray($cached);
        array_walk_recursive($cached, function ($value) {
            $this->assertFalse(is_object($value), 'The cached page holds an object: '.(is_object($value) ? $value::class : ''));
        });
    }

    public function test_a_cached_view_runs_few_queries_and_shows_the_same_page(): void
    {
        $anime = $this->franchise();

        $first = $this->get("/anime/{$anime->slug}")->assertOk();
        $props = $first->viewData('page')['props'];

        $queries = 0;
        DB::listen(function () use (&$queries) {
            $queries++;
        });
        $second = $this->get("/anime/{$anime->slug}")->assertOk();

        $again = $second->viewData('page')['props'];
        foreach (['anime', 'seasons', 'recommendations', 'og'] as $key) {
            $this->assertSame($props[$key], $again[$key], "{$key} differs on the cached view");
        }
        // Route binding + the similar-titles visibility check.
        $this->assertLessThanOrEqual(3, $queries);

        $this->assertSame(
            array_map(fn (Anime $s) => $s->id, $this->seasons),
            array_column($again['seasons'], 'id'),
        );
        $this->assertTrue($again['seasons'][2]['is_current']);
        $this->assertCount(25, $again['anime']['characters']);
        $this->assertCount(180, $again['anime']['episodes_list']);
        $this->assertCount(10, $again['anime']['relations']); // 8 side stories, prequel, sequel
        $this->assertSame('Similar Show 1', $again['recommendations'][0]['title_romaji']);
    }

    public function test_a_similar_title_hidden_or_marked_nsfw_after_caching_drops_out(): void
    {
        $anime = $this->franchise();
        $this->get("/anime/{$anime->slug}")->assertOk();

        $this->similar[0]->forceFill(['hidden_at' => now()])->saveQuietly();
        $this->similar[1]->forceFill(['nsfw_at' => now()])->saveQuietly();

        $this->get("/anime/{$anime->slug}")->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where('recommendations.0.title_romaji', 'Similar Show 3')
            ->has('recommendations', 6));
    }

    public function test_viewer_data_stays_outside_the_cache(): void
    {
        $anime = $this->franchise();
        $this->get("/anime/{$anime->slug}")->assertOk();

        $user = User::factory()->create();
        UserAnimeList::factory()->create(['user_id' => $user->id, 'anime_id' => $anime->id, 'progress' => 7]);

        $this->actingAs($user)->get("/anime/{$anime->slug}")->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('list_entry.progress', 7));

        $this->assertArrayNotHasKey('list_entry', $this->cachedValue($anime));
    }

    public function test_hidden_adult_and_nsfw_checks_still_apply_to_a_cached_page(): void
    {
        $anime = $this->franchise();
        $this->get("/anime/{$anime->slug}")->assertOk();

        $anime->forceFill(['nsfw_at' => now()])->saveQuietly();
        $this->get("/anime/{$anime->slug}")->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->component('AnimeNsfwGatePage'));

        $anime->forceFill(['nsfw_at' => null, 'is_adult' => true])->saveQuietly();
        $this->get("/anime/{$anime->slug}")->assertNotFound();

        $anime->forceFill(['is_adult' => false, 'hidden_at' => now()])->saveQuietly();
        $this->get("/anime/{$anime->slug}")->assertStatus(451);
    }
}
