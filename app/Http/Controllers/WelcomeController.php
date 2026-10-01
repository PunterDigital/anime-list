<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use App\Services\FeatureFlagService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function __construct(
        private readonly FeatureFlagService $featureFlags,
    ) {}

    public function __invoke(): Response
    {
        if (! $this->featureFlags->active('landing-page', Auth::user())) {
            abort(404);
        }

        $featuredAnime = Cache::remember('welcome:featured_anime', 21600, function () {
            return AnimeCardResource::collection(
                Anime::query()
                    ->where('is_adult', false)->visible()
                    ->whereNotNull('cover_image_medium')
                    ->orderByDesc('popularity')
                    ->with('genres')
                    ->limit(12)
                    ->get()
            )->resolve();
        });

        $totalAnime = Cache::remember(
            'welcome:total_anime',
            86400,
            fn () => Anime::query()->where('is_adult', false)->visible()->count(),
        );

        return Inertia::render('WelcomePage', [
            'featuredAnime' => $featuredAnime,
            'totalAnime' => $totalAnime,
        ]);
    }
}
