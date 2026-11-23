<?php

namespace App\Jobs;

use App\Exceptions\AniListRateLimitException;
use App\Exceptions\AniListServiceUnavailableException;
use App\Models\Anime;
use App\Services\AniListClient;
use App\Services\AniListQueryBuilder;
use App\Services\AnimeDataPersistenceService;
use App\Support\SearchCache;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Looks a search that found nothing locally up on AniList and stores what it
 * finds (card 5707). It used to run inside the search request, where a typo
 * held a PHP-FPM worker for an AniList round trip, and during a sync sweep or
 * a 429 for minutes of rate-limit sleeps.
 *
 * Uses the fail-fast client so a queue worker never sleeps either: an empty
 * rate-limit bucket or a 429 releases the job for a later try.
 */
class SearchAniListForQuery implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public readonly string $query) {}

    public function handle(AniListClient $client, AnimeDataPersistenceService $persistence): void
    {
        try {
            $data = $client->interactive()->query(AniListQueryBuilder::searchAnime(), [
                'search' => $this->query,
                'page' => 1,
                'perPage' => 20,
            ]);
        } catch (AniListRateLimitException|AniListServiceUnavailableException $e) {
            if ($this->attempts() < $this->tries) {
                $this->release(min(300, max(15, $e->retryAfter)));

                return;
            }
            SearchCache::finishLookup($this->query);

            return;
        } catch (\Throwable $e) {
            Log::warning('AniList search lookup failed', ['query' => $this->query, 'error' => $e->getMessage()]);
            SearchCache::finishLookup($this->query);

            return;
        }

        $media = $data['Page']['media'] ?? [];

        if ($media !== []) {
            $models = $persistence->persistBatch($media);

            ResolveAnimeRelations::dispatch()->onQueue('import');

            // Let the next search for this text see the new titles, but only
            // when one of them is listable: otherwise the cached empty
            // result stays and the next search makes no AniList call.
            $listable = Anime::whereIn('id', $models->pluck('id'))->safeForWork()->visible()->exists();
            if ($listable) {
                SearchCache::forgetResult($this->query);
            }
        }

        SearchCache::finishLookup($this->query);
    }
}
