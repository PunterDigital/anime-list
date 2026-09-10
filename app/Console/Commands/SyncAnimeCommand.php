<?php

namespace App\Console\Commands;

use App\Jobs\SyncAnimePage;
use App\Models\SyncRun;
use App\Services\AniListPageDepth;
use App\Services\SyncRunTracker;
use Illuminate\Console\Command;

class SyncAnimeCommand extends Command
{
    protected $signature = 'sync:anime
                            {--full : Run full catalog sync from page 1}
                            {--resume : Resume full sync from last saved page}
                            {--page= : Start from specific page (implies full)}
                            {--status= : Sync only anime with this AniList status (RELEASING, NOT_YET_RELEASED, etc.)}
                            {--season= : Sync only this season (WINTER, SPRING, SUMMER, FALL)}
                            {--season-year= : Sync only this year (e.g. 2026)}
                            {--finished : Run incremental sync limited to FINISHED anime (defaults to a 31-day cutoff)}
                            {--watch : Watch progress after dispatching}';

    protected $description = 'Sync anime data from AniList API';

    public function __construct(private readonly SyncRunTracker $tracker)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if ($this->option('status')) {
            $run = $this->runTargetedSync();
        } elseif ($this->option('full') || $this->option('page') || $this->option('resume')) {
            $run = $this->runFullSync();
        } elseif ($this->option('finished')) {
            $run = $this->runFinishedIncrementalSync();
        } else {
            $run = $this->runIncrementalSync();
        }

        if ($run === null) {
            return self::FAILURE;
        }

        if ($this->option('watch')) {
            $this->watchProgress($run);
        } else {
            $this->info('Tip: use --watch to follow progress, or monitor with: php artisan horizon');
        }

        return self::SUCCESS;
    }

    private function runFullSync(): ?SyncRun
    {
        $startPage = 1;

        if ($this->option('page')) {
            $startPage = (int) $this->option('page');
            if ($startPage < 1) {
                $this->error('Page number must be a positive integer.');

                return null;
            }
        } elseif ($this->option('resume')) {
            $previous = SyncRun::query()
                ->where('mode', SyncRun::MODE_FULL)
                ->orderByDesc('id')
                ->first();

            if ($previous && $previous->current_page > 0) {
                $startPage = $previous->current_page + 1;
                $this->info("Resuming from page {$startPage} (last completed: {$previous->current_page} of {$previous->last_page})");
            } else {
                $this->warn('No previous sync progress found. Starting from page 1.');
            }
        }

        $perPage = config('anilist.sync.per_page', 50);

        // AniList serves only the first 5,000 entries of a result set. A full
        // sweep past that point runs in id-ordered windows, and a page number
        // alone cannot say which window it belongs to — so a deep start page
        // has no meaning to resume from.
        if (! AniListPageDepth::allows($startPage, $perPage)) {
            $this->error(sprintf(
                'Page %d is past the AniList page depth limit (%d entries, %d pages at %d per page). Start a fresh full sync from page 1.',
                $startPage,
                AniListPageDepth::limit(),
                AniListPageDepth::maxPage($perPage),
                $perPage,
            ));

            return null;
        }

        $run = $this->tracker->start(SyncRun::MODE_FULL);
        $run->forceFill(['current_page' => $startPage - 1])->save();

        SyncAnimePage::dispatch(
            page: $startPage,
            perPage: $perPage,
            mode: SyncRun::MODE_FULL,
            syncRunId: $run->id,
        )->onQueue('sync');

        $this->info("Full sync dispatched starting from page {$startPage}.");

        return $run;
    }

    private function runTargetedSync(): ?SyncRun
    {
        $status = strtoupper($this->option('status'));
        $validStatuses = ['FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'];

        if (! in_array($status, $validStatuses)) {
            $this->error("Invalid status: {$status}. Valid: ".implode(', ', $validStatuses));

            return null;
        }

        $season = $this->option('season') ? strtoupper($this->option('season')) : null;
        $seasonYear = $this->option('season-year') ? (int) $this->option('season-year') : null;

        // Each status/season combination is tracked as its own run — the
        // RELEASING and NOT_YET_RELEASED sweeps overlap on the schedule and
        // used to overwrite each other's progress and status.
        $label = trim(implode(' ', array_filter([$status, $season, $seasonYear])));

        $this->info("Running targeted sync: {$label}");

        $run = $this->tracker->start(SyncRun::MODE_TARGETED, $label);

        SyncAnimePage::dispatch(
            page: 1,
            perPage: config('anilist.sync.per_page', 50),
            mode: SyncRun::MODE_TARGETED,
            updatedAtGreater: null,
            anilistStatus: $status,
            anilistSeason: $season,
            anilistSeasonYear: $seasonYear,
            syncRunId: $run->id,
        )->onQueue('sync');

        $this->info('Targeted sync dispatched.');

        return $run;
    }

    private function runIncrementalSync(): SyncRun
    {
        $cutoff = $this->tracker->nextCutoffFor(SyncRun::MODE_INCREMENTAL, fallbackSeconds: 86400);

        $this->info('Running incremental sync for anime updated since '.date('Y-m-d H:i:s', $cutoff));

        $run = $this->tracker->start(SyncRun::MODE_INCREMENTAL, cutoffAt: $cutoff);

        SyncAnimePage::dispatch(
            page: 1,
            perPage: config('anilist.sync.per_page', 50),
            mode: SyncRun::MODE_INCREMENTAL,
            updatedAtGreater: $cutoff,
            syncRunId: $run->id,
        )->onQueue('sync');

        $this->info('Incremental sync dispatched.');

        return $run;
    }

    private function runFinishedIncrementalSync(): SyncRun
    {
        $cutoff = $this->tracker->nextCutoffFor(SyncRun::MODE_FINISHED_INCREMENTAL, fallbackSeconds: 31 * 86400);

        $this->info('Running FINISHED-only incremental sync for anime updated since '.date('Y-m-d H:i:s', $cutoff));

        $run = $this->tracker->start(SyncRun::MODE_FINISHED_INCREMENTAL, cutoffAt: $cutoff);

        SyncAnimePage::dispatch(
            page: 1,
            perPage: config('anilist.sync.per_page', 50),
            mode: SyncRun::MODE_FINISHED_INCREMENTAL,
            updatedAtGreater: $cutoff,
            syncRunId: $run->id,
        )->onQueue('sync');

        $this->info('Finished-anime incremental sync dispatched.');

        return $run;
    }

    private function watchProgress(SyncRun $run): void
    {
        $this->newLine();
        $this->info('Watching sync progress... (Ctrl+C to stop)');
        $this->newLine();

        $lastPage = 0;
        $staleCount = 0;

        while (true) {
            $run->refresh();

            $currentPage = $run->current_page;
            $totalPages = $run->last_page;
            $totalItems = $run->total_items;

            if ($currentPage !== $lastPage) {
                $staleCount = 0;
                $lastPage = $currentPage;

                if ($totalPages > 0) {
                    $percent = min(100, (int) round(($currentPage / $totalPages) * 100));
                    $bar = str_repeat('=', (int) ($percent / 2)).'>'.str_repeat(' ', 50 - (int) ($percent / 2));
                    $this->output->write("\r  [{$bar}] {$percent}% — Page {$currentPage}/{$totalPages} ({$totalItems} anime)");
                } else {
                    $this->output->write("\r  Page {$currentPage}/? ({$totalItems} anime) — discovering total...");
                }
            } else {
                $staleCount++;
            }

            if ($run->status === SyncRun::STATUS_COMPLETED) {
                $this->newLine(2);
                $this->info("Sync complete! {$totalItems} anime across {$currentPage} pages.");

                break;
            }

            if ($run->status === SyncRun::STATUS_FAILED) {
                $this->newLine(2);
                $this->error("Sync failed on page {$currentPage}: {$run->last_error}");

                break;
            }

            if ($run->status === SyncRun::STATUS_SUPERSEDED) {
                $this->newLine(2);
                $this->warn('This run was superseded by a newer sync of the same mode.');

                break;
            }

            if ($staleCount > 60) {
                $this->newLine(2);
                $this->warn($run->status === SyncRun::STATUS_PAUSED
                    ? 'Sync is paused waiting on AniList to come back.'
                    : 'No progress update for 2 minutes. Sync may have stalled — is Horizon running?');

                break;
            }

            sleep(2);
        }
    }
}
