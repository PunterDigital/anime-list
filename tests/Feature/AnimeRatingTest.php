<?php

namespace Tests\Feature;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Services\AnimeRatingService;
use App\Services\FeatureFlagService;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Card 4476: the AniTrack rating on the anime page, the average of every
 * user's score once at least 10 users have scored the anime.
 */
class AnimeRatingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        app(FeatureFlagService::class)->setGlobalStatus('anitrack-rating', 'everyone');
    }

    /**
     * @param  list<int>  $scores
     */
    private function score(Anime $anime, array $scores, array $attributes = []): void
    {
        foreach ($scores as $score) {
            UserAnimeList::factory()->completed()->create([
                'anime_id' => $anime->id,
                'score' => $score,
                ...$attributes,
            ]);
        }
    }

    private function assertRating(Anime $anime, ?array $expected): void
    {
        $this->get(route('anime.show', $anime))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('AnimeDetailPage')
                ->where('anitrack_rating', $expected));
    }

    public function test_nine_scores_show_no_rating_yet_and_the_tenth_shows_the_average(): void
    {
        $anime = Anime::factory()->create();
        $this->score($anime, [8, 8, 8, 8, 8, 9, 9, 9, 9]);

        $this->assertRating($anime, null);

        $this->score($anime, [8]);

        // (6 x 8 + 4 x 9) / 10 = 8.4
        $this->assertRating($anime, ['average' => 8.4, 'count' => 10]);
    }

    public function test_entries_without_a_score_do_not_count(): void
    {
        $anime = Anime::factory()->create();
        $this->score($anime, array_fill(0, 9, 7));
        // "No score" in the list form is stored as 0.
        $this->score($anime, [0, 0, 0, 0]);

        $this->assertRating($anime, null);

        $this->score($anime, [10]);

        // 0s don't drag the average down: (9 x 7 + 10) / 10 = 7.3
        $this->assertRating($anime, ['average' => 7.3, 'count' => 10]);
    }

    public function test_private_entries_count_but_removed_entries_and_deleted_accounts_do_not(): void
    {
        $anime = Anime::factory()->create();
        $this->score($anime, array_fill(0, 5, 6));
        $this->score($anime, array_fill(0, 5, 10), ['is_private' => true]);

        $this->assertRating($anime, ['average' => 8, 'count' => 10]);

        UserAnimeList::where('anime_id', $anime->id)->where('score', 6)->first()->delete();
        $this->assertRating($anime, null);

        $this->score($anime, [6]);
        $this->assertRating($anime, ['average' => 8, 'count' => 10]);

        $user = UserAnimeList::where('anime_id', $anime->id)->where('score', 10)->first()->user;
        $user->delete();
        $this->assertRating($anime, null);

        $user->restore();
        $this->assertRating($anime, ['average' => 8, 'count' => 10]);
    }

    public function test_the_average_is_rounded_to_one_decimal(): void
    {
        $anime = Anime::factory()->create();
        // 77 / 11 = 7.0 (JSON sends a whole number as 7; the page shows 7.0)
        $this->score($anime, [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7]);
        $this->assertRating($anime, ['average' => 7, 'count' => 11]);

        // 86 / 12 = 7.1666...
        $this->score($anime, [9]);
        $this->assertRating($anime, ['average' => 7.2, 'count' => 12]);
    }

    public function test_adding_changing_and_removing_a_score_shows_on_the_next_view(): void
    {
        $anime = Anime::factory()->create();
        $this->score($anime, array_fill(0, 9, 8));

        // The first view caches both the page model and the rating.
        $this->assertRating($anime, null);
        $this->assertTrue(Cache::has("anime:v3:{$anime->id}"));
        $this->assertTrue(Cache::has(AnimeRatingService::cacheKey($anime->id)));

        $viewer = User::factory()->create();
        $entryId = $this->actingAs($viewer)->postJson('/api/list', [
            'anime_id' => $anime->id,
            'status' => UserAnimeList::STATUS_COMPLETED,
            'score' => 10,
        ])->assertCreated()->json('id');

        // (9 x 8 + 10) / 10 = 8.2
        $this->assertRating($anime, ['average' => 8.2, 'count' => 10]);

        $this->patchJson("/api/list/{$entryId}", ['score' => 4])->assertOk();
        // (72 + 4) / 10 = 7.6
        $this->assertRating($anime, ['average' => 7.6, 'count' => 10]);

        // Clearing the score in the form sends null, stored as 0.
        $this->patchJson("/api/list/{$entryId}", ['score' => null])->assertOk();
        $this->assertRating($anime, null);

        $this->patchJson("/api/list/{$entryId}", ['score' => 9])->assertOk();
        $this->assertRating($anime, ['average' => 8.1, 'count' => 10]);

        $this->deleteJson("/api/list/{$entryId}")->assertNoContent();
        $this->assertRating($anime, null);

        // The page model stayed cached the whole time.
        $this->assertTrue(Cache::has("anime:v3:{$anime->id}"));
    }

    public function test_a_change_that_leaves_the_score_alone_keeps_the_cached_rating(): void
    {
        $anime = Anime::factory()->create();
        $this->score($anime, array_fill(0, 10, 8));
        $this->assertRating($anime, ['average' => 8, 'count' => 10]);

        UserAnimeList::where('anime_id', $anime->id)->first()->update(['progress' => 3]);

        $this->assertTrue(Cache::has(AnimeRatingService::cacheKey($anime->id)));
    }

    public function test_the_page_sends_no_rating_while_the_flag_is_off(): void
    {
        app(FeatureFlagService::class)->setGlobalStatus('anitrack-rating', 'nobody');
        $anime = Anime::factory()->create();
        $this->score($anime, array_fill(0, 10, 8));

        $this->assertRating($anime, null);
        $this->assertFalse(Cache::has(AnimeRatingService::cacheKey($anime->id)));
    }
}
