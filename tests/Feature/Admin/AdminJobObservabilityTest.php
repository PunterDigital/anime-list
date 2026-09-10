<?php

namespace Tests\Feature\Admin;

use App\Jobs\RefreshAnimeFromAniList;
use App\Jobs\RefreshStaleAnimeBatch;
use App\Jobs\SyncAnimePage;
use App\Models\Anime;
use App\Models\SyncRun;
use App\Services\AnimeRefreshPolicy;
use App\Services\SyncRunTracker;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AdminJobObservabilityTest extends TestCase
{
    public function test_admin_can_view_jobs_observability_page(): void
    {
        $this->actingAsAdmin();

        Anime::factory()->create([
            'created_at' => now()->subHours(6),
            'synced_at' => now()->subHours(2),
        ]);

        DB::table('failed_jobs')->insert([
            'uuid' => 'test-uuid-1',
            'connection' => 'database',
            'queue' => 'sync',
            'payload' => json_encode(['displayName' => 'App\\Jobs\\SyncAnimePage']),
            'exception' => "RuntimeException: kaboom\nat /app/x.php:1",
            'failed_at' => now(),
        ]);

        $response = $this->get('/admin/jobs');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/JobsPage')
            ->has('metrics.queued_total')
            ->has('metrics.failed_total')
            ->where('metrics.failed_total', 1)
            ->where('metrics.anime_added.last_24h', 1)
            ->where('metrics.anime_updated.last_24h', 1)
            ->has('recentFailed', 1)
            ->where('recentFailed.0.uuid', 'test-uuid-1'));
    }

    public function test_admin_can_enqueue_anime_refresh_by_anilist_id(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        $this->post('/admin/jobs/anime', ['anilist_id' => 12345])
            ->assertRedirect();

        Queue::assertPushed(RefreshAnimeFromAniList::class, fn ($job) => $job->anilistId === 12345);
    }

    public function test_admin_can_enqueue_anime_refresh_by_internal_id(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        $anime = Anime::factory()->create(['anilist_id' => 999]);

        $this->post('/admin/jobs/anime', ['anime_id' => $anime->id])
            ->assertRedirect();

        Queue::assertPushed(RefreshAnimeFromAniList::class, fn ($job) => $job->anilistId === 999);
    }

    public function test_enqueue_requires_at_least_one_id(): void
    {
        $this->actingAsAdmin();

        $this->from('/admin/jobs')
            ->post('/admin/jobs/anime', [])
            ->assertRedirect('/admin/jobs')
            ->assertSessionHasErrors('anilist_id');
    }

    public function test_admin_can_dispatch_incremental_sync(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        $this->post('/admin/jobs/sync/incremental')->assertRedirect();

        Queue::assertPushed(SyncAnimePage::class, fn ($job) => $job->mode === 'incremental');

        // The dispatch opens a tracked run so the panel can report on it.
        $run = SyncRun::where('mode', SyncRun::MODE_INCREMENTAL)->firstOrFail();
        $this->assertSame(SyncRun::STATUS_RUNNING, $run->status);
        Queue::assertPushed(SyncAnimePage::class, fn ($job) => $job->syncRunId === $run->id);
    }

    public function test_incremental_sync_is_not_dispatched_twice_concurrently(): void
    {
        Queue::fake();
        $this->actingAsAdmin();
        app(SyncRunTracker::class)->start(SyncRun::MODE_INCREMENTAL);

        $this->from('/admin/jobs')
            ->post('/admin/jobs/sync/incremental')
            ->assertRedirect('/admin/jobs')
            ->assertSessionHasErrors('sync');

        Queue::assertNothingPushed();
    }

    public function test_jobs_page_reports_the_latest_run_per_sync_mode(): void
    {
        $this->actingAsAdmin();
        $tracker = app(SyncRunTracker::class);

        // Two targeted syncs overlap on the schedule; each needs its own row
        // rather than overwriting the other's status.
        $tracker->complete($tracker->start(SyncRun::MODE_TARGETED, 'RELEASING'));
        $tracker->start(SyncRun::MODE_TARGETED, 'NOT_YET_RELEASED');
        $tracker->fail($tracker->start(SyncRun::MODE_SCHEDULE), 'kaboom');

        $this->get('/admin/jobs')->assertInertia(fn ($page) => $page
            ->has('syncRuns', 3)
            ->where('syncRuns.0.label', 'NOT_YET_RELEASED')
            ->where('syncRuns.0.status', SyncRun::STATUS_RUNNING)
            ->where('syncRuns.1.label', 'RELEASING')
            ->where('syncRuns.1.status', SyncRun::STATUS_COMPLETED)
            ->where('syncRuns.2.mode', SyncRun::MODE_SCHEDULE)
            ->where('syncRuns.2.status', SyncRun::STATUS_FAILED));
    }

    public function test_stale_metrics_ignore_anime_excluded_from_refreshes(): void
    {
        $this->actingAsAdmin();

        Anime::factory()->create(['synced_at' => now()->subDays(90)]);
        Anime::factory()->create([
            'synced_at' => now()->subDays(90),
            'refresh_excluded_at' => now(),
            'refresh_exclusion_reason' => AnimeRefreshPolicy::REASON_FINISHED,
        ]);

        $this->get('/admin/jobs')->assertInertia(fn ($page) => $page
            ->where('metrics.stale_sync', 1)
            ->where('metrics.refresh_excluded', 1)
            ->where('metrics.refresh_excluded_by_reason.0.reason', AnimeRefreshPolicy::REASON_FINISHED)
            ->where('metrics.refresh_excluded_by_reason.0.count', 1));
    }

    public function test_admin_can_dispatch_a_stale_refresh_sweep(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        Anime::factory()->create(['synced_at' => now()->subDays(90)]);

        $this->post('/admin/jobs/sync/stale-refresh')->assertRedirect();

        $run = SyncRun::where('mode', SyncRun::MODE_STALE_REFRESH)->firstOrFail();
        Queue::assertPushed(
            RefreshStaleAnimeBatch::class,
            fn (RefreshStaleAnimeBatch $job) => $job->syncRunId === $run->id,
        );
    }

    public function test_admin_can_step_through_the_backlog_one_batch_at_a_time(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        Anime::factory()->count(3)->create(['synced_at' => now()->subDays(90)]);

        $this->post('/admin/jobs/sync/stale-refresh', ['batches' => 1])->assertRedirect();

        Queue::assertPushed(
            RefreshStaleAnimeBatch::class,
            fn (RefreshStaleAnimeBatch $job) => $job->maxBatches === 1 && $job->batchNumber === 1,
        );
    }

    public function test_a_full_sweep_leaves_the_batch_cap_to_config(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        Anime::factory()->create(['synced_at' => now()->subDays(90)]);

        $this->post('/admin/jobs/sync/stale-refresh')->assertRedirect();

        Queue::assertPushed(
            RefreshStaleAnimeBatch::class,
            fn (RefreshStaleAnimeBatch $job) => $job->maxBatches === null,
        );
    }

    public function test_the_batch_cap_is_validated(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        Anime::factory()->create(['synced_at' => now()->subDays(90)]);

        $this->from('/admin/jobs')
            ->post('/admin/jobs/sync/stale-refresh', ['batches' => 0])
            ->assertRedirect('/admin/jobs')
            ->assertSessionHasErrors('batches');

        Queue::assertNothingPushed();
    }

    public function test_stale_refresh_is_not_dispatched_while_one_is_running(): void
    {
        Queue::fake();
        $this->actingAsAdmin();
        Anime::factory()->create(['synced_at' => now()->subDays(90)]);
        app(SyncRunTracker::class)->start(SyncRun::MODE_STALE_REFRESH);

        $this->from('/admin/jobs')
            ->post('/admin/jobs/sync/stale-refresh')
            ->assertRedirect('/admin/jobs')
            ->assertSessionHasErrors('sync');

        Queue::assertNothingPushed();
    }

    public function test_stale_refresh_does_nothing_when_the_backlog_is_empty(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        Anime::factory()->create(['synced_at' => now()]);

        $this->post('/admin/jobs/sync/stale-refresh')->assertRedirect();

        Queue::assertNothingPushed();
        $this->assertSame(0, SyncRun::where('mode', SyncRun::MODE_STALE_REFRESH)->count());
    }

    public function test_admin_can_clear_refresh_exclusions(): void
    {
        $this->actingAsAdmin();

        $excluded = Anime::factory()->create([
            'synced_at' => now()->subDays(90),
            'refresh_excluded_at' => now(),
            'refresh_exclusion_reason' => AnimeRefreshPolicy::REASON_FINISHED,
        ]);

        $this->delete('/admin/jobs/refresh-exclusions')->assertRedirect();

        $excluded->refresh();
        $this->assertNull($excluded->refresh_excluded_at);
        $this->assertNull($excluded->refresh_exclusion_reason);
    }

    public function test_admin_can_view_the_full_stack_trace_of_a_failed_job(): void
    {
        $this->actingAsAdmin();

        $trace = "Illuminate\\Queue\\MaxAttemptsExceededException: too many times\n#0 /app/vendor/a.php(10)\n#1 /app/vendor/b.php(20)";

        DB::table('failed_jobs')->insert([
            'uuid' => 'trace-me',
            'connection' => 'redis',
            'queue' => 'sync',
            'payload' => json_encode([
                'displayName' => 'App\\Jobs\\SyncAiringSchedulePage',
                'attempts' => 3,
            ]),
            'exception' => $trace,
            'failed_at' => now(),
        ]);

        $response = $this->getJson('/admin/jobs/failed/trace-me');

        $response->assertOk();
        $response->assertJsonPath('uuid', 'trace-me');
        $response->assertJsonPath('connection', 'redis');
        $response->assertJsonPath('queue', 'sync');
        $response->assertJsonPath('job_class', 'App\\Jobs\\SyncAiringSchedulePage');
        $response->assertJsonPath('attempts', 3);
        $response->assertJsonPath('exception', $trace);
        $this->assertStringContainsString('SyncAiringSchedulePage', $response->json('payload'));
    }

    public function test_stack_trace_request_for_an_unknown_job_is_not_found(): void
    {
        $this->actingAsAdmin();

        $this->getJson('/admin/jobs/failed/nope')->assertNotFound();
    }

    public function test_admin_can_forget_failed_job(): void
    {
        $this->actingAsAdmin();

        DB::table('failed_jobs')->insert([
            'uuid' => 'forget-me',
            'connection' => 'database',
            'queue' => 'sync',
            'payload' => '{}',
            'exception' => 'boom',
            'failed_at' => now(),
        ]);

        $this->delete('/admin/jobs/failed/forget-me')->assertRedirect();

        $this->assertDatabaseMissing('failed_jobs', ['uuid' => 'forget-me']);
    }

    public function test_admin_can_clear_all_failed_jobs(): void
    {
        $this->actingAsAdmin();

        foreach (['a', 'b', 'c'] as $uuid) {
            DB::table('failed_jobs')->insert([
                'uuid' => $uuid,
                'connection' => 'redis',
                'queue' => 'sync',
                'payload' => '{}',
                'exception' => 'boom',
                'failed_at' => now(),
            ]);
        }

        $this->delete('/admin/jobs/failed')->assertRedirect();

        $this->assertSame(0, DB::table('failed_jobs')->count());
    }

    public function test_clearing_failed_jobs_is_harmless_when_there_are_none(): void
    {
        $this->actingAsAdmin();

        $this->delete('/admin/jobs/failed')
            ->assertRedirect()
            ->assertSessionHasNoErrors();
    }

    public function test_clearing_all_does_not_collide_with_forgetting_one(): void
    {
        $this->actingAsAdmin();

        DB::table('failed_jobs')->insert([
            'uuid' => 'keep-me',
            'connection' => 'redis',
            'queue' => 'sync',
            'payload' => '{}',
            'exception' => 'boom',
            'failed_at' => now(),
        ]);
        DB::table('failed_jobs')->insert([
            'uuid' => 'drop-me',
            'connection' => 'redis',
            'queue' => 'sync',
            'payload' => '{}',
            'exception' => 'boom',
            'failed_at' => now(),
        ]);

        // The single-job route must still resolve rather than being swallowed
        // by the new collection-level DELETE.
        $this->delete('/admin/jobs/failed/drop-me')->assertRedirect();

        $this->assertDatabaseMissing('failed_jobs', ['uuid' => 'drop-me']);
        $this->assertDatabaseHas('failed_jobs', ['uuid' => 'keep-me']);
    }

    public function test_non_admin_cannot_access_jobs_routes(): void
    {
        $user = \App\Models\User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/admin/jobs')->assertForbidden();
        $this->actingAs($user)->post('/admin/jobs/anime', ['anilist_id' => 1])->assertForbidden();
        $this->actingAs($user)->post('/admin/jobs/sync/stale-refresh')->assertForbidden();
        $this->actingAs($user)->get('/admin/jobs/failed/trace-me')->assertForbidden();
        $this->actingAs($user)->delete('/admin/jobs/failed')->assertForbidden();
        $this->actingAs($user)->delete('/admin/jobs/refresh-exclusions')->assertForbidden();
    }
}
