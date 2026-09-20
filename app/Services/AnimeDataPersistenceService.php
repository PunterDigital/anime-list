<?php

namespace App\Services;

use App\DTOs\AnimeData;
use App\Models\AiringSchedule;
use App\Models\Anime;
use App\Models\Character;
use App\Models\Episode;
use App\Models\ExternalId;
use App\Models\Genre;
use App\Models\Person;
use App\Models\Studio;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class AnimeDataPersistenceService
{
    /**
     * Persist a batch of raw AniList media items in a single transaction.
     *
     * @param  array<int, array>  $mediaItems  Raw AniList media arrays
     * @return Collection<int, Anime>
     */
    public function persistBatch(array $mediaItems): Collection
    {
        $dtos = array_map(fn (array $media) => AnimeData::fromAniList($media), $mediaItems);

        return DB::transaction(function () use ($dtos) {
            $animeModels = $this->upsertAnimeBatch($dtos);
            $animeMap = $animeModels->pluck('id', 'anilist_id');

            $this->syncGenresBatch($dtos, $animeMap);
            $this->syncStudiosBatch($dtos, $animeMap);
            $this->syncCharactersBatch($dtos, $animeMap);
            $this->upsertAiringSchedulesBatch($dtos, $animeMap);
            $this->upsertEpisodesBatch($dtos, $animeMap);
            $this->upsertExternalIdsBatch($dtos, $animeMap);
            $this->pushPendingRelations($dtos);
            $this->pushPendingRecommendations($dtos);
            $this->invalidateCaches($dtos, $animeMap);

            return $animeModels;
        });
    }

    /**
     * Persist a single raw AniList media item.
     */
    public function persistSingle(array $mediaData): Anime
    {
        $dto = AnimeData::fromAniList($mediaData);

        $anime = DB::transaction(function () use ($dto) {
            $anime = $this->upsertSingleAnime($dto);

            $this->syncGenresForAnime($anime, $dto);
            $this->syncStudiosForAnime($anime, $dto);
            $this->syncCharactersForAnime($anime, $dto);
            $this->upsertAiringSchedulesForAnime($anime, $dto);
            $this->upsertEpisodesForAnime($anime, $dto);
            $this->upsertExternalIdsForAnime($anime, $dto);

            return $anime;
        });

        if (! empty($dto->relations)) {
            $this->pushPendingRelations([$dto]);
        }

        if (! empty($dto->recommendations)) {
            $this->pushPendingRecommendations([$dto]);
        }

        Cache::forget("anime:v3:{$anime->id}");
        if ($dto->season && $dto->season_year) {
            Cache::forget("anime:seasonal:{$dto->season_year}:{$dto->season}");
        }

        return $anime;
    }

    // ─── Batch operations ───────────────────────────────────────────────

    /**
     * @param  AnimeData[]  $dtos
     */
    private function upsertAnimeBatch(array $dtos): Collection
    {
        $rows = [];
        foreach ($dtos as $dto) {
            $rows[] = $this->animeAttributes($dto);
        }

        // Preserve admin-rewritten synopses: keep the existing DB value
        // for any anime whose synopsis_rewritten_at is set.
        $anilistIds = array_column($rows, 'anilist_id');
        $rewritten = Anime::whereIn('anilist_id', $anilistIds)
            ->whereNotNull('synopsis_rewritten_at')
            ->pluck('synopsis', 'anilist_id');

        if ($rewritten->isNotEmpty()) {
            foreach ($rows as &$row) {
                if ($rewritten->has($row['anilist_id'])) {
                    $row['synopsis'] = $rewritten->get($row['anilist_id']);
                    $row['synopsis_word_count'] = Anime::countSynopsisWords($row['synopsis']);
                }
            }
            unset($row);
        }

        // Handle mal_id duplicates: first attempt with mal_ids, retry without on conflict
        try {
            Anime::upsert($rows, ['anilist_id'], array_keys($rows[0]));
        } catch (UniqueConstraintViolationException $e) {
            if (str_contains($e->getMessage(), 'mal_id')) {
                Log::warning('Batch upsert mal_id conflict, retrying with null mal_ids', [
                    'count' => count($rows),
                ]);
                $rows = array_map(function ($row) {
                    $row['mal_id'] = null;

                    return $row;
                }, $rows);
                Anime::upsert($rows, ['anilist_id'], array_keys($rows[0]));
            } else {
                throw $e;
            }
        }

        $anilistIds = array_column($rows, 'anilist_id');

        return Anime::whereIn('anilist_id', $anilistIds)->get()->keyBy('anilist_id');
    }

    /**
     * @param  AnimeData[]  $dtos
     * @param  Collection<int, int>  $animeMap  anilist_id => anime.id
     */
    private function syncGenresBatch(array $dtos, Collection $animeMap): void
    {
        // Collect all unique genre names
        $allGenreNames = collect($dtos)
            ->flatMap(fn (AnimeData $dto) => collect($dto->genres)->pluck('name'))
            ->unique()
            ->values()
            ->all();

        if (empty($allGenreNames)) {
            return;
        }

        // Ensure all genres exist
        $existing = Genre::whereIn('name', $allGenreNames)->pluck('id', 'name');
        $missing = array_diff($allGenreNames, $existing->keys()->all());

        if (! empty($missing)) {
            Genre::insert(array_map(fn ($name) => [
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ], $missing));
            $existing = Genre::whereIn('name', $allGenreNames)->pluck('id', 'name');
        }

        // Build pivot rows
        $pivotRows = [];
        foreach ($dtos as $dto) {
            $animeId = $animeMap->get($dto->anilist_id);
            if (! $animeId || empty($dto->genres)) {
                continue;
            }

            foreach ($dto->genres as $genre) {
                $genreId = $existing->get($genre->name);
                if ($genreId) {
                    $pivotRows[] = ['anime_id' => $animeId, 'genre_id' => $genreId];
                }
            }
        }

        if (! empty($pivotRows)) {
            // Delete existing and re-insert for the batch
            $affectedAnimeIds = array_unique(array_column($pivotRows, 'anime_id'));
            DB::table('anime_genre')->whereIn('anime_id', $affectedAnimeIds)->delete();
            DB::table('anime_genre')->insert($pivotRows);
        }
    }

    /**
     * @param  AnimeData[]  $dtos
     * @param  Collection<int, int>  $animeMap
     */
    private function syncStudiosBatch(array $dtos, Collection $animeMap): void
    {
        // Collect all studios and upsert them
        $allStudios = collect($dtos)
            ->flatMap(fn (AnimeData $dto) => collect($dto->studios)->map(fn ($edge) => $edge->studio))
            ->unique(fn ($s) => $s->anilist_id)
            ->values();

        if ($allStudios->isEmpty()) {
            return;
        }

        $studioRows = $allStudios->map(fn ($s) => [
            'anilist_id' => $s->anilist_id,
            'name' => $s->name,
            'is_animation_studio' => $s->is_animation_studio,
            'website_url' => $s->website_url,
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        Studio::upsert($studioRows, ['anilist_id'], ['name', 'is_animation_studio', 'website_url', 'updated_at']);

        // Populate slugs for newly inserted studios (upsert bypasses model events)
        Studio::whereIn('anilist_id', $allStudios->pluck('anilist_id'))
            ->whereNull('slug')
            ->get()
            ->each(function (Studio $s) {
                $s->slug = Studio::generateUniqueSlug($s);
                $s->saveQuietly();
            });

        $studioMap = Studio::whereIn('anilist_id', $allStudios->pluck('anilist_id'))
            ->pluck('id', 'anilist_id');

        // Build pivot rows
        $pivotRows = [];
        foreach ($dtos as $dto) {
            $animeId = $animeMap->get($dto->anilist_id);
            if (! $animeId || empty($dto->studios)) {
                continue;
            }

            foreach ($dto->studios as $edge) {
                $studioId = $studioMap->get($edge->studio->anilist_id);
                if ($studioId) {
                    $pivotRows[] = [
                        'anime_id' => $animeId,
                        'studio_id' => $studioId,
                        'is_main' => $edge->is_main,
                    ];
                }
            }
        }

        if (! empty($pivotRows)) {
            // Deduplicate: AniList can list the same studio twice (as main + non-main).
            // Keep is_main=true when duplicates exist.
            $unique = [];
            foreach ($pivotRows as $row) {
                $key = $row['anime_id'].'-'.$row['studio_id'];
                if (! isset($unique[$key]) || $row['is_main']) {
                    $unique[$key] = $row;
                }
            }
            $pivotRows = array_values($unique);

            $affectedAnimeIds = array_unique(array_column($pivotRows, 'anime_id'));
            DB::table('anime_studio')->whereIn('anime_id', $affectedAnimeIds)->delete();
            DB::table('anime_studio')->insert($pivotRows);
        }
    }

    /**
     * @param  AnimeData[]  $dtos
     * @param  Collection<int, int>  $animeMap
     */
    private function syncCharactersBatch(array $dtos, Collection $animeMap): void
    {
        // Gather every unique character & person in the batch
        $characters = [];
        $people = [];
        foreach ($dtos as $dto) {
            foreach ($dto->characters as $edge) {
                $characters[$edge->character->anilist_id] = $edge->character;
                foreach ($edge->voice_actors as $va) {
                    $people[$va->person->anilist_id] = $va->person;
                }
            }
        }

        if (empty($characters) && empty($people)) {
            return;
        }

        // Upsert characters
        $characterIdMap = collect();
        if (! empty($characters)) {
            $characterRows = array_map(fn ($c) => [
                'anilist_id' => $c->anilist_id,
                'name_full' => $c->name_full,
                'name_native' => $c->name_native,
                'image_large' => $c->image_large,
                'image_medium' => $c->image_medium,
                'description' => $c->description,
                'gender' => $c->gender,
                'site_url' => $c->site_url,
                'created_at' => now(),
                'updated_at' => now(),
            ], array_values($characters));

            Character::upsert(
                $characterRows,
                ['anilist_id'],
                ['name_full', 'name_native', 'image_large', 'image_medium', 'description', 'gender', 'site_url', 'updated_at'],
            );

            $characterIdMap = Character::whereIn('anilist_id', array_keys($characters))
                ->pluck('id', 'anilist_id');
        }

        // Upsert people (VAs) then backfill slugs
        $personIdMap = collect();
        if (! empty($people)) {
            $personRows = array_map(fn ($p) => [
                'anilist_id' => $p->anilist_id,
                'name_full' => $p->name_full,
                'name_native' => $p->name_native,
                'image_large' => $p->image_large,
                'image_medium' => $p->image_medium,
                'gender' => $p->gender,
                'birthdate' => $p->birthdate,
                'site_url' => $p->site_url,
                'created_at' => now(),
                'updated_at' => now(),
            ], array_values($people));

            Person::upsert(
                $personRows,
                ['anilist_id'],
                ['name_full', 'name_native', 'image_large', 'image_medium', 'gender', 'birthdate', 'site_url', 'updated_at'],
            );

            // Populate slugs for newly inserted people (upsert bypasses model events)
            Person::whereIn('anilist_id', array_keys($people))
                ->whereNull('slug')
                ->get()
                ->each(function (Person $p) {
                    $p->slug = Person::generateUniqueSlug($p);
                    $p->saveQuietly();
                });

            $personIdMap = Person::whereIn('anilist_id', array_keys($people))
                ->pluck('id', 'anilist_id');
        }

        // Build anime_character + character_voice_actor pivot rows
        $animeCharacterRows = [];
        $voiceActorRows = [];
        $affectedAnimeIds = [];

        foreach ($dtos as $dto) {
            $animeId = $animeMap->get($dto->anilist_id);
            if (! $animeId || empty($dto->characters)) {
                continue;
            }
            $affectedAnimeIds[$animeId] = true;

            foreach ($dto->characters as $edge) {
                $characterId = $characterIdMap->get($edge->character->anilist_id);
                if (! $characterId) {
                    continue;
                }

                $animeCharacterRows[$animeId.'-'.$characterId] = [
                    'anime_id' => $animeId,
                    'character_id' => $characterId,
                    'role' => $edge->role,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                foreach ($edge->voice_actors as $va) {
                    $personId = $personIdMap->get($va->person->anilist_id);
                    if (! $personId) {
                        continue;
                    }

                    $key = "{$animeId}-{$characterId}-{$personId}-{$va->language}";
                    $voiceActorRows[$key] = [
                        'anime_id' => $animeId,
                        'character_id' => $characterId,
                        'person_id' => $personId,
                        'language' => $va->language,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        if (! empty($affectedAnimeIds)) {
            $ids = array_keys($affectedAnimeIds);
            DB::table('anime_character')->whereIn('anime_id', $ids)->delete();
            DB::table('character_voice_actor')->whereIn('anime_id', $ids)->delete();
        }

        if (! empty($animeCharacterRows)) {
            DB::table('anime_character')->insert(array_values($animeCharacterRows));
        }
        if (! empty($voiceActorRows)) {
            DB::table('character_voice_actor')->insert(array_values($voiceActorRows));
        }
    }

    /**
     * @param  AnimeData[]  $dtos
     * @param  Collection<int, int>  $animeMap
     */
    private function upsertAiringSchedulesBatch(array $dtos, Collection $animeMap): void
    {
        $rows = [];
        foreach ($dtos as $dto) {
            $animeId = $animeMap->get($dto->anilist_id);
            if (! $animeId || empty($dto->airing_schedules)) {
                continue;
            }

            foreach ($dto->airing_schedules as $s) {
                $rows[] = [
                    'anime_id' => $animeId,
                    'anilist_airing_id' => $s->anilist_airing_id,
                    'episode' => $s->episode,
                    'airs_at' => $s->airs_at,
                    'time_until_airing' => $s->time_until_airing,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (! empty($rows)) {
            AiringSchedule::upsert(
                $rows,
                ['anilist_airing_id'],
                ['anime_id', 'episode', 'airs_at', 'time_until_airing', 'updated_at'],
            );
        }
    }

    /**
     * @param  AnimeData[]  $dtos
     * @param  Collection<int, int>  $animeMap
     */
    private function upsertEpisodesBatch(array $dtos, Collection $animeMap): void
    {
        $rows = [];
        foreach ($dtos as $dto) {
            $animeId = $animeMap->get($dto->anilist_id);
            if (! $animeId || empty($dto->episodes_data)) {
                continue;
            }

            foreach ($dto->episodes_data as $ep) {
                $rows[] = [
                    'anime_id' => $animeId,
                    'number' => $ep->number,
                    'title' => $ep->title,
                    'description' => null,
                    'thumbnail_url' => $ep->thumbnail_url,
                    'air_date' => $ep->air_date,
                    'runtime_minutes' => $ep->runtime_minutes,
                    'score' => $ep->score,
                    'anilist_airing_id' => $ep->anilist_airing_id,
                    'site_url' => $ep->site_url,
                    'source_site' => $ep->source_site,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (! empty($rows)) {
            Episode::upsert(
                $rows,
                ['anime_id', 'number'],
                ['title', 'thumbnail_url', 'air_date', 'runtime_minutes', 'anilist_airing_id', 'site_url', 'source_site', 'updated_at'],
            );
        }
    }

    /**
     * @param  AnimeData[]  $dtos
     * @param  Collection<int, int>  $animeMap
     */
    private function upsertExternalIdsBatch(array $dtos, Collection $animeMap): void
    {
        $rows = [];
        foreach ($dtos as $dto) {
            $animeId = $animeMap->get($dto->anilist_id);
            if (! $animeId || empty($dto->external_links)) {
                continue;
            }

            foreach ($dto->external_links as $link) {
                $rows[] = [
                    'anime_id' => $animeId,
                    'platform' => $link->platform,
                    'external_id' => null,
                    'url' => $link->url,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (! empty($rows)) {
            ExternalId::upsert(
                $rows,
                ['anime_id', 'platform'],
                ['url', 'updated_at'],
            );
        }
    }

    /**
     * @param  AnimeData[]  $dtos
     */
    private function pushPendingRelations(array $dtos): void
    {
        $pendingRelations = [];
        foreach ($dtos as $dto) {
            foreach ($dto->relations as $r) {
                $pendingRelations[] = json_encode([
                    'from_anilist_id' => $dto->anilist_id,
                    'to_anilist_id' => $r->related_anilist_id,
                    'relation_type' => $r->relation_type,
                ]);
            }
        }

        if (! empty($pendingRelations)) {
            try {
                Redis::rpush('sync:pending_relations', ...$pendingRelations);
            } catch (\Throwable $e) {
                Log::error('Failed to push pending relations to Redis', [
                    'count' => count($pendingRelations),
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Stash recommendations into Redis for deferred resolution. The recommended
     * anime may not yet exist locally when its source is first synced (AniList
     * returns recommendations that point to arbitrary media ids), so we resolve
     * anilist_id -> internal id after the sync sweep finishes.
     *
     * @param  AnimeData[]  $dtos
     */
    private function pushPendingRecommendations(array $dtos): void
    {
        $pending = [];
        foreach ($dtos as $dto) {
            foreach ($dto->recommendations as $r) {
                $pending[] = json_encode([
                    'from_anilist_id' => $dto->anilist_id,
                    'to_anilist_id' => $r->recommended_anilist_id,
                    'anilist_recommendation_id' => $r->anilist_recommendation_id,
                    'rating' => $r->rating,
                ]);
            }
        }

        if (! empty($pending)) {
            try {
                Redis::rpush('sync:pending_recommendations', ...$pending);
            } catch (\Throwable $e) {
                Log::error('Failed to push pending recommendations to Redis', [
                    'count' => count($pending),
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * @param  AnimeData[]  $dtos
     * @param  Collection<int, int>  $animeMap
     */
    private function invalidateCaches(array $dtos, Collection $animeMap): void
    {
        foreach ($dtos as $dto) {
            $animeId = $animeMap->get($dto->anilist_id);
            if ($animeId) {
                Cache::forget("anime:v3:{$animeId}");
            }
            if ($dto->season && $dto->season_year) {
                Cache::forget("anime:seasonal:{$dto->season_year}:{$dto->season}");
            }
        }
    }

    // ─── Single-item operations (for persistSingle) ─────────────────────

    private function upsertSingleAnime(AnimeData $dto): Anime
    {
        $attributes = $this->animeAttributes($dto);
        unset($attributes['anilist_id']);

        // Preserve admin-rewritten synopses on re-sync.
        $existing = Anime::where('anilist_id', $dto->anilist_id)
            ->whereNotNull('synopsis_rewritten_at')
            ->first(['synopsis']);
        if ($existing) {
            unset($attributes['synopsis'], $attributes['synopsis_word_count']);
        }

        try {
            return Anime::updateOrCreate(
                ['anilist_id' => $dto->anilist_id],
                $attributes,
            );
        } catch (UniqueConstraintViolationException $e) {
            if (str_contains($e->getMessage(), 'mal_id')) {
                $attributes['mal_id'] = null;
                Log::warning('Duplicate mal_id detected, set to null', [
                    'anilist_id' => $dto->anilist_id,
                    'mal_id' => $dto->mal_id,
                ]);

                return Anime::updateOrCreate(
                    ['anilist_id' => $dto->anilist_id],
                    $attributes,
                );
            }

            throw $e;
        }
    }

    private function syncGenresForAnime(Anime $anime, AnimeData $dto): void
    {
        if (empty($dto->genres)) {
            return;
        }

        $genreNames = collect($dto->genres)->pluck('name')->all();
        $existing = Genre::whereIn('name', $genreNames)->pluck('id', 'name');

        $missing = array_diff($genreNames, $existing->keys()->all());
        if (! empty($missing)) {
            Genre::insert(array_map(fn ($name) => [
                'name' => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ], $missing));
            $existing = Genre::whereIn('name', $genreNames)->pluck('id', 'name');
        }

        $anime->genres()->sync($existing->values()->all());
    }

    private function syncStudiosForAnime(Anime $anime, AnimeData $dto): void
    {
        if (empty($dto->studios)) {
            return;
        }

        $studioSync = [];
        foreach ($dto->studios as $edge) {
            $studio = Studio::updateOrCreate(
                ['anilist_id' => $edge->studio->anilist_id],
                [
                    'name' => $edge->studio->name,
                    'is_animation_studio' => $edge->studio->is_animation_studio,
                    'website_url' => $edge->studio->website_url,
                ],
            );
            $studioSync[$studio->id] = ['is_main' => $edge->is_main];
        }

        $anime->studios()->sync($studioSync);
    }

    private function syncCharactersForAnime(Anime $anime, AnimeData $dto): void
    {
        if (empty($dto->characters)) {
            return;
        }

        $animeCharacterRows = [];
        $voiceActorRows = [];

        foreach ($dto->characters as $edge) {
            $character = Character::updateOrCreate(
                ['anilist_id' => $edge->character->anilist_id],
                [
                    'name_full' => $edge->character->name_full,
                    'name_native' => $edge->character->name_native,
                    'image_large' => $edge->character->image_large,
                    'image_medium' => $edge->character->image_medium,
                    'description' => $edge->character->description,
                    'gender' => $edge->character->gender,
                    'site_url' => $edge->character->site_url,
                ],
            );

            $animeCharacterRows[$character->id] = [
                'anime_id' => $anime->id,
                'character_id' => $character->id,
                'role' => $edge->role,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            foreach ($edge->voice_actors as $va) {
                $person = Person::updateOrCreate(
                    ['anilist_id' => $va->person->anilist_id],
                    [
                        'name_full' => $va->person->name_full,
                        'name_native' => $va->person->name_native,
                        'image_large' => $va->person->image_large,
                        'image_medium' => $va->person->image_medium,
                        'gender' => $va->person->gender,
                        'birthdate' => $va->person->birthdate,
                        'site_url' => $va->person->site_url,
                    ],
                );

                $key = "{$character->id}-{$person->id}-{$va->language}";
                $voiceActorRows[$key] = [
                    'anime_id' => $anime->id,
                    'character_id' => $character->id,
                    'person_id' => $person->id,
                    'language' => $va->language,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('anime_character')->where('anime_id', $anime->id)->delete();
        DB::table('character_voice_actor')->where('anime_id', $anime->id)->delete();

        if (! empty($animeCharacterRows)) {
            DB::table('anime_character')->insert(array_values($animeCharacterRows));
        }
        if (! empty($voiceActorRows)) {
            DB::table('character_voice_actor')->insert(array_values($voiceActorRows));
        }
    }

    private function upsertAiringSchedulesForAnime(Anime $anime, AnimeData $dto): void
    {
        if (empty($dto->airing_schedules)) {
            return;
        }

        $rows = array_map(fn ($s) => [
            'anime_id' => $anime->id,
            'anilist_airing_id' => $s->anilist_airing_id,
            'episode' => $s->episode,
            'airs_at' => $s->airs_at,
            'time_until_airing' => $s->time_until_airing,
            'created_at' => now(),
            'updated_at' => now(),
        ], $dto->airing_schedules);

        AiringSchedule::upsert(
            $rows,
            ['anilist_airing_id'],
            ['anime_id', 'episode', 'airs_at', 'time_until_airing', 'updated_at'],
        );
    }

    private function upsertEpisodesForAnime(Anime $anime, AnimeData $dto): void
    {
        if (empty($dto->episodes_data)) {
            return;
        }

        $rows = array_map(fn ($ep) => [
            'anime_id' => $anime->id,
            'number' => $ep->number,
            'title' => $ep->title,
            'description' => null,
            'thumbnail_url' => $ep->thumbnail_url,
            'air_date' => $ep->air_date,
            'runtime_minutes' => $ep->runtime_minutes,
            'score' => $ep->score,
            'anilist_airing_id' => $ep->anilist_airing_id,
            'site_url' => $ep->site_url,
            'source_site' => $ep->source_site,
            'created_at' => now(),
            'updated_at' => now(),
        ], $dto->episodes_data);

        Episode::upsert(
            $rows,
            ['anime_id', 'number'],
            ['title', 'thumbnail_url', 'air_date', 'runtime_minutes', 'anilist_airing_id', 'site_url', 'source_site', 'updated_at'],
        );
    }

    private function upsertExternalIdsForAnime(Anime $anime, AnimeData $dto): void
    {
        if (empty($dto->external_links)) {
            return;
        }

        $rows = array_map(fn ($link) => [
            'anime_id' => $anime->id,
            'platform' => $link->platform,
            'external_id' => null,
            'url' => $link->url,
            'created_at' => now(),
            'updated_at' => now(),
        ], $dto->external_links);

        ExternalId::upsert(
            $rows,
            ['anime_id', 'platform'],
            ['url', 'updated_at'],
        );
    }

    // ─── Helpers ────────────────────────────────────────────────────────

    private function animeAttributes(AnimeData $dto): array
    {
        return [
            'anilist_id' => $dto->anilist_id,
            'mal_id' => $dto->mal_id,
            'title_romaji' => $dto->title_romaji,
            'title_english' => $dto->title_english,
            'title_native' => $dto->title_native,
            'title_synonyms' => json_encode($dto->title_synonyms),
            'format' => $dto->format,
            'status' => $dto->status,
            'season' => $dto->season,
            'season_year' => $dto->season_year,
            'source' => $dto->source,
            'episodes' => $dto->episodes,
            'duration' => $dto->duration,
            'episode_count_unknown' => $dto->episode_count_unknown,
            'aired_from' => $dto->aired_from,
            'aired_to' => $dto->aired_to,
            'synopsis' => $dto->synopsis,
            // Upserts bypass model events, so the count is computed here too.
            'synopsis_word_count' => Anime::countSynopsisWords($dto->synopsis),
            'cover_image_large' => $dto->cover_image_large,
            'cover_image_medium' => $dto->cover_image_medium,
            'cover_image_color' => $dto->cover_image_color,
            'banner_image' => $dto->banner_image,
            'trailer_url' => $dto->trailer_url,
            'average_score' => $dto->average_score,
            'mean_score' => $dto->mean_score,
            'popularity' => $dto->popularity,
            'trending' => $dto->trending,
            'favourites' => $dto->favourites,
            'is_adult' => $dto->is_adult,
            'anilist_updated_at' => $dto->anilist_updated_at,
            'synced_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
