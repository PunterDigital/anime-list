<?php

namespace Tests\Unit\Services;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Services\MalExportService;
use Tests\TestCase;

class MalExportServiceTest extends TestCase
{
    private MalExportService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MalExportService;
    }

    public function test_generate_produces_valid_myanimelist_xml(): void
    {
        $user = User::factory()->create(['name' => 'Tester']);
        $anime = Anime::factory()->create(['mal_id' => 1234, 'title_romaji' => 'Sample', 'episodes' => 12]);
        UserAnimeList::factory()->for($user)->for($anime)->create([
            'status' => UserAnimeList::STATUS_COMPLETED,
            'progress' => 12,
            'score' => 8,
        ]);

        $xml = $this->service->generate($user);

        $this->assertStringContainsString('<myanimelist>', $xml);
        $this->assertStringContainsString('<user_name>Tester</user_name>', $xml);
        $this->assertStringContainsString('<series_animedb_id>1234</series_animedb_id>', $xml);
        $this->assertStringContainsString('<my_status>Completed</my_status>', $xml);
        $this->assertStringContainsString('<my_watched_episodes>12</my_watched_episodes>', $xml);
        $this->assertStringContainsString('<my_score>8</my_score>', $xml);
    }

    public function test_generate_skips_entries_without_a_mal_id(): void
    {
        $user = User::factory()->create();
        $anime = Anime::factory()->create(['mal_id' => null]);
        UserAnimeList::factory()->for($user)->for($anime)->create();

        $xml = $this->service->generate($user);

        $this->assertStringNotContainsString('<anime>', $xml);
        $this->assertStringContainsString('<user_total_anime>0</user_total_anime>', $xml);
    }

    public function test_generate_maps_status_constants_to_mal_status_strings(): void
    {
        $user = User::factory()->create();

        foreach ([
            UserAnimeList::STATUS_WATCHING => 'Watching',
            UserAnimeList::STATUS_COMPLETED => 'Completed',
            UserAnimeList::STATUS_ON_HOLD => 'On-Hold',
            UserAnimeList::STATUS_DROPPED => 'Dropped',
            UserAnimeList::STATUS_PLAN_TO_WATCH => 'Plan to Watch',
        ] as $internal => $malLabel) {
            $anime = Anime::factory()->create();
            UserAnimeList::factory()->for($user)->for($anime)->create(['status' => $internal]);
        }

        $xml = $this->service->generate($user);

        foreach (['Watching', 'Completed', 'On-Hold', 'Dropped', 'Plan to Watch'] as $label) {
            $this->assertStringContainsString("<my_status>{$label}</my_status>", $xml);
        }
    }
}
