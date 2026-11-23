<?php

namespace App\Support;

use App\Models\Anime;
use Illuminate\Support\Facades\Cache;

/**
 * Cache keys for /api/search (card 5707).
 *
 * - result: the response data for a query, 15 minutes for hits and
 *   10 minutes for misses (a miss used to be uncached, so every pause in
 *   typing repeated the AniList round trip).
 * - lookup: set when a miss queued an AniList lookup ('pending', then
 *   'done'), so the same text queues at most one lookup per 10 minutes.
 */
final class SearchCache
{
    public const HIT_TTL = 900;

    public const MISS_TTL = 600;

    public const LOOKUP_TTL = 600;

    public static function resultKey(string $query): string
    {
        // Key on the normalised form so "Komi can't" and "komi cant" share a cache entry.
        return 'search:'.md5(Anime::normalizeSearchText($query));
    }

    public static function lookupKey(string $query): string
    {
        return 'search:anilist:'.md5(Anime::normalizeSearchText($query));
    }

    public static function forgetResult(string $query): void
    {
        Cache::forget(self::resultKey($query));
    }

    /** True when this call claimed the lookup (none queued in the last 10 minutes). */
    public static function startLookup(string $query): bool
    {
        return Cache::add(self::lookupKey($query), 'pending', self::LOOKUP_TTL);
    }

    public static function finishLookup(string $query): void
    {
        Cache::put(self::lookupKey($query), 'done', self::LOOKUP_TTL);
    }

    public static function lookupPending(string $query): bool
    {
        return Cache::get(self::lookupKey($query)) === 'pending';
    }
}
