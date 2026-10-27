<?php

namespace Tests\Unit\Services;

use App\Models\SyncRun;
use App\Services\SyncRunTracker;
use Illuminate\Queue\MaxAttemptsExceededException;
use Tests\TestCase;

class SyncRunTrackerTest extends TestCase
{
    private SyncRunTracker $tracker;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tracker = app(SyncRunTracker::class);
    }

    public function test_starting_a_run_supersedes_an_abandoned_run_of_the_same_mode(): void
    {
        $abandoned = $this->tracker->start(SyncRun::MODE_INCREMENTAL);

        $fresh = $this->tracker->start(SyncRun::MODE_INCREMENTAL);

        $this->assertSame(SyncRun::STATUS_SUPERSEDED, $abandoned->fresh()->status);
        $this->assertNotNull($abandoned->fresh()->finished_at);
        $this->assertSame(SyncRun::STATUS_RUNNING, $fresh->status);
    }

    public function test_targeted_runs_with_different_labels_do_not_supersede_each_other(): void
    {
        $releasing = $this->tracker->start(SyncRun::MODE_TARGETED, 'RELEASING');

        $notYetReleased = $this->tracker->start(SyncRun::MODE_TARGETED, 'NOT_YET_RELEASED');

        $this->assertSame(SyncRun::STATUS_RUNNING, $releasing->fresh()->status);
        $this->assertSame(SyncRun::STATUS_RUNNING, $notYetReleased->status);
    }

    public function test_advance_records_progress_and_clears_a_previous_pause(): void
    {
        $run = $this->tracker->start(SyncRun::MODE_SCHEDULE);
        $this->tracker->pause($run, 'AniList unavailable');

        $this->assertSame(SyncRun::STATUS_PAUSED, $run->fresh()->status);

        $this->tracker->advance($run, page: 3, lastPage: 10, totalItems: 500, processedDelta: 50);

        $run->refresh();
        $this->assertSame(SyncRun::STATUS_RUNNING, $run->status);
        $this->assertNull($run->last_error);
        $this->assertSame(3, $run->current_page);
        $this->assertSame(10, $run->last_page);
        $this->assertSame(50, $run->processed_items);
    }

    public function test_advance_never_rewinds_progress_when_a_page_lands_out_of_order(): void
    {
        $run = $this->tracker->start(SyncRun::MODE_FULL);

        $this->tracker->advance($run, page: 7, lastPage: 20, totalItems: 1000, processedDelta: 50);
        $this->tracker->advance($run, page: 4, lastPage: 20, totalItems: 1000, processedDelta: 50);

        $run->refresh();
        $this->assertSame(7, $run->current_page);
        $this->assertSame(100, $run->processed_items);
    }

    public function test_next_cutoff_is_anchored_to_the_start_of_the_last_completed_run(): void
    {
        $run = $this->tracker->start(SyncRun::MODE_INCREMENTAL);
        $run->forceFill([
            'started_at' => now()->subHours(3),
            'status' => SyncRun::STATUS_COMPLETED,
            // Finished two hours after it started: anything AniList edited in
            // between must still fall inside the next cutoff.
            'finished_at' => now()->subHour(),
        ])->save();

        $cutoff = $this->tracker->nextCutoffFor(SyncRun::MODE_INCREMENTAL, fallbackSeconds: 86400);

        $this->assertSame(now()->subHours(3)->timestamp - 300, $cutoff);
    }

    public function test_next_cutoff_falls_back_when_nothing_has_completed(): void
    {
        // A run that failed must not move the cutoff forward.
        $failed = $this->tracker->start(SyncRun::MODE_INCREMENTAL);
        $this->tracker->fail($failed, 'boom');

        $cutoff = $this->tracker->nextCutoffFor(SyncRun::MODE_INCREMENTAL, fallbackSeconds: 86400);

        $this->assertSame(now()->subDay()->timestamp, $cutoff);
    }

    public function test_latest_runs_returns_the_newest_run_per_mode_and_label(): void
    {
        $this->tracker->start(SyncRun::MODE_TARGETED, 'RELEASING');
        $newerReleasing = $this->tracker->start(SyncRun::MODE_TARGETED, 'RELEASING');
        $notYetReleased = $this->tracker->start(SyncRun::MODE_TARGETED, 'NOT_YET_RELEASED');
        $schedule = $this->tracker->start(SyncRun::MODE_SCHEDULE);

        $latest = $this->tracker->latestRuns();

        $this->assertEqualsCanonicalizing(
            [$newerReleasing->id, $notYetReleased->id, $schedule->id],
            $latest->pluck('id')->all(),
        );
    }

    public function test_giving_up_while_paused_keeps_the_reason_it_was_waiting_on(): void
    {
        $run = $this->tracker->start(SyncRun::MODE_STALE_REFRESH);
        $run->forceFill(['started_at' => now()->subHours(6)])->save();
        $this->tracker->pause($run, 'AniList API temporarily unavailable: severe stability issues');

        // What the queue reports once retryUntil lapses. On its own it reads
        // like the attempt-exhaustion bug rather than the outage behind it.
        $this->tracker->fail($run, new MaxAttemptsExceededException(
            'App\Jobs\RefreshStaleAnimeBatch has been attempted too many times.'
        ));

        $run->refresh();
        $this->assertSame(SyncRun::STATUS_FAILED, $run->status);
        $this->assertStringContainsString('severe stability issues', $run->last_error);
        $this->assertStringContainsString('6h', $run->last_error);
        $this->assertStringContainsString('attempted too many times', $run->last_error);
    }

    public function test_a_failure_that_was_not_paused_reports_only_its_own_error(): void
    {
        $run = $this->tracker->start(SyncRun::MODE_FULL);
        $this->tracker->advance($run, page: 2, lastPage: 10, totalItems: 100, processedDelta: 50);

        $this->tracker->fail($run, new \RuntimeException('missing Page key'));

        $this->assertStringNotContainsString('Gave up after', $run->fresh()->last_error);
        $this->assertStringContainsString('missing Page key', $run->fresh()->last_error);
    }

    public function test_a_run_whose_worker_died_stops_blocking_new_sweeps(): void
    {
        $abandoned = $this->tracker->start(SyncRun::MODE_STALE_REFRESH);

        $this->assertTrue($this->tracker->hasRunInProgress(SyncRun::MODE_STALE_REFRESH));

        // Worker lost mid-sweep: the row stays "running" but nothing is
        // beating for it. Without this, one lost job blocks the mode forever.
        $abandoned->forceFill([
            'heartbeat_at' => now()->subSeconds(SyncRun::HEARTBEAT_TIMEOUT_SECONDS + 60),
        ])->save();

        $this->assertFalse($this->tracker->hasRunInProgress(SyncRun::MODE_STALE_REFRESH));
        $this->assertTrue($abandoned->fresh()->isStalled());
    }

    public function test_a_paused_run_keeps_beating_and_still_blocks(): void
    {
        $run = $this->tracker->start(SyncRun::MODE_STALE_REFRESH);
        $run->forceFill(['heartbeat_at' => now()->subHours(3)])->save();

        // Each outage retry re-pauses, which refreshes the heartbeat.
        $this->tracker->pause($run, 'AniList unavailable');

        $this->assertTrue($this->tracker->hasRunInProgress(SyncRun::MODE_STALE_REFRESH));
        $this->assertFalse($run->fresh()->isStalled());
    }

    public function test_has_run_in_progress_ignores_finished_runs(): void
    {
        $run = $this->tracker->start(SyncRun::MODE_STALE_REFRESH);

        $this->assertTrue($this->tracker->hasRunInProgress(SyncRun::MODE_STALE_REFRESH));

        $this->tracker->complete($run);

        $this->assertFalse($this->tracker->hasRunInProgress(SyncRun::MODE_STALE_REFRESH));
    }
}
