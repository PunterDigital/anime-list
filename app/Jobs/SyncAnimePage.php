<?php

namespace App\Jobs;

use App\Exceptions\AniListServiceUnavailableException;
use App\Models\SyncRun;
use App\Services\AniListClient;
use App\Services\AniListPageDepth;
use App\Services\AniListQueryBuilder;
use App\Services\AnimeDataPersistenceService;
use App\Services\SyncRunTracker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncAnimePage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    /**
     * Attempts are bounded by retryUntil() rather than a fixed count: the job
     * releases itself back onto the queue while AniList is unavailable, and
     * every one of those releases would otherwise burn an attempt and kill the
     * whole page chain with MaxAttemptsExceededException.
     */
    public int $tries = 0;

    /**
     * Genuine errors (as opposed to outage releases) still fail fast.
     */
    public int $maxExceptions = 3;

    /**
     * Declared with a default rather than promoted in the constructor: a
     * promoted property has no class-level default, so a job payload
     * serialized before this property existed unserializes with it
     * uninitialized and every read throws. Payloads queued across a deploy
     * have to land on null instead.
     */
    public ?int $syncRunId = null;

    /**
     * Lower id bound for the current window of a full sweep. AniList only
     * serves the first 5,000 entries of a result set, so the full sweep walks
     * the catalogue in id-ordered windows: on reaching the depth limit it
     * starts a fresh page 1 beyond the last id it saw. Declared rather than
     * promoted for the same reason as $syncRunId above.
     */
    public ?int $idGreater = null;

    /**
     * Pages already covered by earlier windows of this sweep. Only used to
     * report absolute progress, since $page restarts at 1 per window.
     */
    public int $pageOffset = 0;

    public function __construct(
        public readonly int $page,
        public readonly int $perPage = 50,
        public readonly string $mode = 'full',
        public readonly ?int $updatedAtGreater = null,
        public readonly ?string $anilistStatus = null,
        public readonly ?string $anilistSeason = null,
        public readonly ?int $anilistSeasonYear = null,
        ?int $syncRunId = null,
        ?int $idGreater = null,
        int $pageOffset = 0,
    ) {
        $this->syncRunId = $syncRunId;
        $this->idGreater = $idGreater;
        $this->pageOffset = $pageOffset;
    }

    /**
     * Long enough to sit out several AniList circuit-breaker windows
     * (900s each by default) before giving up on the page.
     */
    public function retryUntil(): \DateTimeInterface
    {
        return now()->addHours(6);
    }

    public function handle(
        AniListClient $client,
        AnimeDataPersistenceService $persistenceService,
        SyncRunTracker $tracker,
    ): void {
        $run = $this->resolveRun($tracker);

        // A page past the depth limit is a 400 from AniList, not an empty
        // page. Nothing should dispatch one, but a payload queued before this
        // guard existed can still be retried from the failed table.
        if (! AniListPageDepth::allows($this->page, $this->perPage)) {
            Log::warning('SyncAnimePage skipped: page beyond AniList depth limit', [
                'page' => $this->page,
                'per_page' => $this->perPage,
                'mode' => $this->mode,
            ]);

            $this->finalize($tracker, $run, $this->depthNotice());

            return;
        }

        $query = match ($this->mode) {
            'incremental' => AniListQueryBuilder::updatedSince(false),
            'finished_incremental' => AniListQueryBuilder::updatedSince(true),
            'targeted' => AniListQueryBuilder::animeByStatus(),
            default => AniListQueryBuilder::animePage(),
        };

        $variables = [
            'page' => $this->page,
            'perPage' => $this->perPage,
        ];

        if ($this->mode === 'full' && $this->idGreater !== null) {
            $variables['idGreater'] = $this->idGreater;
        }

        // Note: incremental mode sorts by UPDATED_AT_DESC and stops when items
        // are older than the cutoff (handled after persistence below)

        if ($this->mode === 'targeted') {
            if ($this->anilistStatus) {
                $variables['status'] = $this->anilistStatus;
            }
            if ($this->anilistSeason) {
                $variables['season'] = $this->anilistSeason;
            }
            if ($this->anilistSeasonYear) {
                $variables['seasonYear'] = $this->anilistSeasonYear;
            }
        }

        try {
            $data = $client->query($query, $variables);
        } catch (AniListServiceUnavailableException $e) {
            $this->pauseForOutage($tracker, $run, $e);

            return;
        }

        // Store raw response
        $client->storeRawResponse(
            'Page.media',
            "page:{$this->page}:mode:{$this->mode}",
            $data,
        );

        $pageData = $data['Page'] ?? null;
        if ($pageData === null) {
            throw new \RuntimeException("AniList response missing 'Page' key on page {$this->page}");
        }

        $mediaItems = $pageData['media'] ?? [];
        $pageInfo = $pageData['pageInfo'] ?? [];

        if (empty($mediaItems) && $this->page === 1) {
            Log::error('First page of sync returned 0 items — possible API issue', [
                'mode' => $this->mode,
                'response_keys' => array_keys($data),
            ]);
        }

        Log::info('SyncAnimePage fetched', [
            'page' => $this->page,
            'mode' => $this->mode,
            'items' => count($mediaItems),
            'last_page' => $pageInfo['lastPage'] ?? '?',
        ]);

        // Bulk-persist all media items in a single transaction
        if (! empty($mediaItems)) {
            $persistenceService->persistBatch($mediaItems);
        }

        $absolutePage = $this->pageOffset + $this->page;

        $tracker->advance(
            run: $run,
            page: $absolutePage,
            lastPage: $this->pageOffset + (int) ($pageInfo['lastPage'] ?? 0),
            totalItems: (int) ($pageInfo['total'] ?? 0),
            processedDelta: count($mediaItems),
        );

        // In incremental mode, stop when all items on page are older than cutoff
        $shouldContinue = $pageInfo['hasNextPage'] ?? false;

        if ($shouldContinue && in_array($this->mode, ['incremental', 'finished_incremental'], true) && $this->updatedAtGreater !== null && ! empty($mediaItems)) {
            $allOlderThanCutoff = collect($mediaItems)->every(
                fn ($item) => ($item['updatedAt'] ?? 0) <= $this->updatedAtGreater
            );

            if ($allOlderThanCutoff) {
                $shouldContinue = false;
                Log::info('Incremental sync stopping — all items on page older than cutoff', [
                    'page' => $this->page,
                    'cutoff' => date('Y-m-d H:i:s', $this->updatedAtGreater),
                ]);
            }
        }

        if (! $shouldContinue) {
            $this->finalize($tracker, $run);

            return;
        }

        // Next page inside the current window is still reachable.
        if (AniListPageDepth::allows($this->page + 1, $this->perPage)) {
            $this->dispatchNext(
                page: $this->page + 1,
                runId: $run->id,
                idGreater: $this->idGreater,
                pageOffset: $this->pageOffset,
            );

            return;
        }

        // The window is exhausted. An id-ordered sweep can open the next one
        // beyond the last id it saw; the recency- and popularity-ordered
        // sweeps have no such cursor, so they stop here rather than asking
        // AniList for a page it refuses to serve.
        $nextWindowStart = $this->mode === 'full' ? $this->highestId($mediaItems) : null;

        if ($nextWindowStart !== null) {
            Log::info('Sync full sweep re-windowing at page depth limit', [
                'pages_covered' => $absolutePage,
                'id_greater' => $nextWindowStart,
            ]);

            $this->dispatchNext(
                page: 1,
                runId: $run->id,
                idGreater: $nextWindowStart,
                pageOffset: $absolutePage,
            );

            return;
        }

        Log::warning('Sync stopped at AniList page depth limit', [
            'mode' => $this->mode,
            'pages_covered' => $absolutePage,
            'processed' => $run->processed_items,
            'total' => (int) ($pageInfo['total'] ?? 0),
        ]);

        $this->finalize($tracker, $run, $this->depthNotice());
    }

    /**
     * Queue the next page of this sweep.
     */
    private function dispatchNext(int $page, int $runId, ?int $idGreater, int $pageOffset): void
    {
        self::dispatch(
            page: $page,
            perPage: $this->perPage,
            mode: $this->mode,
            updatedAtGreater: $this->updatedAtGreater,
            anilistStatus: $this->anilistStatus,
            anilistSeason: $this->anilistSeason,
            anilistSeasonYear: $this->anilistSeasonYear,
            syncRunId: $runId,
            idGreater: $idGreater,
            pageOffset: $pageOffset,
        )->onQueue('sync');
    }

    /**
     * Close the run and queue the deferred relation work.
     */
    private function finalize(SyncRunTracker $tracker, SyncRun $run, ?string $notice = null): void
    {
        $tracker->complete($run, $notice);

        // Resolve deferred relations after sync completes
        $delay = $this->mode === 'full' ? now()->addMinutes(5) : now()->addSeconds(10);
        ResolveAnimeRelations::dispatch()
            ->onQueue('import')
            ->delay($delay);
        ResolveAnimeRecommendations::dispatch()
            ->onQueue('import')
            ->delay($delay);

        Log::info("Sync {$this->mode} page sweep complete", [
            'total_pages' => $this->pageOffset + $this->page,
            'notice' => $notice,
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $mediaItems
     */
    private function highestId(array $mediaItems): ?int
    {
        $ids = array_filter(array_map(
            static fn ($item) => isset($item['id']) ? (int) $item['id'] : null,
            $mediaItems,
        ));

        return $ids === [] ? null : max($ids);
    }

    private function depthNotice(): string
    {
        return sprintf(
            'Stopped at the AniList page depth limit (%d entries): the remaining, least recently updated entries are left to the stale-refresh sweep.',
            AniListPageDepth::limit(),
        );
    }

    /**
     * Reattach to the run this chain belongs to. A job dispatched without one
     * (an old payload retried from the failed table, say) opens its own so the
     * sweep is still visible on the admin panel.
     */
    private function resolveRun(SyncRunTracker $tracker): SyncRun
    {
        return $tracker->find($this->syncRunId)
            ?? $tracker->start($this->mode, $this->runLabel(), $this->updatedAtGreater);
    }

    private function runLabel(): ?string
    {
        if ($this->mode !== 'targeted') {
            return null;
        }

        return trim(implode(' ', array_filter([
            $this->anilistStatus,
            $this->anilistSeason,
            $this->anilistSeasonYear,
        ]))) ?: null;
    }

    private function pauseForOutage(SyncRunTracker $tracker, SyncRun $run, AniListServiceUnavailableException $e): void
    {
        $tracker->pause($run, $e->getMessage());

        Log::warning('SyncAnimePage paused: AniList unavailable', [
            'page' => $this->page,
            'mode' => $this->mode,
            'retry_after_s' => $e->retryAfter,
        ]);

        $this->release($e->retryAfter);
    }

    public function failed(\Throwable $e): void
    {
        $tracker = app(SyncRunTracker::class);
        $run = $tracker->find($this->syncRunId);

        if ($run !== null) {
            $tracker->fail($run, $e);
        }

        Log::error('SyncAnimePage failed', [
            'page' => $this->page,
            'mode' => $this->mode,
            'exception' => $e,
        ]);
    }
}
