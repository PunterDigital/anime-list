<?php

namespace Tests\Feature\Jobs;

use App\Jobs\SyncAnimePage;
use App\Jobs\SyncRecommendationsPage;
use App\Models\SyncRun;
use App\Services\AniListClient;
use App\Services\AniListPageDepth;
use App\Services\SyncRunTracker;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Tests\TestCase;

/**
 * AniList answers any page reaching past the first 5,000 entries of a result
 * set with a 400 "Page depth exceeds maximum allowed for API requests". The
 * incremental sweep walked into that wall on page 101 of 101 and the whole run
 * was recorded as failed after processing 5,000 of 5,051 anime.
 */
class SyncPageDepthTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    protected function setUp(): void
    {
        parent::setUp();

        Redis::shouldReceive('rpush')->zeroOrMoreTimes();
        config(['anilist.sync.max_page_depth' => 100]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $media
     */
    private function fakeClient(array $pageInfo, array $media = []): void
    {
        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('query')->once()->andReturn([
            'Page' => ['pageInfo' => $pageInfo, 'media' => $media],
        ]);
        $client->shouldReceive('storeRawResponse')->zeroOrMoreTimes();
        $this->instance(AniListClient::class, $client);
    }

    public function test_max_page_is_derived_from_the_depth_limit_and_page_size(): void
    {
        config(['anilist.sync.max_page_depth' => 5000]);

        $this->assertSame(100, AniListPageDepth::maxPage(50));
        $this->assertTrue(AniListPageDepth::allows(100, 50));
        $this->assertFalse(AniListPageDepth::allows(101, 50));
    }

    public function test_incremental_sweep_stops_at_the_depth_limit_instead_of_failing(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_INCREMENTAL);

        // Page 10 of 11 at perPage 10 — the sweep wants an eleventh page that
        // AniList will not serve.
        $this->fakeClient(
            ['hasNextPage' => true, 'currentPage' => 10, 'lastPage' => 11, 'total' => 105],
            [['id' => 1, 'updatedAt' => now()->timestamp]],
        );

        $job = new SyncAnimePage(
            page: 10,
            perPage: 10,
            mode: SyncRun::MODE_INCREMENTAL,
            updatedAtGreater: now()->subDay()->timestamp,
            syncRunId: $run->id,
        );
        app()->call([$job, 'handle']);

        Queue::assertNotPushed(SyncAnimePage::class);

        $run->refresh();
        $this->assertSame(SyncRun::STATUS_COMPLETED, $run->status);
        $this->assertStringContainsString('page depth limit', $run->last_error);
    }

    public function test_a_page_within_the_depth_limit_still_chains_normally(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_INCREMENTAL);

        $this->fakeClient(
            ['hasNextPage' => true, 'currentPage' => 5, 'lastPage' => 11, 'total' => 105],
            [['id' => 1, 'updatedAt' => now()->timestamp]],
        );

        $job = new SyncAnimePage(
            page: 5,
            perPage: 10,
            mode: SyncRun::MODE_INCREMENTAL,
            updatedAtGreater: now()->subDay()->timestamp,
            syncRunId: $run->id,
        );
        app()->call([$job, 'handle']);

        Queue::assertPushed(SyncAnimePage::class, fn (SyncAnimePage $next) => $next->page === 6
            && $next->idGreater === null
            && $next->pageOffset === 0);
    }

    public function test_full_sweep_reopens_a_new_id_window_at_the_depth_limit(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_FULL);

        $this->fakeClient(
            ['hasNextPage' => true, 'currentPage' => 10, 'lastPage' => 20, 'total' => 200],
            [['id' => 4141], ['id' => 4242]],
        );

        $job = new SyncAnimePage(page: 10, perPage: 10, mode: SyncRun::MODE_FULL, syncRunId: $run->id);
        app()->call([$job, 'handle']);

        Queue::assertPushed(SyncAnimePage::class, fn (SyncAnimePage $next) => $next->page === 1
            && $next->idGreater === 4242
            && $next->pageOffset === 10);

        $this->assertSame(SyncRun::STATUS_RUNNING, $run->fresh()->status);
    }

    public function test_a_windowed_page_reports_absolute_progress(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_FULL);

        $this->fakeClient(
            ['hasNextPage' => false, 'currentPage' => 3, 'lastPage' => 3, 'total' => 30],
            [['id' => 5000], ['id' => 5001]],
        );

        $job = new SyncAnimePage(
            page: 3,
            perPage: 10,
            mode: SyncRun::MODE_FULL,
            syncRunId: $run->id,
            idGreater: 4242,
            pageOffset: 10,
        );
        app()->call([$job, 'handle']);

        $run->refresh();
        $this->assertSame(13, $run->current_page, 'Progress restarted at the window page, not the sweep page.');
        $this->assertSame(13, $run->last_page);
        $this->assertSame(SyncRun::STATUS_COMPLETED, $run->status);
        $this->assertNull($run->last_error);
    }

    public function test_a_stale_payload_past_the_limit_is_skipped_rather_than_sent(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_INCREMENTAL);

        // No client expectation: the job must not reach AniList at all.
        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('query')->never();
        $client->shouldReceive('storeRawResponse')->zeroOrMoreTimes();
        $this->instance(AniListClient::class, $client);

        $job = new SyncAnimePage(page: 101, perPage: 10, mode: SyncRun::MODE_INCREMENTAL, syncRunId: $run->id);
        app()->call([$job, 'handle']);

        $this->assertSame(SyncRun::STATUS_COMPLETED, $run->fresh()->status);
    }

    public function test_recommendations_sweep_reopens_a_new_id_window_at_the_depth_limit(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_RECOMMENDATIONS);

        $this->fakeClient(
            ['hasNextPage' => true, 'currentPage' => 10, 'lastPage' => 20, 'total' => 200],
            [['id' => 777, 'recommendations' => ['edges' => []]]],
        );

        $job = new SyncRecommendationsPage(page: 10, perPage: 10, syncRunId: $run->id);
        app()->call([$job, 'handle']);

        Queue::assertPushed(SyncRecommendationsPage::class, fn (SyncRecommendationsPage $next) => $next->page === 1
            && $next->idGreater === 777
            && $next->pageOffset === 10);
    }
}
