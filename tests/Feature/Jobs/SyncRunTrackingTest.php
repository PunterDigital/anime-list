<?php

namespace Tests\Feature\Jobs;

use App\Exceptions\AniListServiceUnavailableException;
use App\Jobs\RefreshAnimeFromAniList;
use App\Jobs\RefreshStaleAnimeBatch;
use App\Jobs\SyncAiringSchedulePage;
use App\Jobs\SyncAnimePage;
use App\Jobs\SyncRecommendationsPage;
use App\Models\SyncRun;
use App\Services\AniListClient;
use App\Services\SyncRunTracker;
use Illuminate\Contracts\Queue\Job as QueueJobContract;
use Illuminate\Queue\MaxAttemptsExceededException;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SyncRunTrackingTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    protected function setUp(): void
    {
        parent::setUp();

        Redis::shouldReceive('rpush')->zeroOrMoreTimes();
    }

    /**
     * Every AniList-facing job releases itself while the API is down. With a
     * fixed $tries those releases burned the attempt budget and the chain died
     * with MaxAttemptsExceededException, which is what the sync queue was
     * actually failing on.
     *
     * @return array<int, array{0: object}>
     */
    public static function anilistJobProvider(): array
    {
        return [
            'anime page' => [new SyncAnimePage(page: 1)],
            'airing schedule page' => [new SyncAiringSchedulePage(page: 1, airingAtGreater: 0, airingAtLesser: 1)],
            'recommendations page' => [new SyncRecommendationsPage(page: 1)],
            'stale refresh batch' => [new RefreshStaleAnimeBatch],
            'single anime refresh' => [new RefreshAnimeFromAniList(1)],
        ];
    }

    #[DataProvider('anilistJobProvider')]
    public function test_anilist_jobs_bound_attempts_by_deadline_not_by_release_count(object $job): void
    {
        $this->assertSame(0, $job->tries, 'A fixed try count is spent by outage releases.');
        $this->assertSame(3, $job->maxExceptions, 'Genuine errors should still fail fast.');
        $this->assertGreaterThan(now()->addHour(), $job->retryUntil());
    }

    public function test_completing_a_sweep_marks_the_run_completed(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_INCREMENTAL);

        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('query')->once()->andReturn([
            'Page' => [
                'pageInfo' => ['hasNextPage' => false, 'currentPage' => 1, 'lastPage' => 1, 'total' => 0],
                'media' => [],
            ],
        ]);
        $client->shouldReceive('storeRawResponse')->zeroOrMoreTimes();
        $this->instance(AniListClient::class, $client);

        $job = new SyncAnimePage(page: 1, mode: SyncRun::MODE_INCREMENTAL, syncRunId: $run->id);
        app()->call([$job, 'handle']);

        $run->refresh();
        $this->assertSame(SyncRun::STATUS_COMPLETED, $run->status);
        $this->assertNotNull($run->finished_at);
    }

    public function test_a_page_landing_after_an_outage_clears_the_paused_status(): void
    {
        Queue::fake();

        $tracker = app(SyncRunTracker::class);
        $run = $tracker->start(SyncRun::MODE_SCHEDULE);
        $tracker->pause($run, 'AniList unavailable');

        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('query')->once()->andReturn([
            'Page' => [
                'pageInfo' => ['hasNextPage' => false, 'currentPage' => 2, 'lastPage' => 2, 'total' => 0],
                'airingSchedules' => [],
            ],
        ]);
        $client->shouldReceive('storeRawResponse')->zeroOrMoreTimes();
        $this->instance(AniListClient::class, $client);

        $job = new SyncAiringSchedulePage(
            page: 2,
            airingAtGreater: now()->timestamp,
            airingAtLesser: now()->addWeek()->timestamp,
            syncRunId: $run->id,
        );
        app()->call([$job, 'handle']);

        // The old cache-backed status was written once on pause and never
        // cleared, so a single AniList blip left the panel showing "paused"
        // long after the sweep had recovered.
        $this->assertSame(SyncRun::STATUS_COMPLETED, $run->fresh()->status);
    }

    public function test_an_outage_pauses_the_schedule_run_rather_than_failing_it(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_SCHEDULE);

        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('query')->once()->andThrow(new AniListServiceUnavailableException(
            statusCode: 403,
            retryAfter: 900,
            message: 'AniList API temporarily unavailable',
        ));
        $this->instance(AniListClient::class, $client);

        $queueJob = Mockery::mock(QueueJobContract::class);
        $queueJob->shouldReceive('release')->once()->with(900);
        $queueJob->shouldReceive('isReleased')->andReturn(true);
        $queueJob->shouldReceive('isDeleted')->andReturn(false);
        $queueJob->shouldReceive('hasFailed')->andReturn(false);

        $job = new SyncAiringSchedulePage(
            page: 1,
            airingAtGreater: now()->timestamp,
            airingAtLesser: now()->addWeek()->timestamp,
            syncRunId: $run->id,
        );
        $job->setJob($queueJob);
        app()->call([$job, 'handle']);

        $this->assertSame(SyncRun::STATUS_PAUSED, $run->fresh()->status);
    }

    /**
     * Jobs already sitting on the queue when a deploy lands were serialized
     * against the previous class definition. A promoted constructor property
     * carries no class-level default, so those payloads unserialize with
     * $syncRunId uninitialized and failed() died reading it — which is exactly
     * what production hit after the sync_runs deploy.
     *
     * @return array<string, array{0: object, 1: array<string, mixed>}>
     */
    public static function legacyPayloadProvider(): array
    {
        return [
            'anime page' => [
                new SyncAnimePage(page: 1),
                ['page' => 3, 'perPage' => 50, 'mode' => 'full'],
            ],
            'airing schedule page' => [
                new SyncAiringSchedulePage(page: 1, airingAtGreater: 0, airingAtLesser: 1),
                ['page' => 3, 'airingAtGreater' => 0, 'airingAtLesser' => 1, 'perPage' => 50],
            ],
            'recommendations page' => [
                new SyncRecommendationsPage(page: 1),
                ['page' => 3, 'perPage' => 50],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $legacyProperties
     */
    #[DataProvider('legacyPayloadProvider')]
    public function test_a_payload_queued_before_run_tracking_still_fails_cleanly(
        object $prototype,
        array $legacyProperties,
    ): void {
        // Rebuild the job the way unserialize() does — no constructor call —
        // populating only the properties the old payload carried.
        $reflection = new \ReflectionClass($prototype);
        $job = $reflection->newInstanceWithoutConstructor();

        foreach ($legacyProperties as $name => $value) {
            $reflection->getProperty($name)->setValue($job, $value);
        }

        $this->assertNull($job->syncRunId);

        $job->failed(new \RuntimeException('queued before the deploy'));
    }

    public function test_a_failed_page_marks_its_run_failed_with_the_reason(): void
    {
        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_FULL);

        (new SyncAnimePage(page: 4, mode: SyncRun::MODE_FULL, syncRunId: $run->id))
            ->failed(new \RuntimeException('AniList response missing Page key'));

        $run->refresh();
        $this->assertSame(SyncRun::STATUS_FAILED, $run->status);
        $this->assertStringContainsString('missing Page key', $run->last_error);
    }

    public function test_a_job_that_gives_up_mid_outage_still_reports_the_outage(): void
    {
        $tracker = app(SyncRunTracker::class);
        $run = $tracker->start(SyncRun::MODE_SCHEDULE);
        $tracker->pause($run, 'AniList API temporarily unavailable: severe stability issues');

        // What the worker does once retryUntil lapses on a released job.
        (new SyncAiringSchedulePage(
            page: 1,
            airingAtGreater: 0,
            airingAtLesser: 1,
            syncRunId: $run->id,
        ))->failed(new MaxAttemptsExceededException(
            'App\Jobs\SyncAiringSchedulePage has been attempted too many times.'
        ));

        $this->assertStringContainsString('severe stability issues', $run->fresh()->last_error);
    }

    public function test_a_chained_page_stays_attached_to_the_same_run(): void
    {
        Queue::fake();

        $run = app(SyncRunTracker::class)->start(SyncRun::MODE_FULL);

        $client = Mockery::mock(AniListClient::class);
        $client->shouldReceive('query')->once()->andReturn([
            'Page' => [
                'pageInfo' => ['hasNextPage' => true, 'currentPage' => 1, 'lastPage' => 9, 'total' => 400],
                'media' => [],
            ],
        ]);
        $client->shouldReceive('storeRawResponse')->zeroOrMoreTimes();
        $this->instance(AniListClient::class, $client);

        $job = new SyncAnimePage(page: 1, mode: SyncRun::MODE_FULL, syncRunId: $run->id);
        app()->call([$job, 'handle']);

        Queue::assertPushed(
            SyncAnimePage::class,
            fn (SyncAnimePage $next) => $next->page === 2 && $next->syncRunId === $run->id,
        );
        $this->assertSame(SyncRun::STATUS_RUNNING, $run->fresh()->status);
        $this->assertSame(9, $run->fresh()->last_page);
    }
}
