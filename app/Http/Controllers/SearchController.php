<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnimeCardResource;
use App\Jobs\SearchAniListForQuery;
use App\Models\Anime;
use App\Support\SearchCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $query = trim($request->string('q'));

        if (mb_strlen($query) < 2 || mb_strlen($query) > 200) {
            return response()->json(['data' => [], 'query' => $query, 'total' => 0]);
        }

        $cacheKey = SearchCache::resultKey($query);

        try {
            $result = Cache::get($cacheKey);

            if (! is_array($result)) {
                $items = Anime::query()
                    ->safeForWork()->visible()
                    ->searchTitle($query)
                    ->orderByDesc('popularity')
                    ->with('genres')
                    ->limit(20)
                    ->get();

                if ($items->isNotEmpty()) {
                    $result = [
                        'data' => AnimeCardResource::collection($items)->resolve(),
                        'total' => $items->count(),
                        'source' => 'local',
                    ];
                    Cache::put($cacheKey, $result, SearchCache::HIT_TTL);
                } else {
                    // Card 5707: no AniList call inside the request. A queued
                    // job looks the text up and stores what it finds; the miss
                    // is cached so pauses in typing don't repeat the search.
                    $result = ['data' => [], 'total' => 0, 'source' => 'local'];
                    Cache::put($cacheKey, $result, SearchCache::MISS_TTL);

                    if (SearchCache::startLookup($query)) {
                        SearchAniListForQuery::dispatch($query)->onQueue('import');
                    }
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

        // Card 4198: results are cached for 15 minutes, so drop titles an
        // admin hid or marked NSFW since then (one id lookup).
        $ids = array_column($result['data'], 'id');
        if ($ids !== []) {
            $removed = Anime::query()->whereIn('id', $ids)
                ->where(fn ($q) => $q->where('is_adult', true)->orWhereNotNull('nsfw_at')->orWhereNotNull('hidden_at'))
                ->pluck('id')->all();
            if ($removed !== []) {
                $result['data'] = array_values(array_filter($result['data'], fn (array $item) => ! in_array($item['id'] ?? null, $removed, true)));
                $result['total'] = count($result['data']);
            }
        }

        return response()->json([
            'data' => $result['data'],
            'query' => $query,
            'total' => $result['total'],
            'source' => $result['source'] ?? 'local',
            // While an AniList lookup for this text is queued, the browser
            // asks again shortly (useAnimeSearch).
            'pending' => $result['data'] === [] && SearchCache::lookupPending($query),
        ]);
    }
}
