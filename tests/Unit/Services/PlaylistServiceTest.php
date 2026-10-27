<?php

namespace Tests\Unit\Services;

use App\Models\Anime;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use App\Services\PlaylistService;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PlaylistServiceTest extends TestCase
{
    private PlaylistService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PlaylistService;
    }

    public function test_store_creates_a_playlist_for_the_user(): void
    {
        $user = User::factory()->create();

        $playlist = $this->service->store($user, [
            'title' => 'Spring 2025 Watchlist',
            'description' => 'My picks',
            'is_public' => true,
        ]);

        $this->assertSame($user->id, $playlist->user_id);
        $this->assertTrue($playlist->is_public);
        $this->assertSame('spring-2025-watchlist', $playlist->slug);
    }

    public function test_store_defaults_is_public_to_false_when_unspecified(): void
    {
        $user = User::factory()->create();

        $playlist = $this->service->store($user, ['title' => 'Private List']);

        $this->assertFalse($playlist->is_public);
    }

    public function test_add_item_appends_at_the_next_position(): void
    {
        $playlist = Playlist::factory()->create();
        $animeA = Anime::factory()->create();
        $animeB = Anime::factory()->create();

        $first = $this->service->addItem($playlist, $animeA->id);
        $second = $this->service->addItem($playlist, $animeB->id);

        $this->assertSame(1, $first->position);
        $this->assertSame(2, $second->position);
    }

    public function test_add_item_persists_note_and_is_optional_flag(): void
    {
        $playlist = Playlist::factory()->create();
        $anime = Anime::factory()->create();

        $item = $this->service->addItem($playlist, $anime->id, 'Watch first', true);

        $this->assertSame('Watch first', $item->note);
        $this->assertTrue($item->is_optional);
    }

    public function test_reorder_rewrites_positions_in_submitted_order(): void
    {
        $playlist = Playlist::factory()->create();
        $anime = Anime::factory()->count(3)->create();
        $items = collect($anime)->map(fn ($a, $i) => PlaylistItem::factory()->for($playlist)->create([
            'anime_id' => $a->id,
            'position' => $i + 1,
        ]));

        $reversed = $items->pluck('id')->reverse()->values()->all();
        $this->service->reorder($playlist, $reversed);

        $positions = $playlist->items()->pluck('position', 'id')->all();
        $this->assertSame(1, $positions[$reversed[0]]);
        $this->assertSame(2, $positions[$reversed[1]]);
        $this->assertSame(3, $positions[$reversed[2]]);
    }

    public function test_reorder_rejects_item_ids_not_in_playlist(): void
    {
        $playlist = Playlist::factory()->create();
        $item = PlaylistItem::factory()->for($playlist)->create();

        $this->expectException(HttpException::class);

        $this->service->reorder($playlist, [$item->id, 9999]);
    }

    public function test_get_user_playlists_scopes_to_owner(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        Playlist::factory()->for($alice)->count(2)->create();
        Playlist::factory()->for($bob)->count(3)->create();

        $this->assertCount(2, $this->service->getUserPlaylists($alice));
        $this->assertCount(3, $this->service->getUserPlaylists($bob));
    }
}
