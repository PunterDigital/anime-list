<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\RefreshAnimeFromAniList;
use App\Jobs\RefreshStaleAnimeBatch;
use App\Jobs\SyncAnimePage;
use App\Models\Anime;
use App\Models\SyncRun;
use App\Services\AnimeRefreshPolicy;
use App\Services\SyncRunTracker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminJobObservabilityController extends Controller
{
    private const TRACKED_QUEUES = ['default', 'sync', 'import', 'recommendations'];

    public function __construct(
        private readonly SyncRunTracker $tracker,
        private readonly AnimeRefreshPolicy $refreshPolicy,
    ) {}

    public function index(Request $request): Response
    {
        $now = now();

        // Queue depth has to come from the queue driver itself. Production runs
        // on Redis, so reading the `jobs` table here only ever reported zero.
        $queuedByQueue = [];
        foreach (self::TRACKED_QUEUES as $queue) {
            $queuedByQueue[] = ['queue' => $queue, 'count' => $this->queueSize($queue)];
        }

        $failedByQueue = DB::table('failed_jobs')
            ->select('queue', DB::raw('count(*) as count'))
            ->groupBy('queue')
            ->pluck('count', 'queue')
            ->all();

        $failedLast24h = DB::table('failed_jobs')
            ->where('failed_at', '>=', $now->copy()->subDay())
            ->count();

        $animeAdded = [
            'last_24h' => Anime::where('created_at', '>=', $now->copy()->subDay())->count(),
            'last_7d' => Anime::where('created_at', '>=', $now->copy()->subDays(7))->count(),
            'last_30d' => Anime::where('created_at', '>=', $now->copy()->subDays(30))->count(),
        ];

        $animeUpdated = [
            'last_24h' => Anime::where('synced_at', '>=', $now->copy()->subDay())->count(),
            'last_7d' => Anime::where('synced_at', '>=', $now->copy()->subDays(7))->count(),
            'last_30d' => Anime::where('synced_at', '>=', $now->copy()->subDays(30))->count(),
        ];

        $staleDays = (int) config('anilist.refresh.stale_after_days', 30);

        $recentFailed = DB::table('failed_jobs')
            ->orderByDesc('failed_at')
            ->limit(15)
            ->get(['uuid', 'queue', 'payload', 'exception', 'failed_at'])
            ->map(fn ($row) => [
                'uuid' => $row->uuid,
                'queue' => $row->queue,
                'job_class' => $this->extractJobClass($row->payload),
                'exception_summary' => Str::limit($this->extractExceptionMessage($row->exception), 240),
                'failed_at' => $row->failed_at,
            ])
            ->all();

        $recentlyAdded = Anime::query()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'slug', 'anilist_id', 'title_english', 'title_romaji', 'cover_image_medium', 'created_at'])
            ->map(fn (Anime $a) => [
                'id' => $a->id,
                'slug' => $a->slug,
                'anilist_id' => $a->anilist_id,
                'title' => $a->title_english ?: $a->title_romaji,
                'cover_image_medium' => $a->cover_image_medium,
                'created_at' => $a->created_at?->toIso8601String(),
            ])
            ->all();

        $recentlyUpdated = Anime::query()
            ->whereNotNull('synced_at')
            ->orderByDesc('synced_at')
            ->limit(10)
            ->get(['id', 'slug', 'anilist_id', 'title_english', 'title_romaji', 'cover_image_medium', 'synced_at'])
            ->map(fn (Anime $a) => [
                'id' => $a->id,
                'slug' => $a->slug,
                'anilist_id' => $a->anilist_id,
                'title' => $a->title_english ?: $a->title_romaji,
                'cover_image_medium' => $a->cover_image_medium,
                'synced_at' => $a->synced_at?->toIso8601String(),
            ])
            ->all();

        return Inertia::render('Admin/JobsPage', [
            'metrics' => [
                'queued_total' => array_sum(array_column($queuedByQueue, 'count')),
                'queued_by_queue' => $queuedByQueue,
                'failed_total' => array_sum($failedByQueue),
                'failed_by_queue' => $this->normalizeQueueCounts($failedByQueue),
                'failed_last_24h' => $failedLast24h,
                'queue_wait_seconds' => $this->longestQueueWait(),
                'anime_total' => Anime::count(),
                'anime_added' => $animeAdded,
                'anime_updated' => $animeUpdated,
                'never_synced' => Anime::whereNull('synced_at')->count(),
                'stale_sync' => Anime::query()->refreshable()->stale($staleDays)->count(),
                'refresh_excluded' => Anime::query()->refreshExcluded()->count(),
                'refresh_excluded_by_reason' => $this->exclusionBreakdown(),
                'stale_after_days' => $staleDays,
                'refresh_batch_size' => (int) config('anilist.refresh.batch_size', 50),
                'refresh_max_batches' => (int) config('anilist.refresh.max_batches_per_run', 200),
            ],
            'recentFailed' => $recentFailed,
            'recentlyAdded' => $recentlyAdded,
            'recentlyUpdated' => $recentlyUpdated,
            'syncRuns' => $this->syncRunPayload(),
        ]);
    }

    public function enqueueAnime(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'anilist_id' => ['nullable', 'integer', 'min:1'],
            'anime_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $anilistId = $validated['anilist_id'] ?? null;

        if (! $anilistId && ! empty($validated['anime_id'])) {
            $anilistId = Anime::where('id', $validated['anime_id'])->value('anilist_id');
        }

        if (! $anilistId) {
            return back()->withErrors([
                'anilist_id' => 'Provide either an AniList ID or a known internal anime ID.',
            ]);
        }

        RefreshAnimeFromAniList::dispatch($anilistId)->onQueue('sync');

        return back()->with('message', "Queued AniList #{$anilistId} for refresh.");
    }

    public function enqueueIncrementalSync(): RedirectResponse
    {
        if ($this->tracker->hasRunInProgress(SyncRun::MODE_INCREMENTAL)) {
            return back()->withErrors([
                'sync' => 'An incremental sync is already in progress.',
            ]);
        }

        $cutoff = $this->tracker->nextCutoffFor(SyncRun::MODE_INCREMENTAL, fallbackSeconds: 86400);
        $run = $this->tracker->start(SyncRun::MODE_INCREMENTAL, cutoffAt: $cutoff);

        SyncAnimePage::dispatch(
            page: 1,
            perPage: config('anilist.sync.per_page', 50),
            mode: SyncRun::MODE_INCREMENTAL,
            updatedAtGreater: $cutoff,
            syncRunId: $run->id,
        )->onQueue('sync');

        return back()->with('message', 'Incremental sync dispatched.');
    }

    public function enqueueStaleRefresh(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Cap this run at N batches. Omitted means the configured
            // per-run cap, i.e. run the sweep until the backlog drains.
            'batches' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ]);

        if ($this->tracker->hasRunInProgress(SyncRun::MODE_STALE_REFRESH)) {
            return back()->withErrors([
                'sync' => 'A stale refresh is already in progress.',
            ]);
        }

        $staleDays = (int) config('anilist.refresh.stale_after_days', 30);
        $pending = Anime::query()->refreshable()->stale($staleDays)->count();

        if ($pending === 0) {
            return back()->with('message', 'Nothing to refresh — no stale anime outside the exclusion list.');
        }

        $batches = $validated['batches'] ?? null;
        $run = $this->tracker->start(SyncRun::MODE_STALE_REFRESH);

        RefreshStaleAnimeBatch::dispatch(
            maxBatches: $batches,
            syncRunId: $run->id,
        )->onQueue('sync');

        if ($batches !== null) {
            $size = (int) config('anilist.refresh.batch_size', 50);
            $covered = min($pending, $batches * $size);

            return back()->with(
                'message',
                "Dispatched {$batches} batch(es) — up to {$covered} of {$pending} stale anime. Run it again for the next batch.",
            );
        }

        return back()->with('message', "Stale refresh dispatched for {$pending} anime.");
    }

    /**
     * Put every excluded anime back into the refresh sweep.
     */
    public function clearRefreshExclusions(): RedirectResponse
    {
        $restored = $this->refreshPolicy->include(
            Anime::query()->refreshExcluded()->pluck('id')->all()
        );

        return back()->with('message', "Cleared refresh exclusions on {$restored} anime.");
    }

    /**
     * Full detail for one failed job, including the whole stack trace. The
     * index only carries a truncated first line, so the panel fetches this
     * when a failure is expanded.
     */
    public function showFailed(string $uuid): JsonResponse
    {
        $row = DB::table('failed_jobs')
            ->where('uuid', $uuid)
            ->first(['uuid', 'connection', 'queue', 'payload', 'exception', 'failed_at']);

        if ($row === null) {
            return response()->json(['message' => 'Failed job not found.'], 404);
        }

        return response()->json([
            'uuid' => $row->uuid,
            'connection' => $row->connection,
            'queue' => $row->queue,
            'job_class' => $this->extractJobClass($row->payload),
            'exception' => $row->exception,
            'failed_at' => $row->failed_at,
            'attempts' => $this->extractAttempts($row->payload),
            'payload' => $this->prettyPayload($row->payload),
        ]);
    }

    public function retryFailed(string $uuid): RedirectResponse
    {
        $exists = DB::table('failed_jobs')->where('uuid', $uuid)->exists();
        if (! $exists) {
            return back()->withErrors(['uuid' => 'Failed job not found.']);
        }

        Artisan::call('queue:retry', ['id' => [$uuid]]);

        return back()->with('message', "Retrying failed job {$uuid}.");
    }

    /**
     * Drop every failed job. Equivalent to queue:flush, from the panel.
     */
    public function flushFailed(): RedirectResponse
    {
        $deleted = DB::table('failed_jobs')->delete();

        if ($deleted === 0) {
            return back()->with('message', 'No failed jobs to clear.');
        }

        return back()->with('message', "Cleared {$deleted} failed job(s).");
    }

    public function forgetFailed(string $uuid): RedirectResponse
    {
        $deleted = DB::table('failed_jobs')->where('uuid', $uuid)->delete();
        if ($deleted === 0) {
            return back()->withErrors(['uuid' => 'Failed job not found.']);
        }

        return back()->with('message', "Removed failed job {$uuid}.");
    }

    /**
     * Latest run per sync mode (and per label, so the overlapping targeted
     * syncs are reported separately instead of overwriting each other).
     *
     * @return array<int, array<string, mixed>>
     */
    private function syncRunPayload(): array
    {
        $runs = $this->tracker->latestRuns()
            ->sortBy(fn (SyncRun $run) => [
                array_search($run->mode, SyncRun::TRACKED_MODES, true),
                $run->label ?? '',
            ])
            ->values();

        return $runs->map(fn (SyncRun $run) => [
            'id' => $run->id,
            'mode' => $run->mode,
            'label' => $run->label,
            'status' => $run->status,
            'stalled' => $run->isStalled(),
            'current_page' => $run->current_page,
            'last_page' => $run->last_page,
            'total_items' => $run->total_items,
            'processed_items' => $run->processed_items,
            'cutoff_at' => $run->cutoff_at,
            'started_at' => $run->started_at?->toIso8601String(),
            'finished_at' => $run->finished_at?->toIso8601String(),
            'heartbeat_at' => $run->heartbeat_at?->toIso8601String(),
            'duration_seconds' => $run->durationSeconds(),
            'last_error' => $run->last_error === null ? null : Str::limit($run->last_error, 240),
        ])->all();
    }

    /**
     * @return array<int, array{reason: string, count: int}>
     */
    private function exclusionBreakdown(): array
    {
        return Anime::query()
            ->refreshExcluded()
            ->select('refresh_exclusion_reason', DB::raw('count(*) as count'))
            ->groupBy('refresh_exclusion_reason')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'reason' => $row->refresh_exclusion_reason ?? 'unspecified',
                'count' => (int) $row->count,
            ])
            ->all();
    }

    private function queueSize(string $queue): int
    {
        try {
            return (int) Queue::connection()->size($queue);
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Horizon's estimate, in seconds, of how long the busiest tracked queue
     * would take to drain. Null when Horizon has no data (or is not running).
     */
    private function longestQueueWait(): ?int
    {
        if (! class_exists(\Laravel\Horizon\WaitTimeCalculator::class)) {
            return null;
        }

        try {
            $waits = app(\Laravel\Horizon\WaitTimeCalculator::class)->calculate();
        } catch (\Throwable $e) {
            return null;
        }

        $tracked = collect($waits)
            ->filter(fn ($seconds, $key) => in_array(Str::afterLast($key, ':'), self::TRACKED_QUEUES, true));

        return $tracked->isEmpty() ? null : (int) $tracked->max();
    }

    /**
     * @param  array<string, int>  $counts
     * @return array<int, array{queue: string, count: int}>
     */
    private function normalizeQueueCounts(array $counts): array
    {
        $merged = array_fill_keys(self::TRACKED_QUEUES, 0);
        foreach ($counts as $queue => $count) {
            $merged[$queue] = ($merged[$queue] ?? 0) + (int) $count;
        }

        return collect($merged)
            ->map(fn ($count, $queue) => ['queue' => $queue, 'count' => (int) $count])
            ->values()
            ->all();
    }

    private function extractJobClass(string $payload): ?string
    {
        $decoded = json_decode($payload, true);
        if (! is_array($decoded)) {
            return null;
        }

        return $decoded['displayName']
            ?? ($decoded['data']['commandName'] ?? null);
    }

    private function extractAttempts(string $payload): ?int
    {
        $decoded = json_decode($payload, true);
        if (! is_array($decoded) || ! isset($decoded['attempts'])) {
            return null;
        }

        return (int) $decoded['attempts'];
    }

    /**
     * Re-encode the queue payload for display. The serialized command is a
     * PHP string inside the JSON, so it stays as-is; everything else is
     * readable once indented.
     */
    private function prettyPayload(string $payload): string
    {
        $decoded = json_decode($payload, true);
        if (! is_array($decoded)) {
            return $payload;
        }

        $encoded = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return $encoded === false ? $payload : $encoded;
    }

    private function extractExceptionMessage(string $exception): string
    {
        $firstLine = strtok($exception, "\n");

        return $firstLine === false ? $exception : $firstLine;
    }
}
