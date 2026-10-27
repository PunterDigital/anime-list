<?php

namespace Tests\Unit\Models;

use App\Models\Playlist;
use App\Models\User;
use App\Models\UserAnimeList;
use Tests\TestCase;

class UserTest extends TestCase
{
    public function test_it_has_many_anime_list_entries(): void
    {
        $user = User::factory()->create();
        UserAnimeList::factory()->for($user)->count(3)->create();

        $this->assertCount(3, $user->animeList);
    }

    public function test_it_has_many_playlists(): void
    {
        $user = User::factory()->create();
        Playlist::factory()->for($user)->count(2)->create();

        $this->assertCount(2, $user->playlists);
    }

    public function test_it_hides_sensitive_attributes_when_serialized(): void
    {
        $user = User::factory()->create();

        $array = $user->toArray();

        $this->assertArrayNotHasKey('password', $array);
        $this->assertArrayNotHasKey('remember_token', $array);
        $this->assertArrayNotHasKey('mal_access_token', $array);
        $this->assertArrayNotHasKey('mal_refresh_token', $array);
    }

    public function test_it_casts_is_admin_and_list_is_public_to_booleans(): void
    {
        $user = User::factory()->create([
            'is_admin' => 1,
            'list_is_public' => 0,
        ]);

        $this->assertSame(true, $user->is_admin);
        $this->assertSame(false, $user->list_is_public);
    }

    public function test_it_soft_deletes(): void
    {
        $user = User::factory()->create();
        $id = $user->id;

        $user->delete();

        $this->assertSoftDeleted('users', ['id' => $id]);
        $this->assertCount(0, User::all());
        $this->assertCount(1, User::withTrashed()->get());
    }
}
