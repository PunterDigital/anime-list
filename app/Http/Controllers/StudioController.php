<?php

namespace App\Http\Controllers;

use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use App\Models\Studio;
use App\Services\FeatureFlagService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class StudioController extends Controller
{
    public function __construct(
        private readonly FeatureFlagService $featureFlags,
    ) {}

    private function ensureFeatureEnabled(?Request $request = null): void
    {
        if (! $this->featureFlags->active('studio-pages', $request?->user())) {
            abort(404);
        }
    }

    public function index(Request $request): Response
    {
        $this->ensureFeatureEnabled($request);

        return $this->renderIndex($request, kind: 'studio');
    }

    public function producersIndex(Request $request): Response
    {
        $this->ensureFeatureEnabled($request);

        return $this->renderIndex($request, kind: 'producer');
    }

    public function show(Request $request, Studio $studio): Response|RedirectResponse
    {
        $this->ensureFeatureEnabled($request);

        if (! $studio->is_animation_studio) {
            // Non-animation studios live under /producers
            return redirect()->route('producers.show', $studio, 301);
        }

        return $this->renderShow($studio, kind: 'studio');
    }

    public function producerShow(Request $request, Studio $studio): Response|RedirectResponse
    {
        $this->ensureFeatureEnabled($request);

        if ($studio->is_animation_studio) {
            return redirect()->route('studios.show', $studio, 301);
        }

        return $this->renderShow($studio, kind: 'producer');
    }

    private function renderIndex(Request $request, string $kind): Response
    {
        $isAnimationStudio = $kind === 'studio';
        $search = trim((string) $request->query('search', ''));

        $query = Studio::query()
            ->where('is_animation_studio', $isAnimationStudio)
            ->whereHas('anime', fn ($q) => $q->where('is_adult', false)->visible())
            ->withCount(['anime' => fn ($q) => $q->where('is_adult', false)->visible()]);

        if ($search !== '') {
            $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';
            $query->where('name', 'like', $like);
        }

        $studios = $query
            ->orderByDesc('anime_count')
            ->orderBy('name')
            ->paginate(48)
            ->withQueryString();

        return Inertia::render('StudioIndexPage', [
            'kind' => $kind,
            'studios' => [
                'data' => $studios->through(fn (Studio $s) => [
                    'id' => $s->id,
                    'slug' => $s->slug,
                    'name' => $s->name,
                    'anime_count' => $s->anime_count,
                ])->items(),
                'meta' => [
                    'current_page' => $studios->currentPage(),
                    'last_page' => $studios->lastPage(),
                    'total' => $studios->total(),
                    'per_page' => $studios->perPage(),
                ],
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    private function renderShow(Studio $studio, string $kind): Response
    {
        $paginator = QueryBuilder::for(
            Anime::query()
                ->where('is_adult', false)->visible()
                ->whereHas('studios', fn ($q) => $q->where('studios.id', $studio->id))
        )
            ->allowedSorts([
                AllowedSort::field('popularity'),
                AllowedSort::field('average_score'),
                AllowedSort::field('trending'),
                AllowedSort::field('favourites'),
                AllowedSort::field('title_romaji'),
                AllowedSort::field('season_year'),
                AllowedSort::field('aired_from'),
            ])
            ->defaultSort('-popularity')
            ->with(['genres', 'nextAiringEpisode'])
            ->paginate(24)
            ->withQueryString();

        $routeName = $kind === 'studio' ? 'studios.show' : 'producers.show';
        $label = $kind === 'studio' ? 'Studio' : 'Producer';

        return Inertia::render('StudioDetailPage', [
            'kind' => $kind,
            'studio' => [
                'id' => $studio->id,
                'slug' => $studio->slug,
                'name' => $studio->name,
                'is_animation_studio' => $studio->is_animation_studio,
                'website_url' => $studio->website_url,
                'anime_count' => $studio->anime()
                    ->where('is_adult', false)->visible()
                    ->count(),
            ],
            'anime' => AnimeCardResource::collection($paginator),
            'og' => [
                'title' => "{$studio->name} — {$label}",
                'description' => "Browse all anime "
                    .($kind === 'studio' ? 'animated by' : 'produced by')
                    ." {$studio->name} on AniTrack.",
                'url' => route($routeName, $studio),
            ],
        ]);
    }
}
