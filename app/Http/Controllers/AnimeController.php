<?php

namespace App\Http\Controllers;

use App\Exceptions\AniListApiException;
use App\Exceptions\AniListRateLimitException;
use App\Exceptions\AniListServiceUnavailableException;
use App\Http\Resources\AnimeResource;
use App\Http\Resources\ListEntryResource;
use App\Jobs\ResolveAnimeRelations;
use App\Models\Anime;
use App\Models\AnimeRelation;
use App\Models\UserAnimeList;
use App\Http\Resources\AnimeCardResource;
use App\Services\AniListClient;
use App\Services\AniListQueryBuilder;
use App\Services\AnimeDataPersistenceService;
use App\Services\AnimeQueryService;
use App\Services\DiscoverService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AnimeController extends Controller
{
    public function index(Request $request, AnimeQueryService $queryService): Response
    {
        $data = $queryService->browse(24);

        return Inertia::render('AnimeIndexPage', $data);
    }

    public function showByAnilistId(
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

        // Fetch from AniList API
        try {
            $data = $client->query(AniListQueryBuilder::singleAnime(), ['id' => $anilistId]);
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

    public function show(Request $request, Anime $anime, DiscoverService $discover): Response
    {
        $cacheKey = "anime:v3:{$anime->id}";
        $model = Cache::get($cacheKey);

        if ($model === null) {
            if ($anime->is_adult) {
                abort(404);
            }

            $anime->load([
                'genres',
                'studios',
                'externalIds',
                'nextAiringEpisode',
                'airingSchedules' => fn ($q) => $q->upcoming()->limit(12),
                'episodeList' => fn ($q) => $q->orderBy('number'),
                'relations.relatedAnime.genres',
                'characters' => fn ($q) => $q->orderByRaw(
                    "CASE anime_character.role "
                    ."WHEN 'MAIN' THEN 1 "
                    ."WHEN 'SUPPORTING' THEN 2 "
                    ."WHEN 'BACKGROUND' THEN 3 "
                    ."ELSE 4 END"
                )->orderBy('characters.id'),
                'characters.voiceActors' => fn ($q) => $q->wherePivot('anime_id', $anime->id),
            ]);

            $model = $anime;
            Cache::put($cacheKey, $model, 3600);
        }

        $listEntry = null;
        if ($request->user()) {
            $listEntry = UserAnimeList::where('user_id', $request->user()->id)
                ->where('anime_id', $model->id)
                ->first();
        }

        $title = $model->title_english ?: $model->title_romaji;
        $description = $model->synopsis
            ? \Illuminate\Support\Str::limit(strip_tags($model->synopsis), 200)
            : "View {$title} on AniTrack";
        $image = $model->cover_image_large ?: $model->cover_image_medium;

        $recommendations = AnimeCardResource::collection(
            $discover->similarTo($model, 8)
        )->resolve();

        return Inertia::render('AnimeDetailPage', [
            'anime' => (new AnimeResource($model))->resolve(),
            'list_entry' => $listEntry ? (new ListEntryResource($listEntry))->resolve() : null,
            'seasons' => $this->getSeasonChain($model),
            'recommendations' => $recommendations,
            'og' => [
                'title' => $title,
                'description' => $description,
                'image' => $image,
                'url' => route('anime.show', $model),
                'noindex' => ! $model->isIndexable(),
            ],
        ]);
    }

    /**
     * Build a chronological season chain by traversing SEQUEL/PREQUEL relations.
     *
     * @return array<int, array>
     */
    private function getSeasonChain(Anime $anime): array
    {
        $maxTraversal = 30;

        // Walk backward through PREQUELs to find the root (Season 1)
        $rootId = $anime->id;
        $visited = [$rootId => true];

        for ($i = 0; $i < $maxTraversal; $i++) {
            $prequel = AnimeRelation::where('anime_id', $rootId)
                ->where('relation_type', 'PREQUEL')
                ->first();

            if (! $prequel || isset($visited[$prequel->related_anime_id])) {
                break;
            }

            $rootId = $prequel->related_anime_id;
            $visited[$rootId] = true;
        }

        // Walk forward through SEQUELs from the root to collect the chain
        $chain = [];
        $currentId = $rootId;
        $visited = [$currentId => true];

        for ($i = 0; $i < $maxTraversal; $i++) {
            $entry = Anime::select([
                'id', 'slug', 'title_romaji', 'title_english',
                'cover_image_large', 'cover_image_medium',
                'episodes', 'format', 'status', 'average_score',
            ])->find($currentId);

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

            $sequel = AnimeRelation::where('anime_id', $currentId)
                ->where('relation_type', 'SEQUEL')
                ->first();

            if (! $sequel || isset($visited[$sequel->related_anime_id])) {
                break;
            }

            $currentId = $sequel->related_anime_id;
            $visited[$currentId] = true;
        }

        return $chain;
    }
}
