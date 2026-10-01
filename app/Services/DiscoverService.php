<?php

namespace App\Services;

use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use App\Models\AiringSchedule;
use App\Models\Genre;
use App\Models\Recommendation;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Models\UserAnimeRecommendation;
use App\Services\Recommendations\RecommendationEngine;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class DiscoverService
{
    public function __construct(
        private readonly RecommendationEngine $engine,
    ) {}

    public const LENGTH_SHORT = 'short';

    public const LENGTH_STANDARD = 'standard';

    public const LENGTH_LONG = 'long';

    public const LENGTH_MOVIE = 'movie';

    public const LENGTHS = [
        self::LENGTH_SHORT,
        self::LENGTH_STANDARD,
        self::LENGTH_LONG,
        self::LENGTH_MOVIE,
    ];

    public function moods(): array
    {
        $moods = config('moods', []);

        return collect($moods)->map(function (array $def, string $slug) {
            return [
                'slug' => $slug,
                'label' => $def['label'],
                'description' => $def['description'] ?? null,
                'emoji' => $def['emoji'] ?? null,
                'gradient' => $def['gradient'] ?? null,
            ];
        })->values()->all();
    }

    public function byMood(string $slug, ?string $length = null, int $limit = 24): array
    {
        $def = config("moods.{$slug}");
        if (! $def) {
            return [];
        }

        $any = $def['genres_any'] ?? [];
        $boost = $def['genres_boost'] ?? [];
        $exclude = $def['genres_exclude'] ?? [];
        $minScore = (int) ($def['min_score'] ?? 70);

        $query = Anime::query()
            ->where('is_adult', false)->visible()
            ->whereNotNull('average_score')
            ->where('average_score', '>=', $minScore)
            ->whereHas('genres', fn ($q) => $q->whereIn('name', $any));

        if (! empty($exclude)) {
            $query->whereDoesntHave('genres', fn ($q) => $q->whereIn('name', $exclude));
        }

        $this->applyLength($query, $length);

        // Score by popularity, favouring titles that also match boost genres.
        // We keep this simple: fetch a wider set then rank in PHP.
        $candidates = $query
            ->with(['genres', 'nextAiringEpisode'])
            ->orderByDesc('bayesian_score')
            ->limit($limit * 3)
            ->get();

        $ranked = $candidates->sortByDesc(function (Anime $anime) use ($boost) {
            $genreNames = $anime->genres->pluck('name')->all();
            $boostHits = count(array_intersect($genreNames, $boost));

            return ($anime->bayesian_score ?? 0) + ($boostHits * 500);
        })->take($limit)->values();

        return AnimeCardResource::collection($ranked)->resolve();
    }

    public function trendingTop10(): array
    {
        return Cache::remember('discover:trending:top10', 3600, function () {
            $results = Anime::query()
                ->where('is_adult', false)->visible()
                ->whereNotNull('trending')
                ->where('trending', '>', 0)
                ->with(['genres', 'nextAiringEpisode'])
                ->orderByDesc('trending')
                ->limit(10)
                ->get();

            return AnimeCardResource::collection($results)->resolve();
        });
    }

    public function recentlyUpdated(int $limit = 12): array
    {
        return Cache::remember("discover:recently_updated:{$limit}", 1800, function () use ($limit) {
            // Oversample so we have room to dedupe by anime — a batch of episodes
            // often airs at the same time, and we only want each show once.
            $schedules = AiringSchedule::query()
                ->whereBetween('airs_at', [now()->subDays(14), now()])
                ->whereHas('anime', fn ($q) => $q->where('is_adult', false)->visible())
                ->with(['anime' => fn ($q) => $q->with(['genres', 'nextAiringEpisode'])])
                ->orderByDesc('airs_at')
                ->limit($limit * 5)
                ->get();

            $seen = [];
            $items = [];
            foreach ($schedules as $schedule) {
                if (! $schedule->anime || isset($seen[$schedule->anime_id])) {
                    continue;
                }
                $seen[$schedule->anime_id] = true;
                $items[] = [
                    'anime' => (new AnimeCardResource($schedule->anime))->resolve(request()),
                    'latest_episode' => (int) $schedule->episode,
                    'aired_at' => $schedule->airs_at->toIso8601String(),
                ];
                if (count($items) >= $limit) {
                    break;
                }
            }

            return $items;
        });
    }

    public function hiddenGems(int $limit = 18): array
    {
        return Cache::remember("discover:hidden_gems:{$limit}", 21600, function () use ($limit) {
            $results = Anime::query()
                ->where('is_adult', false)->visible()
                ->whereNotNull('average_score')
                ->where('average_score', '>=', 80)
                ->where(function ($q) {
                    $q->whereNull('popularity')->orWhere('popularity', '<', 20000);
                })
                ->whereIn('status', ['FINISHED', 'RELEASING'])
                ->with(['genres', 'nextAiringEpisode'])
                ->orderByDesc('average_score')
                ->limit($limit)
                ->get();

            return AnimeCardResource::collection($results)->resolve();
        });
    }

    /**
     * Pick a recommendation anchor from the user's list (a highly rated entry),
     * then return recommendations similar to it.
     */
    public function moreLikeIt(User $user, int $limit = 12): ?array
    {
        $anchor = UserAnimeList::query()
            ->where('user_id', $user->id)
            ->where('score', '>=', 8)
            ->whereIn('status', [
                UserAnimeList::STATUS_COMPLETED,
                UserAnimeList::STATUS_WATCHING,
            ])
            ->with('anime.genres')
            ->orderByDesc('score')
            ->inRandomOrder()
            ->first();

        if (! $anchor || ! $anchor->anime) {
            return null;
        }

        $watchedIds = UserAnimeList::query()
            ->where('user_id', $user->id)
            ->pluck('anime_id')
            ->all();

        $similar = Recommendation::query()
            ->where('anime_id', $anchor->anime_id)
            ->whereNotIn('recommended_anime_id', $watchedIds)
            ->with(['recommendedAnime.genres', 'recommendedAnime.nextAiringEpisode'])
            ->orderByDesc('rating')
            ->limit($limit)
            ->get()
            ->map(fn (Recommendation $r) => $r->recommendedAnime)
            ->filter()
            ->filter(fn (Anime $a) => ! $a->is_adult && ! $a->isHidden())
            ->values();

        // Fallback if no recommendations stored: use genre overlap.
        if ($similar->isEmpty()) {
            $similar = $this->genreFallback($anchor->anime, $watchedIds, $limit);
        }

        return [
            'anchor' => (new AnimeCardResource($anchor->anime))->resolve(request()),
            'similar' => AnimeCardResource::collection($similar)->resolve(),
        ];
    }

    /**
     * "Picked for you" — ranked anime tailored to a specific user.
     *
     * Prefers the precomputed table (populated nightly by the recommendations
     * job). Falls back to live compute if nothing is cached yet — this covers
     * brand-new users and local dev where the job hasn't run.
     */
    public function pickedForYou(User $user, int $limit = 24): array
    {
        $precomputed = UserAnimeRecommendation::query()
            ->where('user_id', $user->id)
            ->with(['anime.genres', 'anime.nextAiringEpisode'])
            ->orderBy('rank')
            ->limit($limit)
            ->get()
            ->map(fn (UserAnimeRecommendation $row) => $row->anime)
            ->filter()
            ->values();

        if ($precomputed->isNotEmpty()) {
            return [
                'source' => 'precomputed',
                'items' => AnimeCardResource::collection($precomputed)->resolve(),
            ];
        }

        $live = $this->engine->recommendFor($user, $limit);
        $live->loadMissing(['genres', 'nextAiringEpisode']);

        return [
            'source' => 'live',
            'items' => AnimeCardResource::collection($live)->resolve(),
        ];
    }

    /**
     * Anime-to-anime similarity for the detail page's "you might also enjoy"
     * section. Pulls AniList-sourced recommendations when available, falls
     * back to genre overlap + bayesian score.
     *
     * @return Collection<int, Anime>
     */
    public function similarTo(Anime $anime, int $limit = 8): Collection
    {
        $excludeIds = [$anime->id];

        $similar = Recommendation::query()
            ->where('anime_id', $anime->id)
            ->whereNotIn('recommended_anime_id', $excludeIds)
            ->with(['recommendedAnime.genres', 'recommendedAnime.nextAiringEpisode'])
            ->orderByDesc('rating')
            ->limit($limit)
            ->get()
            ->map(fn (Recommendation $r) => $r->recommendedAnime)
            ->filter()
            ->filter(fn (Anime $a) => ! $a->is_adult && ! $a->isHidden())
            ->values();

        if ($similar->isEmpty()) {
            $similar = $this->genreFallback($anime, $excludeIds, $limit);
        }

        return $similar;
    }

    private function genreFallback(Anime $anchor, array $excludeIds, int $limit): Collection
    {
        $genreIds = $anchor->genres->pluck('id')->all();
        if (empty($genreIds)) {
            return collect();
        }

        return Anime::query()
            ->where('is_adult', false)->visible()
            ->where('id', '!=', $anchor->id)
            ->whereNotIn('id', $excludeIds)
            ->whereHas('genres', fn ($q) => $q->whereIn('genres.id', $genreIds))
            ->with(['genres', 'nextAiringEpisode'])
            ->orderByDesc('bayesian_score')
            ->limit($limit)
            ->get();
    }

    private function applyLength($query, ?string $length): void
    {
        switch ($length) {
            case self::LENGTH_SHORT:
                $query->whereIn('format', ['TV', 'TV_SHORT', 'ONA'])
                    ->whereBetween('episodes', [1, 12]);
                break;
            case self::LENGTH_STANDARD:
                $query->whereIn('format', ['TV', 'ONA'])
                    ->whereBetween('episodes', [13, 26]);
                break;
            case self::LENGTH_LONG:
                $query->whereIn('format', ['TV', 'ONA'])
                    ->where('episodes', '>=', 27);
                break;
            case self::LENGTH_MOVIE:
                $query->where('format', 'MOVIE');
                break;
        }
    }
}
