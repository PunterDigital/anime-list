<?php

namespace App\Jobs;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Services\MalImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProcessMalImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $timeout = 600;

    public function __construct(
        public readonly int $userId,
        public readonly string $importToken,
        public readonly bool $overwrite,
    ) {}

    public function handle(): void
    {
        $entries = Cache::get("mal_import:{$this->userId}:{$this->importToken}");

        if ($entries === null) {
            $this->updateProgress('failed', 0, 0);

            return;
        }

        $user = User::find($this->userId);

        if (! $user) {
            $this->updateProgress('failed', 0, count($entries));

            return;
        }

        $total = count($entries);
        $imported = 0;
        $skipped = 0;
        $errors = 0;

        $malIds = array_filter(array_column($entries, 'mal_id'));
        $animeMap = Anime::whereIn('mal_id', $malIds)->pluck('id', 'mal_id');

        $missingMalIds = array_values(array_diff($malIds, $animeMap->keys()->all()));
        if (! empty($missingMalIds)) {
            $this->updateProgress('fetching', 0, $total);
            $importService = app(MalImportService::class);
            $animeMap = $importService->fetchAndPersistMissing($missingMalIds, $animeMap);
        }

        $existing = $user->animeList()
            ->whereIn('anime_id', $animeMap->values())
            ->pluck('anime_id')
            ->flip()
            ->toArray();

        $entriesWithMalId = count(array_filter(array_column($entries, 'mal_id')));
        Log::info('MAL import: processing entries', [
            'total_entries' => $total,
            'entries_with_mal_id' => $entriesWithMalId,
            'entries_without_mal_id' => $total - $entriesWithMalId,
            'anime_map_size' => $animeMap->count(),
        ]);

        $notFound = [];
        $chunks = array_chunk($entries, 50);
        $processed = 0;

        foreach ($chunks as $chunk) {
            foreach ($chunk as $entry) {
                $processed++;

                if (! $entry['mal_id'] || ! $animeMap->has($entry['mal_id'])) {
                    $errors++;
                    if ($entry['mal_id']) {
                        $notFound[] = ['mal_id' => $entry['mal_id'], 'title' => $entry['title']];
                    }

                    continue;
                }

                $animeId = $animeMap->get($entry['mal_id']);

                if (isset($existing[$animeId]) && ! $this->overwrite) {
                    $skipped++;

                    continue;
                }

                try {
                    $listEntry = UserAnimeList::withTrashed()
                        ->updateOrCreate(
                            ['user_id' => $user->id, 'anime_id' => $animeId],
                            [
                                'status' => $entry['status'],
                                'score' => $entry['score'] > 0 ? $entry['score'] : 0,
                                'progress' => $entry['progress'],
                                'started_at' => $entry['started_at'],
                                'completed_at' => $entry['completed_at'],
                            ],
                        );

                    if ($listEntry->trashed()) {
                        $listEntry->restore();
                    }

                    $imported++;
                } catch (\Illuminate\Database\QueryException $e) {
                    Log::warning('MAL import: DB error for entry', [
                        'mal_id' => $entry['mal_id'],
                        'title' => $entry['title'],
                        'error' => $e->getMessage(),
                    ]);
                    $errors++;
                }
            }

            $this->updateProgress('processing', $processed, $total);
        }

        if (! empty($notFound)) {
            Log::info('MAL import: unmatched anime', [
                'user_id' => $this->userId,
                'count' => count($notFound),
                'entries' => $notFound,
            ]);
        }

        Cache::forget("mal_import:{$this->userId}:{$this->importToken}");

        Cache::put("import:progress:{$this->importToken}", [
            'status' => 'done',
            'processed' => $total,
            'total' => $total,
            'result' => [
                'imported' => $imported,
                'skipped' => $skipped,
                'errors' => $errors,
                'total' => $total,
                'not_found' => $notFound,
            ],
        ], 3600);
    }

    public function failed(\Throwable $e): void
    {
        Cache::put("import:progress:{$this->importToken}", [
            'status' => 'failed',
            'processed' => 0,
            'total' => 0,
        ], 3600);

        Log::error('ProcessMalImport failed', [
            'user_id' => $this->userId,
            'import_token' => $this->importToken,
            'exception' => $e->getMessage(),
        ]);
    }

    private function updateProgress(string $status, int $processed, int $total): void
    {
        Cache::put("import:progress:{$this->importToken}", [
            'status' => $status,
            'processed' => $processed,
            'total' => $total,
        ], 3600);
    }
}
