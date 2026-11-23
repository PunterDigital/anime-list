<?php

namespace Tests\Feature;

use App\Models\AiringSchedule;
use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Card 5719: /schedule leaves out adult, NSFW and hidden titles, like the
 * catalogue pages.
 */
class ScheduleSafeForWorkTest extends TestCase
{
    /** @var array<string, Anime> */
    private array $anime = [];

    protected function setUp(): void
    {
        parent::setUp();

        // A Wednesday, so "this week" has room on both sides.
        $this->travelTo(Carbon::parse('2026-11-25 12:00:00'));

        $this->anime = [
            'normal' => Anime::factory()->create(['title_romaji' => 'Normal Show', 'is_adult' => false]),
            'adult' => Anime::factory()->create(['title_romaji' => 'Adult Show', 'is_adult' => true]),
            'nsfw' => Anime::factory()->create(['title_romaji' => 'Nsfw Show', 'is_adult' => false, 'nsfw_at' => now()]),
            'hidden' => Anime::factory()->create(['title_romaji' => 'Hidden Show', 'is_adult' => false, 'hidden_at' => now()]),
        ];

        $n = 0;
        foreach ($this->anime as $anime) {
            foreach ([0, 7] as $daysAhead) {
                AiringSchedule::create([
                    'anime_id' => $anime->id,
                    'anilist_airing_id' => 500_000 + $n++,
                    'episode' => 3,
                    'airs_at' => now()->addDays($daysAhead)->addHour(),
                    'time_until_airing' => 3600,
                ]);
            }
        }
    }

    public function test_guests_see_only_safe_visible_titles_in_both_weeks(): void
    {
        foreach ([0, 1] as $week) {
            $this->assertSame(['Normal Show'], $this->titles("/schedule?week={$week}"));
        }
    }

    public function test_signed_in_users_get_the_same_public_schedule(): void
    {
        $this->actingAs(User::factory()->create());

        $this->assertSame(['Normal Show'], $this->titles('/schedule'));
    }

    public function test_my_list_keeps_an_nsfw_title_the_viewer_added_but_not_adult_or_hidden_ones(): void
    {
        $user = User::factory()->create();
        foreach ($this->anime as $anime) {
            UserAnimeList::factory()->create(['user_id' => $user->id, 'anime_id' => $anime->id]);
        }

        $titles = $this->actingAs($user)->titles('/schedule?my_list=1');
        sort($titles);

        $this->assertSame(['Normal Show', 'Nsfw Show'], $titles);
    }

    /** @return list<string> */
    private function titles(string $url): array
    {
        $titles = [];
        $this->get($url)->assertOk()->assertInertia(function (AssertableInertia $page) use (&$titles) {
            $page->component('SchedulePage');
            foreach ($page->toArray()['props']['days'] as $items) {
                foreach ($items as $item) {
                    $titles[] = $item['anime']['title_romaji'] ?? $item['title_romaji'] ?? null;
                }
            }
        });

        return $titles;
    }
}
