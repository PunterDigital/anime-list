<?php

namespace App\Http\Controllers;

use App\Exceptions\AniListApiException;
use App\Exceptions\AniListRateLimitException;
use App\Exceptions\AniListServiceUnavailableException;
use App\Http\Resources\AnimeCardResource;
use App\Http\Resources\AnimeResource;
use App\Http\Resources\ListEntryResource;
use App\Jobs\ResolveAnimeRelations;
use App\Models\Anime;
use App\Models\AnimeRelation;
use App\Models\UserAnimeList;
use App\Services\AniListClient;
use App\Services\AniListQueryBuilder;
use App\Services\AnimeDataPersistenceService;
use App\Services\AnimeQueryService;
use App\Services\AnimeRatingService;
use App\Services\DiscoverService;
use App\Services\FeatureFlagService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AnimeController extends Controller
{
    public function index(Request $request, AnimeQueryService $queryService): Response
    {
        $data = $queryService->browse(24);

        return Inertia::render('AnimeIndexPage', $data);
    }

    /** On-demand AniList fetches a minute, per IP and for the whole site. */
    public const ANILIST_FETCHES_PER_IP = 10;

    public const ANILIST_FETCHES_PER_SITE = 30;

    public function showByAnilistId(
        Request $request,
        int $anilistId,
        AniListClient $client,
        AnimeDataPersistenceService $persistenceService,
    ): RedirectResponse {
        // Check if we already have this anime locally
        $existing = Anime::where('anilist_id', $anilistId)->first();

        if ($existing) {
            if (! $existing->slug) {
                $existing->slug = Anime::generateUniqueSlug($existing);
                $existing->saveQuietly();
            }

            return redirect()->route('anime.show', $existing);
        }

        // Fetching from AniList spends the API budget the sync jobs need, so
        // on-demand fetches are capped per visitor and for the whole site
        // (card 5529). Local titles above are never limited.
        $limits = [
            'anilist-fetch:ip:'.$request->ip() => self::ANILIST_FETCHES_PER_IP,
            'anilist-fetch:site' => self::ANILIST_FETCHES_PER_SITE,
        ];
        foreach ($limits as $key => $max) {
            if (RateLimiter::tooManyAttempts($key, $max)) {
                return redirect()->route('home')
                    ->with('flash', ['type' => 'error', 'message' => 'Too many new titles were opened at once. Please try again in a minute.']);
            }
        }
        foreach (array_keys($limits) as $key) {
            RateLimiter::hit($key, 60);
        }

        // Fetch from AniList API
        try {
            // Fail fast (card 5707): no rate-limit sleep, retry or long timeout while
            // the visitor waits; an empty bucket or a 429 shows the "try again" flash.
            $data = $client->interactive()->query(AniListQueryBuilder::singleAnime(), ['id' => $anilistId]);
        } catch (AniListServiceUnavailableException $e) {
            Log::warning('On-demand fetch paused (AniList unavailable)', [
                'anilist_id' => $anilistId,
                'retry_after_s' => $e->retryAfter,
            ]);

            return redirect()->route('home')
                ->with('flash', ['type' => 'error', 'message' => 'AniList is temporarily unavailable. Please try again shortly.']);
        } catch (AniListRateLimitException $e) {
            Log::warning('On-demand fetch rate limited', ['anilist_id' => $anilistId]);

            return redirect()->route('home')
                ->with('flash', ['type' => 'error', 'message' => 'AniList API rate limit reached. Please try again in a moment.']);
        } catch (AniListApiException $e) {
            Log::error('On-demand fetch failed', ['anilist_id' => $anilistId, 'error' => $e->getMessage()]);

            return redirect()->route('home')
                ->with('flash', ['type' => 'error', 'message' => 'Could not fetch anime data from AniList.']);
        }

        $mediaData = $data['Media'] ?? null;

        if (! $mediaData) {
            abort(404);
        }

        $anime = $persistenceService->persistSingle($mediaData);

        if (! $anime->slug) {
            $anime->slug = Anime::generateUniqueSlug($anime);
            $anime->saveQuietly();
        }

        // Queue relation resolution; running it synchronously here ties up the
        // request's DB connection while the job pops from Redis and upserts.
        ResolveAnimeRelations::dispatch()->onQueue('import');

        return redirect()->route('anime.show', $anime);
    }

    public function show(
        Request $request,
        Anime $anime,
        DiscoverService $discover,
        AnimeRatingService $ratings,
        FeatureFlagService $features,
    ): Response {
        // Checked before the cache so a page hidden by an admin (for example
        // after a copyright takedown request) goes down at once.
        if ($anime->isHidden()) {
            abort(451);
        }

        // Card 4198: a title an admin marked NSFW opens only for signed-in
        // users; guests get a sign-in page that returns here (noindex).
        if ($anime->isNsfw() && ! $request->user()) {
            return Inertia::render('AnimeNsfwGatePage', ['slug' => $anime->slug]);
        }

        // Checked on every view, not only when the cache is filled: a title
        // AniList flags adult later must not keep its cached page.
        if ($anime->is_adult) {
            abort(404);
        }

        // Card 5709: the cache holds plain arrays (the resolved resources),
        // not the Eloquent graph, and the season chain and the "similar"
        // cards are built once per fill instead of on every view.
        $cacheKey = Anime::pageCacheKey($anime->id);
        $page = Cache::get($cacheKey);

        if (! is_array($page)) {
            $page = $this->buildPage($anime, $discover);
            Cache::put($cacheKey, $page, 3600);
        }

        $listEntry = null;
        if ($request->user()) {
            $listEntry = UserAnimeList::where('user_id', $request->user()->id)
                ->where('anime_id', $anime->id)
                ->first();
        }

        return Inertia::render('AnimeDetailPage', [
            'anime' => $page['anime'],
            'list_entry' => $listEntry ? (new ListEntryResource($listEntry))->resolve() : null,
            'seasons' => $page['seasons'],
            'recommendations' => $this->listableCards($page['recommendations']),
            // Card 4476: outside the cached page, so a new score shows at once.
            // A closure, so a partial reload after a list edit can ask for it alone.
            'anitrack_rating' => fn () => $features->active('anitrack-rating', $request->user())
                ? $ratings->forAnime($anime->id)
                : null,
            'og' => $page['og'] + [
                'url' => route('anime.show', $anime),
                // The content half of isIndexable() is cached; the admin flags
                // are read from the live row.
                'noindex' => $page['noindex_content'] || $anime->isNsfw() || $anime->isHidden(),
            ],
        ]);
    }

    /**
     * Everything on the anime page that is the same for every viewer, as
     * plain arrays for the cache.
     *
     * @return array{anime: array, seasons: array, recommendations: array, og: array, noindex_content: bool}
     */
    private function buildPage(Anime $anime, DiscoverService $discover): array
    {
        $anime->load([
            'genres',
            'studios',
            'externalIds',
            'nextAiringEpisode',
            'airingSchedules' => fn ($q) => $q->upcoming()->limit(12),
            'episodeList' => fn ($q) => $q->orderBy('number'),
            // Only what AnimeRelationResource prints.
            'relations.relatedAnime' => fn ($q) => $q->select([
                'id', 'slug', 'title_romaji', 'title_english', 'format', 'status',
                'cover_image_medium', 'cover_image_color', 'average_score',
            ]),
            'relations.relatedAnime.genres',
            'characters' => fn ($q) => $q->orderByRaw(
                'CASE anime_character.role '
                ."WHEN 'MAIN' THEN 1 "
                ."WHEN 'SUPPORTING' THEN 2 "
                ."WHEN 'BACKGROUND' THEN 3 "
                .'ELSE 4 END'
            )->orderBy('characters.id'),
            'characters.voiceActors' => fn ($q) => $q->wherePivot('anime_id', $anime->id),
        ]);

        $title = $anime->title_english ?: $anime->title_romaji;

        // resolve() leaves nested resources (genres, characters, ...) as
        // objects that still hold their models; a JSON round trip turns the
        // whole tree into the arrays Inertia would send anyway.
        $plain = fn (mixed $resolved): array => json_decode(json_encode($resolved, JSON_THROW_ON_ERROR), true, flags: JSON_THROW_ON_ERROR);

        return [
            'anime' => $plain((new AnimeResource($anime))->resolve()),
            'seasons' => $this->getSeasonChain($anime),
            'recommendations' => $plain(AnimeCardResource::collection($discover->similarTo($anime, 8))->resolve()),
            'og' => [
                'title' => $title,
                'description' => $anime->synopsis
                    ? Str::limit(strip_tags($anime->synopsis), 200)
                    : "View {$title} on AniTrack",
                'image' => $anime->cover_image_large ?: $anime->cover_image_medium,
            ],
            'noindex_content' => ! $anime->isIndexable(),
        ];
    }

    /**
     * Cached cards minus titles an admin hid or marked NSFW (or AniList
     * flagged adult) since the page was cached: one id lookup.
     *
     * @param  list<array<string, mixed>>  $cards
     * @return list<array<string, mixed>>
     */
    private function listableCards(array $cards): array
    {
        $ids = array_column($cards, 'id');
        if ($ids === []) {
            return $cards;
        }

        $removed = Anime::query()->whereIn('id', $ids)
            ->where(fn ($q) => $q->where('is_adult', true)->orWhereNotNull('nsfw_at')->orWhereNotNull('hidden_at'))
            ->pluck('id')->all();

        if ($removed === []) {
            return $cards;
        }

        return array_values(array_filter($cards, fn (array $card) => ! in_array($card['id'] ?? null, $removed, true)));
    }

    /**
     * Build a chronological season chain by traversing SEQUEL/PREQUEL relations:
     * one query per step to walk the relations, then one for the titles.
     *
     * @return array<int, array>
     */
    private function getSeasonChain(Anime $anime): array
    {
        $maxTraversal = 30;

        $step = fn (int $id, string $type): ?int => AnimeRelation::where('anime_id', $id)
            ->where('relation_type', $type)
            ->value('related_anime_id');

        // Walk backward through PREQUELs to find the root (Season 1)
        $rootId = $anime->id;
        $visited = [$rootId => true];
        for ($i = 0; $i < $maxTraversal; $i++) {
            $prequelId = $step($rootId, 'PREQUEL');
            if (! $prequelId || isset($visited[$prequelId])) {
                break;
            }
            $rootId = $prequelId;
            $visited[$rootId] = true;
        }

        // Walk forward through SEQUELs from the root to collect the chain
        $ids = [$rootId];
        $visited = [$rootId => true];
        for ($i = 0; $i < $maxTraversal; $i++) {
            $sequelId = $step(end($ids), 'SEQUEL');
            if (! $sequelId || isset($visited[$sequelId])) {
                break;
            }
            $ids[] = $sequelId;
            $visited[$sequelId] = true;
        }

        $entries = Anime::select([
            'id', 'slug', 'title_romaji', 'title_english',
            'cover_image_large', 'cover_image_medium',
            'episodes', 'format', 'status', 'average_score',
        ])->whereIn('id', $ids)->get()->keyBy('id');

        $chain = [];
        foreach ($ids as $id) {
            // A missing row ends the chain, as the step-by-step walk did.
            $entry = $entries->get($id);
            if (! $entry) {
                break;
            }

            $chain[] = [
                'id' => $entry->id,
                'slug' => $entry->slug,
                'title_romaji' => $entry->title_romaji,
                'title_english' => $entry->title_english,
                'cover_image_large' => $entry->cover_image_large,
                'cover_image_medium' => $entry->cover_image_medium,
                'episodes' => $entry->episodes,
                'format' => $entry->format,
                'status' => $entry->status,
                'average_score' => Anime::normalizeScore($entry->average_score),
                'is_current' => $entry->id === $anime->id,
            ];
        }

        return $chain;
    }
}
