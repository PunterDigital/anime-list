<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class TopAnimeController extends Controller
{
    public function rated(): Response
    {
        $anime = Cache::remember('top:rated:100', 86400, fn () => AnimeCardResource::collection(
            Anime::query()
                ->where('is_adult', false)->visible()
                ->whereNotNull('bayesian_score')
                ->where('bayesian_score', '>', 0)
                ->orderByDesc('bayesian_score')
                ->with(['genres', 'nextAiringEpisode'])
                ->limit(100)
                ->get()
        )->resolve());

        return Inertia::render('TopAnimePage', [
            'anime' => $anime,
            'metric' => 'rated',
        ]);
    }

    public function popular(): Response
    {
        $anime = Cache::remember('top:popular:100', 86400, fn () => AnimeCardResource::collection(
            Anime::query()
                ->where('is_adult', false)->visible()
                ->orderByDesc('popularity')
                ->with(['genres', 'nextAiringEpisode'])
                ->limit(100)
                ->get()
        )->resolve());

        return Inertia::render('TopAnimePage', [
            'anime' => $anime,
            'metric' => 'popular',
        ]);
    }
}
