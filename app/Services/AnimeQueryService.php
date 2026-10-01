<?php

namespace App\Services;

use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use App\Models\Genre;
use App\Models\Studio;
use Illuminate\Support\Facades\Cache;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class AnimeQueryService
{
    public function browse(int $perPage = 24): array
    {
        $perPage = min(max($perPage, 1), 100);

        $paginator = QueryBuilder::for(
            Anime::query()->where('is_adult', false)->visible()
        )
            ->allowedFilters([
                AllowedFilter::exact('format'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('season'),
                AllowedFilter::exact('season_year'),
                AllowedFilter::callback('genre', function ($query, $value) {
                    $query->whereHas('genres', function ($q) use ($value) {
                        $q->where('name', $value);
                    });
                }),
                AllowedFilter::callback('studio', function ($query, $value) {
                    $query->whereHas('studios', function ($q) use ($value) {
                        $q->where('studios.id', $value);
                    });
                }),
                AllowedFilter::callback('search', function ($query, $value) {
                    $term = trim((string) $value);
                    if ($term === '') {
                        return;
                    }
                    $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $term).'%';
                    $query->where(function ($q) use ($like) {
                        $q->where('title_romaji', 'like', $like)
                            ->orWhere('title_english', 'like', $like)
                            ->orWhere('title_native', 'like', $like);
                    });
                }),
            ])
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
            ->paginate($perPage)
            ->withQueryString();

        return [
            'anime' => AnimeCardResource::collection($paginator),
            'genres' => $this->cachedGenres(),
            'studios' => $this->cachedStudios(),
        ];
    }

    public function cachedGenres(): array
    {
        return Cache::remember('filter:genres', 86400, function () {
            return Genre::query()
                ->whereHas('anime')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->toArray();
        });
    }

    public function cachedStudios(): array
    {
        return Cache::remember('filter:studios', 86400, function () {
            return Studio::query()
                ->where('is_animation_studio', true)
                ->whereHas('anime')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->toArray();
        });
    }
}
