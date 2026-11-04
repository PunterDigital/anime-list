<?php

namespace App\Support;

use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Resources\AnimeCardResource;
use App\Models\Anime;
use App\Services\FeatureFlagService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Props for the Inertia ErrorPage. Behind the `error-pages` flag, 403, 404,
 * 419 and 451 render inside the site layout with next steps; 500 and 503 stay
 * standalone, because the layout itself may be what is broken.
 */
class ErrorPageProps
{
    public const LAYOUT_STATUSES = [403, 404, 419, 451];

    public const MAX_ALTERNATIVES = 6;

    /**
     * @return array<string, mixed>
     */
    public static function for(Request $request, int $status): array
    {
        $props = ['status' => $status];

        if (! in_array($status, self::LAYOUT_STATUSES, true)) {
            return $props;
        }

        // A failure here must not break the error page itself.
        $improved = rescue(
            fn () => app(FeatureFlagService::class)->active('error-pages', $request->user()),
            false,
            false,
        );

        if (! $improved) {
            return $props;
        }

        self::shareLayoutProps($request);

        return [
            ...$props,
            'layout' => true,
            'suggestedSearch' => $status === 404 ? self::suggestedSearch($request) : null,
            'alternatives' => $status === 451
                ? rescue(fn () => self::alternatives($request), [], false)
                : [],
        ];
    }

    /**
     * The layout needs the shared props (auth, features, ziggy). Errors thrown
     * before HandleInertiaRequests ran (route model binding, CSRF) have none.
     */
    private static function shareLayoutProps(Request $request): void
    {
        if (Inertia::getShared('auth') !== null) {
            return;
        }

        Inertia::share(app(HandleInertiaRequests::class)->share($request));
    }

    /**
     * Words from a missing anime URL (/anime/cowboy-bebop-2 → "cowboy bebop 2").
     */
    public static function suggestedSearch(Request $request): ?string
    {
        if (! preg_match('#^anime/([^/]+)$#', $request->path(), $match)) {
            return null;
        }

        $words = Str::of(urldecode($match[1]))
            ->replaceMatches('/[^\pL\pN]+/u', ' ')
            ->squish()
            ->limit(80, '')
            ->trim()
            ->toString();

        return $words === '' || ctype_digit($words) ? null : $words;
    }

    /**
     * Up to six visible anime for a hidden anime's page: its own
     * recommendations first, then top-rated anime that share its genres.
     * Nothing about the hidden anime itself is returned.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function alternatives(Request $request): array
    {
        $anime = $request->route('anime');

        if (! $anime instanceof Anime) {
            return [];
        }

        $recommendedIds = $anime->recommendations()
            ->orderByDesc('rating')
            ->orderBy('id')
            ->pluck('recommended_anime_id')
            ->all();

        $picked = self::cardQuery($anime)
            ->whereKey($recommendedIds)
            ->get()
            ->sortBy(fn (Anime $a) => array_search($a->id, $recommendedIds, true))
            ->take(self::MAX_ALTERNATIVES)
            ->values();

        $missing = self::MAX_ALTERNATIVES - $picked->count();
        $genreIds = $anime->genres()->pluck('genres.id')->all();

        if ($missing > 0 && $genreIds !== []) {
            $picked = $picked->concat(
                self::cardQuery($anime)
                    ->whereKeyNot($picked->pluck('id')->all())
                    ->whereHas('genres', fn ($q) => $q->whereIn('genres.id', $genreIds))
                    ->whereNotNull('bayesian_score')
                    ->orderByDesc('bayesian_score')
                    ->orderBy('id')
                    ->limit($missing)
                    ->get()
            );
        }

        return self::toCards($picked);
    }

    /**
     * @return Builder<Anime>
     */
    private static function cardQuery(Anime $hidden)
    {
        return Anime::query()
            ->visible()
            ->safeForWork()
            ->whereKeyNot($hidden->id)
            ->with(['genres', 'nextAiringEpisode']);
    }

    /**
     * @param  Collection<int, Anime>  $anime
     * @return array<int, array<string, mixed>>
     */
    private static function toCards(Collection $anime): array
    {
        return AnimeCardResource::collection($anime->values())->resolve();
    }
}
