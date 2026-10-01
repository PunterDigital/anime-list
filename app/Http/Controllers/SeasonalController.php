<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use App\Services\SeasonService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class SeasonalController extends Controller
{
    public function index(Request $request, SeasonService $seasonService): Response
    {
        $current = $seasonService->currentSeason();
        $year = (int) $request->input('year', $current['year']);
        $year = max(1940, min((int) now()->format('Y') + 2, $year));
        $season = strtoupper($request->input('season', $current['season']));

        if (! in_array($season, ['WINTER', 'SPRING', 'SUMMER', 'FALL'])) {
            $season = $current['season'];
        }

        $isCurrent = $seasonService->isCurrentSeason($year, $season);
        $ttl = $isCurrent ? 21600 : 86400; // 6h current, 24h past

        $groups = Cache::remember("anime:seasonal:{$year}:{$season}", $ttl, function () use ($year, $season, $seasonService) {
            $anime = Anime::query()
                ->forSeason($year, $season)
                ->where('is_adult', false)->visible()
                ->with(['genres', 'nextAiringEpisode'])
                ->orderByDesc('popularity')
                ->get();

            $grouped = [];
            foreach ($seasonService->formatOrder() as $format) {
                $items = $anime->where('format', $format)->values();
                if ($items->isNotEmpty()) {
                    $grouped[] = [
                        'format' => $format,
                        'anime' => AnimeCardResource::collection($items)->resolve(),
                    ];
                }
            }

            // Catch any formats not in the defined order
            $knownFormats = $seasonService->formatOrder();
            $other = $anime->whereNotIn('format', $knownFormats)->values();
            if ($other->isNotEmpty()) {
                $grouped[] = [
                    'format' => 'OTHER',
                    'anime' => AnimeCardResource::collection($other)->resolve(),
                ];
            }

            return $grouped;
        });

        return Inertia::render('SeasonalPage', [
            'groups' => $groups,
            'year' => $year,
            'season' => $season,
            'adjacentSeasons' => $seasonService->adjacentSeasons($year, $season),
        ]);
    }
}
