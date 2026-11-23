<?php

namespace Tests\Feature;

use App\Models\AiringSchedule;
use App\Models\Anime;
use App\Models\Character;
use App\Models\Genre;
use App\Models\Person;
use App\Models\User;
use App\Services\DiscoverService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Card 5717: /people sorts by a stored role count, the mood API is cached,
 * and nextAiringEpisode loads one row per anime.
 */
class ServerAggregatesTest extends TestCase
{
    private function enableVoiceActorPages(): void
    {
        DB::table('features')->insert([
            'name' => 'voice-actor-pages', 'scope' => '', 'value' => 'true',
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    /**
     * People with known role counts: the counts only count listable anime
     * (not adult, NSFW or hidden).
     *
     * @return array<string, Person>
     */
    private function cast(): array
    {
        $normal = Anime::factory()->count(3)->create(['is_adult' => false]);
        $adult = Anime::factory()->create(['is_adult' => true]);
        $nsfw = Anime::factory()->create(['is_adult' => false, 'nsfw_at' => now()]);
        $hidden = Anime::factory()->create(['is_adult' => false, 'hidden_at' => now()]);

        $people = [
            'busy' => Person::factory()->create(['name_full' => 'Busy Actor']),
            'some' => Person::factory()->create(['name_full' => 'Some Actor']),
            'adult_only' => Person::factory()->create(['name_full' => 'Adult Only Actor']),
            'none' => Person::factory()->create(['name_full' => 'No Roles Actor']),
        ];

        $character = 1;
        $role = function (Person $p, Anime $a) use (&$character) {
            $c = Character::factory()->create();
            DB::table('character_voice_actor')->insert([
                'anime_id' => $a->id, 'character_id' => $c->id, 'person_id' => $p->id,
                'language' => 'JAPANESE', 'created_at' => now(), 'updated_at' => now(),
            ]);
            $character++;
        };

        foreach ($normal as $a) {
            $role($people['busy'], $a);
            $role($people['busy'], $a);
        }
        $role($people['busy'], $adult);
        $role($people['some'], $normal[0]);
        $role($people['some'], $nsfw);
        $role($people['adult_only'], $adult);
        $role($people['adult_only'], $hidden);

        return $people;
    }

    public function test_people_index_orders_by_listable_role_count_and_leaves_out_people_without_any(): void
    {
        $this->enableVoiceActorPages();
        $this->cast();
        Artisan::call('people:refresh-role-counts');

        $this->get('/people')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->component('PeopleIndexPage')
            ->has('people.data', 2)
            ->where('people.data.0.name_full', 'Busy Actor')
            ->where('people.data.0.role_count', 6)
            ->where('people.data.1.name_full', 'Some Actor')
            ->where('people.data.1.role_count', 1)
            ->where('people.meta.total', 2));

        $this->get('/people?search=some')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->has('people.data', 1)
            ->where('people.data.0.name_full', 'Some Actor'));
    }

    public function test_role_counts_follow_a_title_being_hidden_on_the_next_refresh(): void
    {
        $this->enableVoiceActorPages();
        $people = $this->cast();
        Artisan::call('people:refresh-role-counts');
        $this->assertSame(1, $people['some']->fresh()->role_count);

        Anime::query()->whereIn('id', DB::table('character_voice_actor')->where('person_id', $people['some']->id)->pluck('anime_id'))
            ->update(['hidden_at' => now()]);
        Artisan::call('people:refresh-role-counts');

        $this->assertSame(0, $people['some']->fresh()->role_count);
        $this->get('/people')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->has('people.data', 1));
    }

    public function test_people_index_runs_two_cheap_queries(): void
    {
        $this->enableVoiceActorPages();
        $this->cast();
        Artisan::call('people:refresh-role-counts');

        $sql = [];
        DB::listen(function ($q) use (&$sql) {
            $sql[] = $q->sql;
        });
        $this->get('/people')->assertOk();

        $peopleQueries = array_values(array_filter($sql, fn ($s) => str_contains($s, '"people"')));
        // The page and its count, neither touching character_voice_actor.
        $this->assertCount(2, $peopleQueries);
        foreach ($peopleQueries as $s) {
            $this->assertStringNotContainsString('character_voice_actor', $s);
        }
    }

    public function test_the_mood_api_is_a_cache_hit_on_the_second_call(): void
    {
        $mood = array_key_first(config('moods'));
        $def = config("moods.{$mood}");
        $genre = Genre::factory()->create(['name' => $def['genres_any'][0]]);
        $anime = Anime::factory()->create(['is_adult' => false, 'average_score' => 90, 'bayesian_score' => 88]);
        $anime->genres()->attach($genre->id);

        $first = $this->getJson("/api/discover/mood/{$mood}")->assertOk()->json('data');
        $this->assertCount(1, $first);

        $queries = 0;
        DB::listen(function () use (&$queries) {
            $queries++;
        });
        $second = $this->getJson("/api/discover/mood/{$mood}")->assertOk()->json('data');

        $this->assertSame($first, $second);
        $this->assertSame(0, $queries);
    }

    public function test_the_mood_cache_still_drops_a_title_hidden_since(): void
    {
        $mood = array_key_first(config('moods'));
        $def = config("moods.{$mood}");
        $genre = Genre::factory()->create(['name' => $def['genres_any'][0]]);
        $anime = Anime::factory()->create(['is_adult' => false, 'average_score' => 90, 'bayesian_score' => 88]);
        $anime->genres()->attach($genre->id);

        $this->assertCount(1, app(DiscoverService::class)->byMood($mood));

        // Marking it NSFW in the admin clears the mood shelves with the
        // other public caches (AdminAnimeController::forgetPublicCaches).
        $this->actingAs(User::factory()->create(['is_admin' => true]))
            ->patch("/admin/anime/{$anime->id}/nsfw", ['nsfw' => true])
            ->assertRedirect();

        $this->assertCount(0, app(DiscoverService::class)->byMood($mood));
    }

    public function test_next_airing_episode_eager_loads_one_row_per_anime(): void
    {
        $a = Anime::factory()->create();
        $b = Anime::factory()->create();
        $n = 0;
        foreach ([$a, $b] as $anime) {
            foreach ([-2, 1, 2, 3, 4, 5, 6, 7] as $days) {
                AiringSchedule::create([
                    'anime_id' => $anime->id,
                    'anilist_airing_id' => 700_000 + $n,
                    'episode' => 10 + $days,
                    'airs_at' => now()->addDays($days),
                    'time_until_airing' => 0,
                ]);
                $n++;
            }
        }

        $hydrated = 0;
        AiringSchedule::retrieved(function () use (&$hydrated) {
            $hydrated++;
        });

        $loaded = Anime::whereIn('id', [$a->id, $b->id])->with('nextAiringEpisode')->get()->keyBy('id');

        $this->assertSame(2, $hydrated);
        $this->assertSame(11, $loaded[$a->id]->nextAiringEpisode->episode);
        $this->assertSame(11, $loaded[$b->id]->nextAiringEpisode->episode);
        // Lazy loading on one model agrees.
        $this->assertSame(11, $a->fresh()->nextAiringEpisode->episode);
    }
}
