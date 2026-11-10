<?php

namespace App\Services;

use App\Models\UserAnimeList;
use Illuminate\Support\Facades\Cache;

/**
 * The AniTrack rating (card 4476): the average of every user's score for an
 * anime, shown on the anime page once enough people have scored it.
 *
 * Only real scores (1-10) count: 0 is "no score" in the list form. Private
 * entries count too, but only the average and the count ever leave here,
 * never who scored. Removed entries (soft-deleted) and deleted accounts
 * don't count.
 *
 * The aggregate is cached on its own key, outside the cached anime page
 * model, and UserAnimeList / User model events forget it whenever a score
 * changes, so a new score shows on the next page view.
 */
class AnimeRatingService
{
    /** Fewer scores than this and the page shows "No Rating Yet". */
    public const MIN_RATINGS = 10;

    private const CACHE_TTL_SECONDS = 3600;

    /**
     * @return array{average: float, count: int}|null null while fewer than MIN_RATINGS users scored it
     */
    public function forAnime(int $animeId): ?array
    {
        $stats = Cache::remember(
            self::cacheKey($animeId),
            self::CACHE_TTL_SECONDS,
            fn (): array => $this->aggregate($animeId),
        );

        if ($stats['count'] < self::MIN_RATINGS) {
            return null;
        }

        return [
            'average' => round($stats['sum'] / $stats['count'], 1),
            'count' => $stats['count'],
        ];
    }

    public static function forget(int $animeId): void
    {
        Cache::forget(self::cacheKey($animeId));
    }

    public static function cacheKey(int $animeId): string
    {
        return "anime:rating:v1:{$animeId}";
    }

    /**
     * Sum and count rather than AVG(): both are integers on every driver
     * (MySQL's AVG is a decimal string), and the cached value stays exact.
     *
     * @return array{sum: int, count: int}
     */
    private function aggregate(int $animeId): array
    {
        $row = UserAnimeList::query()
            ->join('users', 'users.id', '=', 'user_anime_lists.user_id')
            ->whereNull('users.deleted_at')
            ->where('user_anime_lists.anime_id', $animeId)
            ->whereBetween('user_anime_lists.score', [1, 10])
            ->selectRaw('COUNT(*) as ratings, COALESCE(SUM(user_anime_lists.score), 0) as total')
            ->toBase()
            ->first();

        return [
            'sum' => (int) ($row->total ?? 0),
            'count' => (int) ($row->ratings ?? 0),
        ];
    }
}
