<?php

namespace App\Services;

/**
 * AniList refuses any page whose offset reaches past the first 5,000 entries
 * of a result set ("Page depth exceeds maximum allowed for API requests"),
 * and it answers with a 400 rather than an empty page. A sweep that simply
 * walks pageInfo.hasNextPage therefore dies on the page after the limit,
 * which is what killed the incremental sync at page 101 of 101.
 *
 * Every paged sweep asks this class where the wall is before it dispatches
 * the next page.
 */
class AniListPageDepth
{
    /**
     * Entries reachable through pagination, as enforced by AniList.
     */
    public static function limit(): int
    {
        return max(1, (int) config('anilist.sync.max_page_depth', 5000));
    }

    /**
     * Highest page number that stays inside the limit at this page size.
     */
    public static function maxPage(int $perPage): int
    {
        return max(1, intdiv(self::limit(), max(1, $perPage)));
    }

    /**
     * Whether AniList will serve this page at this page size.
     */
    public static function allows(int $page, int $perPage): bool
    {
        return $page <= self::maxPage($perPage);
    }
}
