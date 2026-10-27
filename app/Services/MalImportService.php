<?php

namespace App\Services;

use App\Models\Anime;
use App\Models\User;
use App\Models\UserAnimeList;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleXMLElement;

class MalImportService
{
    private static function cacheKey(int $userId, string $token): string
    {
        return "mal_import:{$userId}:{$token}";
    }

    /**
     * Parse a MAL date string, returning null for invalid/partial dates.
     * MAL uses "0000-00-00" for unset and partial dates like "2023-00-00".
     */
    private static function parseMalDate(string $date): ?string
    {
        if (empty($date) || str_contains($date, '00-00') || str_contains($date, '-00')) {
            return null;
        }

        return $date;
    }

    private const STATUS_MAP = [
        'Watching' => UserAnimeList::STATUS_WATCHING,
        'Completed' => UserAnimeList::STATUS_COMPLETED,
        'On-Hold' => UserAnimeList::STATUS_ON_HOLD,
        'Dropped' => UserAnimeList::STATUS_DROPPED,
        'Plan to Watch' => UserAnimeList::STATUS_PLAN_TO_WATCH,
    ];

    public function parse(string $xmlPath, int $userId): array
    {
        $content = file_get_contents($xmlPath);

        if ($content === false || trim($content) === '') {
            throw new \InvalidArgumentException('The uploaded file could not be read or is empty.');
        }

        // Decompress gzip if needed (MAL exports as .xml.gz)
        if (str_starts_with($content, "\x1f\x8b")) {
            $content = gzdecode($content);
            if ($content === false) {
                throw new \InvalidArgumentException('The uploaded gzip file could not be decompressed.');
            }
        }

        $content = preg_replace('/<!DOCTYPE[^>]*>/i', '', $content);
        $previousValue = libxml_use_internal_errors(true);

        try {
            $xml = new SimpleXMLElement($content, LIBXML_NOWARNING);
        } catch (\Exception $e) {
            libxml_clear_errors();
            libxml_use_internal_errors($previousValue);
            throw new \InvalidArgumentException(
                'The uploaded file is not valid MAL XML. Please export your list from MyAnimeList and try again.'
            );
        }

        libxml_use_internal_errors($previousValue);

        $entries = [];
        foreach ($xml->anime as $anime) {
            $malStatus = html_entity_decode((string) $anime->my_status);
            $status = self::STATUS_MAP[$malStatus] ?? UserAnimeList::STATUS_PLAN_TO_WATCH;

            $malScore = (int) $anime->my_score;
            $score = $malScore > 0 ? min($malScore, 10) : 0;

            $startDate = self::parseMalDate((string) $anime->my_start_date);
            $finishDate = self::parseMalDate((string) $anime->my_finish_date);

            $entries[] = [
                'mal_id' => (int) $anime->series_animedb_id ?: null,
                'title' => html_entity_decode((string) $anime->series_title),
                'status' => $status,
                'score' => $score,
                'progress' => (int) $anime->my_watched_episodes,
                'started_at' => $startDate,
                'completed_at' => $finishDate,
            ];
        }

        $token = Str::uuid()->toString();
        Cache::put(self::cacheKey($userId, $token), $entries, 1800);

        return [
            'token' => $token,
            'entries' => array_slice($entries, 0, 20),
            'total' => count($entries),
        ];
    }

    public function getPreview(int $userId, string $token): ?array
    {
        return Cache::get(self::cacheKey($userId, $token));
    }

    public function processEntries(User $user, string $token, bool $overwrite): array
    {
        $entries = $this->getPreview($user->id, $token);

        if ($entries === null) {
            throw new \RuntimeException('Import session expired. Please upload the file again.');
        }

        $malIds = array_filter(array_column($entries, 'mal_id'));
        $animeMap = Anime::whereIn('mal_id', $malIds)->pluck('id', 'mal_id');

        $missingMalIds = array_values(array_diff($malIds, $animeMap->keys()->all()));
        if (! empty($missingMalIds)) {
            $animeMap = $this->fetchAndPersistMissing($missingMalIds, $animeMap);
        }

        $existing = $user->animeList()
            ->whereIn('anime_id', $animeMap->values())
            ->pluck('anime_id')
            ->flip()
            ->toArray();

        $imported = 0;
        $skipped = 0;
        $errors = 0;
        $notFound = [];

        foreach ($entries as $entry) {
            if (! $entry['mal_id'] || ! $animeMap->has($entry['mal_id'])) {
                $errors++;
                if ($entry['mal_id']) {
                    $notFound[] = ['mal_id' => $entry['mal_id'], 'title' => $entry['title']];
                }

                continue;
            }

            $animeId = $animeMap->get($entry['mal_id']);

            if (isset($existing[$animeId]) && ! $overwrite) {
                $skipped++;

                continue;
            }

            $data = [
                'user_id' => $user->id,
                'anime_id' => $animeId,
                'status' => $entry['status'],
                'score' => $entry['score'] > 0 ? $entry['score'] : 0,
                'progress' => $entry['progress'],
                'started_at' => $entry['started_at'],
                'completed_at' => $entry['completed_at'],
            ];

            try {
                $listEntry = UserAnimeList::withTrashed()
                    ->updateOrCreate(
                        ['user_id' => $user->id, 'anime_id' => $animeId],
                        $data,
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

        if (! empty($notFound)) {
            Log::info('MAL import: unmatched anime', [
                'user_id' => $user->id,
                'count' => count($notFound),
                'entries' => $notFound,
            ]);
        }

        Cache::forget(self::cacheKey($user->id, $token));

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
            'total' => count($entries),
            'not_found' => $notFound,
        ];
    }

    /**
     * Fetch missing anime from AniList by MAL IDs and persist them.
     *
     * @return \Illuminate\Support\Collection<int, int> Updated mal_id => anime.id map
     */
    public function fetchAndPersistMissing(array $missingMalIds, \Illuminate\Support\Collection $animeMap): \Illuminate\Support\Collection
    {
        $client = app(AniListClient::class);
        $persistence = app(AnimeDataPersistenceService::class);

        $uniqueMalIds = array_values(array_unique($missingMalIds));
        $totalFetched = 0;

        Log::info('MAL import: fetching missing anime from AniList', [
            'missing_count' => count($uniqueMalIds),
        ]);

        foreach (array_chunk($uniqueMalIds, 50) as $chunkIndex => $chunk) {
            try {
                foreach ($client->paginatedQuery(
                    AniListQueryBuilder::animeByMalIds(),
                    ['malIds' => $chunk],
                    perPage: 50,
                ) as $pageData) {
                    $mediaItems = $pageData['media'] ?? [];
                    if (! empty($mediaItems)) {
                        $totalFetched += count($mediaItems);
                        $persistence->persistBatch($mediaItems);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to fetch missing anime from AniList during import', [
                    'chunk_index' => $chunkIndex,
                    'chunk_size' => count($chunk),
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Generate slugs for newly fetched anime (upsert bypasses Eloquent events)
        Anime::whereIn('mal_id', $uniqueMalIds)->whereNull('slug')->each(function (Anime $anime) {
            $anime->slug = Anime::generateUniqueSlug($anime);
            $anime->saveQuietly();
        });

        $newlyFound = Anime::whereIn('mal_id', $uniqueMalIds)->pluck('id', 'mal_id');

        Log::info('MAL import: AniList fetch complete', [
            'requested' => count($uniqueMalIds),
            'fetched_from_api' => $totalFetched,
            'matched_in_db' => $newlyFound->count(),
            'still_missing' => count($uniqueMalIds) - $newlyFound->count(),
        ]);

        return $newlyFound->union($animeMap);
    }
}
