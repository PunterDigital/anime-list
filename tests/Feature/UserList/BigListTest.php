<?php

namespace Tests\Feature\UserList;

use App\Models\Anime;
use App\Models\Genre;
use App\Models\User;
use App\Models\UserAnimeList;
use Inertia\Testing\AssertableInertia;
use Laravel\Pennant\Feature;
use Tests\TestCase;

/**
 * Card 5718: the list pages send a slimmer entry, and /api/v1/list can page.
 */
class BigListTest extends TestCase
{
    private function listWith(int $count, array $userAttributes = []): User
    {
        $user = User::factory()->create(['list_is_public' => true, ...$userAttributes]);
        $genres = Genre::factory()->count(5)->create();
        foreach (range(1, $count) as $n) {
            $anime = Anime::factory()->create(['is_adult' => false, 'title_romaji' => "Listed {$n}"]);
            $anime->genres()->attach($genres->pluck('id'));
            UserAnimeList::factory()->create([
                'user_id' => $user->id,
                'anime_id' => $anime->id,
                'status' => $n % 2 ? UserAnimeList::STATUS_COMPLETED : UserAnimeList::STATUS_WATCHING,
                'updated_at' => now()->subMinutes($n),
            ]);
        }

        return $user;
    }

    public function test_list_pages_send_the_slim_entry_with_every_genre(): void
    {
        $user = $this->listWith(3);

        foreach (['/list' => $user, "/user/{$user->username}/list" => null] as $url => $viewer) {
            $response = $viewer ? $this->actingAs($viewer)->get($url) : $this->get($url);
            $response->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->has('entries', 3));

            $entry = $response->viewData('page')['props']['entries'][0];
            $this->assertSame(
                ['id', 'slug', 'title_romaji', 'title_english', 'format', 'season', 'season_year', 'episodes',
                    'cover_image_large', 'cover_image_medium', 'cover_image_color', 'average_score', 'genres'],
                array_keys($entry['anime']),
            );
            $this->assertCount(5, $entry['anime']['genres']);
            $this->assertSame(['id', 'name'], array_keys($entry['anime']['genres'][0]));
            $this->assertArrayHasKey('status', $entry);
            $this->assertArrayHasKey('progress', $entry);
        }
    }

    public function test_the_api_without_paging_returns_the_whole_list_as_before(): void
    {
        $user = $this->listWith(5);
        Feature::for($user)->activate('public-api');
        $token = $user->createToken('t')->plainTextToken;

        $json = $this->getJson('/api/v1/list', ['Authorization' => "Bearer {$token}"])->assertOk()->json();

        $this->assertCount(5, $json['data']);
        $this->assertSame(5, $json['total']);
        $this->assertArrayNotHasKey('meta', $json);
        // The full card, as the extension expects.
        $this->assertArrayHasKey('anilist_id', $json['data'][0]['anime']);
    }

    public function test_the_api_pages_when_asked(): void
    {
        $user = $this->listWith(5);
        Feature::for($user)->activate('public-api');
        $headers = ['Authorization' => 'Bearer '.$user->createToken('t')->plainTextToken];

        $page2 = $this->getJson('/api/v1/list?per_page=2&page=2', $headers)->assertOk()->json();
        $this->assertSame(['Listed 3', 'Listed 4'], array_column(array_column($page2['data'], 'anime'), 'title_romaji'));
        $this->assertSame(5, $page2['total']);
        $this->assertSame(['current_page' => 2, 'last_page' => 3, 'per_page' => 2], $page2['meta']);

        $completed = $this->getJson('/api/v1/list?status=completed&page=1', $headers)->assertOk()->json();
        $this->assertSame(3, $completed['total']);
        $this->assertSame(100, $completed['meta']['per_page']);

        $this->getJson('/api/v1/list?per_page=501', $headers)->assertStatus(422);
        $this->getJson('/api/v1/list?page=0', $headers)->assertStatus(422);
    }
}
