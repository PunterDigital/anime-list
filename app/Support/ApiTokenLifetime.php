<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * API tokens end after half a year without use (card 5529). Sanctum's own
 * `expiration` counts from creation, which would sign the Chrome extension out
 * every few months however much it's used; this counts from the last use.
 * AppServiceProvider refuses such a token at once, and the daily
 * `api-tokens:prune-unused` deletes it.
 */
class ApiTokenLifetime
{
    public const INACTIVE_DAYS = 180;

    public static function cutoff(): Carbon
    {
        return now()->subDays(self::INACTIVE_DAYS);
    }

    public static function isActive(PersonalAccessToken $token): bool
    {
        $lastActivity = $token->last_used_at ?? $token->created_at;

        return $lastActivity !== null && $lastActivity->greaterThanOrEqualTo(self::cutoff());
    }

    /**
     * @param  Builder<PersonalAccessToken>  $query
     * @return Builder<PersonalAccessToken>
     */
    public static function inactive(Builder $query): Builder
    {
        $cutoff = self::cutoff();

        return $query->where(function (Builder $q) use ($cutoff) {
            $q->where('last_used_at', '<', $cutoff)
                ->orWhere(fn (Builder $never) => $never->whereNull('last_used_at')->where('created_at', '<', $cutoff));
        });
    }
}
