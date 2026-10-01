<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnimeCardResource;
use App\Jobs\ResolveAnimeRelations;
use App\Models\Anime;
use App\Services\AniListClient;
use App\Services\AniListQueryBuilder;
use App\Services\AnimeDataPersistenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    public function __invoke(Request $request, AniListClient $client, AnimeDataPersistenceService $persistenceService): JsonResponse
    {
        $query = trim($request->string('q'));

        if (mb_strlen($query) < 2 || mb_strlen($query) > 200) {
            return response()->json(['data' => [], 'query' => $query, 'total' => 0]);
        }

        $cacheKey = 'search:'.md5(mb_strtolower($query));

        try {
            $result = Cache::get($cacheKey);

            if (! $result) {
                // Try local Scout search first
                $items = Anime::search($query)
                    ->query(fn ($q) => $q->where('is_adult', false)->visible()->with('genres'))
                    ->take(20)
                    ->get();

                if ($items->isNotEmpty()) {
                    $result = [
                        'data' => AnimeCardResource::collection($items)->resolve(),
                        'total' => $items->count(),
                        'source' => 'local',
                    ];
                } else {
                    // Fall back to AniList API search, persist results to DB
                    $result = $this->searchAniList($client, $persistenceService, $query);
                }

                // Only cache non-empty results
                if (! empty($result['data'])) {
                    Cache::put($cacheKey, $result, 900);
                }
            }
        } catch (\Exception $e) {
            Log::error('Search failed', ['query' => $query, 'exception' => $e]);

            return response()->json([
                'data' => [],
                'query' => $query,
                'total' => 0,
                'error' => 'Search is temporarily unavailable.',
            ], 503);
        }

        return response()->json([
            'data' => $result['data'],
            'query' => $query,
            'total' => $result['total'],
            'source' => $result['source'] ?? 'local',
        ]);
    }

    private function searchAniList(AniListClient $client, AnimeDataPersistenceService $persistenceService, string $query): array
    {
        try {
            $data = $client->query(AniListQueryBuilder::searchAnime(), [
                'search' => $query,
                'page' => 1,
                'perPage' => 20,
            ]);

            $mediaItems = $data['Page']['media'] ?? [];

            if (empty($mediaItems)) {
                return ['data' => [], 'total' => 0, 'source' => 'anilist'];
            }

            // Persist all results to DB using the full media data
            $animeModels = $persistenceService->persistBatch($mediaItems);

            // Resolve relations in background so search stays fast
            ResolveAnimeRelations::dispatch();

            // Reload with genres for the card resource
            $ids = $animeModels->pluck('id');
            $persisted = Anime::whereIn('id', $ids)
                ->with('genres')
                ->orderByRaw('FIELD(id, '.implode(',', $ids->all()).')')
                ->get();

            return [
                'data' => AnimeCardResource::collection($persisted)->resolve(),
                'total' => $persisted->count(),
                'source' => 'anilist',
            ];
        } catch (\Throwable $e) {
            Log::warning('AniList search fallback failed', [
                'query' => $query,
                'error' => $e->getMessage(),
            ]);

            return ['data' => [], 'total' => 0, 'source' => 'anilist'];
        }
    }
}
