<?php

namespace App\Services\Recommendations;

use App\Models\Anime;
use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;

/**
 * Composes per-user rankings from three strategies:
 *   1. Content-based genre/studio affinity
 *   2. Item-item from the AniList recommendations graph, seeded on user anchors
 *   3. Cold-start fallback (plan-to-watch genres, or raw popularity)
 *
 * Strategy outputs are merged with fixed weights, then filtered for:
 *   - freshness (exclude anything already on the user's list)
 *   - adult content (always excluded for v1 — no opt-in setting yet)
 *   - diversity (cap 2 results per main studio)
 */
class RecommendationEngine
{
    private const WEIGHT_CONTENT = 1.0;

    private const WEIGHT_ITEM_ITEM = 1.5;

    private const STUDIO_CAP = 2;

    private const POPULARITY_PENALTY_SCALE = 0.25;

    private const CANDIDATE_POOL_MULTIPLIER = 4;

    public function __construct(
        private readonly TasteProfileService $profiles,
    ) {}

    /**
     * Return a ranked collection of anime with a `recommendation_score` attribute.
     */
    public function recommendFor(User $user, int $limit = 100): EloquentCollection
    {
        $profile = $this->profiles->for($user);

        if (! $profile->hasAnyList() || $profile->isCold()) {
            return $this->coldStart($profile, $limit);
        }

        $contentScores = $this->contentBased($profile);
        $itemItemScores = $this->itemItem($profile);

        $merged = $this->mergeScores([
            [self::WEIGHT_CONTENT, $contentScores],
            [self::WEIGHT_ITEM_ITEM, $itemItemScores],
        ]);

        if ($merged->isEmpty()) {
            return $this->coldStart($profile, $limit);
        }

        $candidates = Anime::query()
            ->whereIn('id', $merged->keys()->all())
            ->with(['genres', 'studios'])
            ->get();

        $ranked = $candidates
            ->each(function (Anime $anime) use ($merged) {
                $anime->recommendation_score = (float) $merged->get($anime->id, 0.0);
            })
            ->sortByDesc('recommendation_score')
            ->values();

        return $this->diversify($ranked, $limit);
    }

    /**
     * Dot product of candidate genre set against the user's normalized genre vector,
     * plus a smaller studio signal and a popularity prior minus a popularity penalty
     * (so we don't just surface the top-100 most popular titles).
     *
     * @return Collection<int, float> keyed by anime id
     */
    private function contentBased(TasteProfile $profile): Collection
    {
        $topGenres = collect($profile->genreAffinity)
            ->sortByDesc(fn ($w) => $w)
            ->take(12)
            ->keys()
            ->all();

        if (empty($topGenres)) {
            return collect();
        }

        $poolSize = self::CANDIDATE_POOL_MULTIPLIER * 100;

        $candidates = Anime::query()
            ->where('is_adult', false)->visible()
            ->whereNotIn('id', $profile->seenAnimeIds ?: [0])
            ->whereHas('genres', fn ($q) => $q->whereIn('name', $topGenres))
            ->with(['genres:id,name', 'studios:id,name'])
            ->orderByDesc('bayesian_score')
            ->limit($poolSize)
            ->get();

        $scores = collect();

        foreach ($candidates as $anime) {
            $genreScore = 0.0;
            foreach ($anime->genres as $genre) {
                $genreScore += $profile->genreAffinity[$genre->name] ?? 0.0;
            }

            $studioScore = 0.0;
            foreach ($anime->studios as $studio) {
                $studioScore += $profile->studioAffinity[$studio->name] ?? 0.0;
            }

            // Bayesian prior (0-100) scaled down so it doesn't dominate affinity.
            $prior = ($anime->bayesian_score ?? 0) / 100.0;

            // Light popularity penalty: log-scaled so a few very-popular items don't sweep.
            $penalty = self::POPULARITY_PENALTY_SCALE * log10(max(1, $anime->popularity ?? 1)) / 6.0;

            $score = $genreScore + (0.3 * $studioScore) + (0.4 * $prior) - $penalty;

            if ($score > 0) {
                $scores[$anime->id] = $score;
            }
        }

        return $scores;
    }

    /**
     * Pull recommendations from the AniList graph seeded on the user's top-rated
     * completed anime. Union, sum ratings, exclude already-seen.
     *
     * @return Collection<int, float> keyed by anime id
     */
    private function itemItem(TasteProfile $profile): Collection
    {
        if (empty($profile->anchorAnimeIds)) {
            return collect();
        }

        $rows = Recommendation::query()
            ->whereIn('anime_id', $profile->anchorAnimeIds)
            ->whereNotIn('recommended_anime_id', $profile->seenAnimeIds ?: [0])
            ->get(['recommended_anime_id', 'rating']);

        if ($rows->isEmpty()) {
            return collect();
        }

        $summed = [];
        foreach ($rows as $row) {
            $id = $row->recommended_anime_id;
            $summed[$id] = ($summed[$id] ?? 0) + max(0, (int) $row->rating);
        }

        // Exclude adult and hidden titles at the SQL layer.
        $adultIds = Anime::query()
            ->whereIn('id', array_keys($summed))
            ->where(fn ($q) => $q->where('is_adult', true)->orWhereNotNull('hidden_at'))
            ->pluck('id')
            ->all();

        foreach ($adultIds as $id) {
            unset($summed[$id]);
        }

        if (empty($summed)) {
            return collect();
        }

        // Normalize to roughly 0-1 so weights are comparable with the content vector.
        $max = max($summed);
        if ($max <= 0) {
            return collect();
        }

        return collect($summed)->map(fn ($v) => $v / $max);
    }

    /**
     * Cold-start users get popular titles inside their plan-to-watch genres.
     * If they have no list at all, fall back to raw popularity.
     */
    private function coldStart(TasteProfile $profile, int $limit): EloquentCollection
    {
        $query = Anime::query()
            ->where('is_adult', false)->visible()
            ->whereNotNull('bayesian_score')
            ->whereIn('status', ['FINISHED', 'RELEASING']);

        if (! empty($profile->seenAnimeIds)) {
            $query->whereNotIn('id', $profile->seenAnimeIds);
        }

        if (! empty($profile->planToWatchGenres)) {
            $query->whereHas(
                'genres',
                fn ($q) => $q->whereIn('name', $profile->planToWatchGenres),
            );
        }

        $results = $query
            ->with(['genres', 'studios'])
            ->orderByDesc('bayesian_score')
            ->limit($limit * self::CANDIDATE_POOL_MULTIPLIER)
            ->get();

        $results->each(function (Anime $anime) {
            $anime->recommendation_score = (float) (($anime->bayesian_score ?? 0) / 100.0);
        });

        return $this->diversify($results, $limit);
    }

    /**
     * Merge weighted score maps.
     *
     * @param  array<int, array{0: float, 1: Collection<int, float>}>  $sources
     * @return Collection<int, float>
     */
    private function mergeScores(array $sources): Collection
    {
        $merged = [];
        foreach ($sources as [$weight, $scores]) {
            foreach ($scores as $animeId => $score) {
                $merged[$animeId] = ($merged[$animeId] ?? 0.0) + ($weight * $score);
            }
        }

        return collect($merged);
    }

    /**
     * Cap main-studio repetition so a user doesn't get 8 shows from the same studio.
     */
    private function diversify(EloquentCollection $ranked, int $limit): EloquentCollection
    {
        $studioCounts = [];
        $kept = new EloquentCollection;

        foreach ($ranked as $anime) {
            if ($kept->count() >= $limit) {
                break;
            }

            $mainStudio = $anime->studios
                ->firstWhere('pivot.is_main', true)
                ?? $anime->studios->first();

            $key = $mainStudio?->id ?? "anime:{$anime->id}";

            $count = $studioCounts[$key] ?? 0;
            if ($count >= self::STUDIO_CAP) {
                continue;
            }

            $studioCounts[$key] = $count + 1;
            $kept->push($anime);
        }

        return $kept;
    }
}
