<?php

namespace Tests\Unit\Services;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Services\UserListService;
use Tests\TestCase;

class UserListServiceTest extends TestCase
{
    private UserListService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new UserListService;
    }

    public function test_store_creates_an_entry_for_the_user(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create(['episodes' => 12]);

        $entry = $this->service->store($user, [
            'anime_id' => $anime->id,
            'status' => UserAnimeList::STATUS_PLAN_TO_WATCH,
        ]);

        $this->assertSame($user->id, $entry->user_id);
        $this->assertSame($anime->id, $entry->anime_id);
        $this->assertSame(0, $entry->score);
    }

    public function test_store_defaults_started_at_when_status_is_watching(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create(['episodes' => 12]);

        $entry = $this->service->store($user, [
            'anime_id' => $anime->id,
            'status' => UserAnimeList::STATUS_WATCHING,
        ]);

        $this->assertNotNull($entry->started_at);
    }

    public function test_store_auto_completes_when_progress_matches_total_episodes(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create(['episodes' => 12]);

        $entry = $this->service->store($user, [
            'anime_id' => $anime->id,
            'status' => UserAnimeList::STATUS_WATCHING,
            'progress' => 12,
        ]);

        $this->assertSame(UserAnimeList::STATUS_COMPLETED, $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->completed_at);
    }

    public function test_store_does_not_auto_complete_when_episodes_unknown(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create(['episodes' => null]);

        $entry = $this->service->store($user, [
            'anime_id' => $anime->id,
            'status' => UserAnimeList::STATUS_WATCHING,
            'progress' => 50,
        ]);

        $this->assertSame(UserAnimeList::STATUS_WATCHING, $entry->fresh()->status);
    }

    public function test_setting_status_to_completed_fills_progress_to_total_episodes(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create(['episodes' => 24]);
        $entry = UserAnimeList::factory()->for($user)->for($anime)->create([
            'status' => UserAnimeList::STATUS_WATCHING,
            'progress' => 10,
        ]);

        $updated = $this->service->update($entry, ['status' => UserAnimeList::STATUS_COMPLETED]);

        $this->assertSame(24, $updated->progress);
        $this->assertNotNull($updated->completed_at);
    }

    public function test_update_leaves_progress_alone_for_non_completed_status(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create(['episodes' => 24]);
        $entry = UserAnimeList::factory()->for($user)->for($anime)->create([
            'status' => UserAnimeList::STATUS_WATCHING,
            'progress' => 5,
        ]);

        $updated = $this->service->update($entry, ['progress' => 6]);

        $this->assertSame(6, $updated->progress);
        $this->assertSame(UserAnimeList::STATUS_WATCHING, $updated->status);
    }

    public function test_delete_soft_deletes_the_entry(): void
    {
        $entry = UserAnimeList::factory()->create();

        $this->service->delete($entry);

        $this->assertSoftDeleted('user_anime_lists', ['id' => $entry->id]);
    }

    public function test_get_list_for_page_returns_counts_grouped_by_status(): void
    {
        $user = User::factory()->create();
        UserAnimeList::factory()->for($user)->count(3)->create(['status' => UserAnimeList::STATUS_WATCHING]);
        UserAnimeList::factory()->for($user)->count(2)->create(['status' => UserAnimeList::STATUS_COMPLETED]);

        $data = $this->service->getListForPage($user);

        $this->assertSame(3, $data['counts'][UserAnimeList::STATUS_WATCHING]);
        $this->assertSame(2, $data['counts'][UserAnimeList::STATUS_COMPLETED]);
    }

    public function test_get_public_list_for_page_excludes_private_entries(): void
    {
        $user = User::factory()->create();
        UserAnimeList::factory()->for($user)->count(2)->create(['is_private' => false]);
        UserAnimeList::factory()->for($user)->count(3)->private()->create();

        $data = $this->service->getPublicListForPage($user);

        $this->assertSame(2, array_sum($data['counts']));
    }
}
