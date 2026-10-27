<?php

namespace Tests\Unit\Models;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use Carbon\CarbonInterface;
use Tests\TestCase;

class UserAnimeListTest extends TestCase
{
    public function test_status_constants_expose_the_full_status_set(): void
    {
        $expected = [
            'watching',
            'completed',
            'on_hold',
            'dropped',
            'plan_to_watch',
        ];

        $this->assertSame($expected, UserAnimeList::STATUSES);
    }

    public function test_display_score_mirrors_the_stored_score(): void
    {
        $entry = UserAnimeList::factory()->create(['score' => 8]);

        $this->assertSame(8, $entry->display_score);
    }

    public function test_display_score_returns_null_when_score_is_null(): void
    {
        $entry = UserAnimeList::factory()->create();
        $entry->score = null;

        $this->assertNull($entry->display_score);
    }

    public function test_it_belongs_to_a_user_and_anime(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create();
        $entry = UserAnimeList::factory()->for($user)->for($anime)->create();

        $this->assertTrue($entry->user->is($user));
        $this->assertTrue($entry->anime->is($anime));
    }

    public function test_it_soft_deletes(): void
    {
        $entry = UserAnimeList::factory()->create();

        $entry->delete();

        $this->assertSoftDeleted('user_anime_lists', ['id' => $entry->id]);
    }

    public function test_it_casts_dates_and_booleans_correctly(): void
    {
        $entry = UserAnimeList::factory()->create([
            'started_at' => '2024-01-01',
            'completed_at' => '2024-06-30',
            'is_private' => 1,
            'is_rewatching' => 0,
            'tags' => ['fantasy', 'shounen'],
        ]);

        $this->assertInstanceOf(CarbonInterface::class, $entry->started_at);
        $this->assertIsBool($entry->is_private);
        $this->assertTrue($entry->is_private);
        $this->assertFalse($entry->is_rewatching);
        $this->assertSame(['fantasy', 'shounen'], $entry->tags);
    }
}
