<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnimeResource;
use App\Models\Anime;
use Illuminate\Http\JsonResponse;

class AnimeController extends Controller
{
    /**
     * Show an anime by its slug, with its related collections loaded.
     */
    public function show(Anime $anime): JsonResponse
    {
        if ($anime->isHidden()) {
            return $this->unavailable();
        }

        $anime->load(['genres', 'studios', 'externalIds', 'nextAiringEpisode']);

        return response()->json(new AnimeResource($anime));
    }

    /**
     * Show an anime by its AniList ID — the primary lookup path used by the
     * Chrome extension when the user is viewing an AniList page.
     */
    public function showByAnilistId(int $anilistId): JsonResponse
    {
        $anime = Anime::where('anilist_id', $anilistId)
            ->with(['genres', 'studios', 'externalIds', 'nextAiringEpisode'])
            ->first();

        if (! $anime) {
            return response()->json(['message' => 'Anime not found.'], 404);
        }

        if ($anime->isHidden()) {
            return $this->unavailable();
        }

        return response()->json(new AnimeResource($anime));
    }

    /**
     * Response for a title page an admin has hidden (for example after a
     * copyright takedown request).
     */
    private function unavailable(): JsonResponse
    {
        return response()->json(['message' => 'This anime is not available.'], 451);
    }
}
