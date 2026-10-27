<?php

namespace Tests\Unit\Models;

use App\Models\Anime;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use Tests\TestCase;

class PlaylistTest extends TestCase
{
    public function test_it_uses_slug_as_route_key_name(): void
    {
        $this->assertSame('slug', (new Playlist)->getRouteKeyName());
    }

    public function test_it_generates_slug_from_title_on_create(): void
    {
        $playlist = Playlist::factory()->create(['title' => 'My Favorite Anime']);

        $this->assertSame('my-favorite-anime', $playlist->slug);
    }

    public function test_it_generates_unique_slugs_on_title_collision(): void
    {
        Playlist::factory()->create(['title' => 'Best of 2024']);
        $second = Playlist::factory()->create(['title' => 'Best of 2024']);

        $this->assertSame('best-of-2024-2', $second->slug);
    }

    public function test_public_scope_only_returns_public_playlists(): void
    {
        Playlist::factory()->public()->count(2)->create();
        Playlist::factory()->count(3)->create(); // private

        $this->assertCount(2, Playlist::public()->get());
    }

    public function test_items_are_ordered_by_position(): void
    {
        $playlist = Playlist::factory()->create();
        $animeA = Anime::factory()->create();
        $animeB = Anime::factory()->create();
        $animeC = Anime::factory()->create();

        PlaylistItem::factory()->for($playlist)->create(['anime_id' => $animeA->id, 'position' => 3]);
        PlaylistItem::factory()->for($playlist)->create(['anime_id' => $animeB->id, 'position' => 1]);
        PlaylistItem::factory()->for($playlist)->create(['anime_id' => $animeC->id, 'position' => 2]);

        $positions = $playlist->items->pluck('position')->all();
        $this->assertSame([1, 2, 3], $positions);
    }

    public function test_it_belongs_to_a_user(): void
    {
        $user = User::factory()->create();
        $playlist = Playlist::factory()->for($user)->create();

        $this->assertTrue($playlist->user->is($user));
    }

    public function test_it_soft_deletes(): void
    {
        $playlist = Playlist::factory()->create();
        $playlist->delete();

        $this->assertSoftDeleted('playlists', ['id' => $playlist->id]);
    }
}
