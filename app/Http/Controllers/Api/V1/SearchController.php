<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Search the local anime catalogue for the given query.
     *
     * Public API endpoint consumed by the Chrome extension and third-party
     * integrations. Restricted to local data — AniList fallback is handled
     * by the internal site search and the background sync pipeline.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $query = trim((string) $request->string('q'));
        $limit = (int) $request->integer('limit', 20);
        $limit = max(1, min($limit, 50));

        if (mb_strlen($query) < 2 || mb_strlen($query) > 200) {
            return response()->json([
                'data' => [],
                'query' => $query,
                'total' => 0,
            ]);
        }

        $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $query).'%';

        $results = Anime::query()
            ->where('is_adult', false)->visible()
            ->where(function ($builder) use ($like) {
                $builder->where('title_romaji', 'like', $like)
                    ->orWhere('title_english', 'like', $like)
                    ->orWhere('title_native', 'like', $like);
            })
            ->orderByDesc('popularity')
            ->with('genres')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => AnimeCardResource::collection($results)->resolve(),
            'query' => $query,
            'total' => $results->count(),
        ]);
    }
}
