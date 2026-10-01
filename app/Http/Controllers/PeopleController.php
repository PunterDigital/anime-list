<?php

namespace App\Http\Controllers;

use App\Models\CharacterVoiceActor;
use App\Models\Person;
use App\Services\FeatureFlagService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PeopleController extends Controller
{
    public function __construct(
        private readonly FeatureFlagService $featureFlags,
    ) {}

    private function ensureFeatureEnabled(?Request $request = null): void
    {
        if (! $this->featureFlags->active('voice-actor-pages', $request?->user())) {
            abort(404);
        }
    }

    public function index(Request $request): Response
    {
        $this->ensureFeatureEnabled($request);

        $search = trim((string) $request->query('search', ''));

        // Count VA roles per person (restricted to non-adult anime)
        $query = Person::query()
            ->select('people.*')
            ->selectSub(
                CharacterVoiceActor::query()
                    ->selectRaw('count(*)')
                    ->join('anime', 'anime.id', '=', 'character_voice_actor.anime_id')
                    ->whereColumn('character_voice_actor.person_id', 'people.id')
                    ->where('anime.is_adult', false)->whereNull('anime.hidden_at'),
                'role_count',
            )
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('character_voice_actor')
                    ->join('anime', 'anime.id', '=', 'character_voice_actor.anime_id')
                    ->whereColumn('character_voice_actor.person_id', 'people.id')
                    ->where('anime.is_adult', false)->whereNull('anime.hidden_at');
            });

        if ($search !== '') {
            $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $search).'%';
            $query->where(function ($q) use ($like) {
                $q->where('name_full', 'like', $like)
                    ->orWhere('name_native', 'like', $like);
            });
        }

        $people = $query
            ->orderByDesc('role_count')
            ->orderBy('name_full')
            ->paginate(48)
            ->withQueryString();

        return Inertia::render('PeopleIndexPage', [
            'people' => [
                'data' => $people->through(fn (Person $p) => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name_full' => $p->name_full,
                    'name_native' => $p->name_native,
                    'image_medium' => $p->image_medium,
                    'role_count' => (int) $p->role_count,
                ])->items(),
                'meta' => [
                    'current_page' => $people->currentPage(),
                    'last_page' => $people->lastPage(),
                    'total' => $people->total(),
                    'per_page' => $people->perPage(),
                ],
            ],
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function show(Request $request, Person $person): Response
    {
        $this->ensureFeatureEnabled($request);

        $perPage = 24;

        $rolesQuery = CharacterVoiceActor::query()
            ->select('character_voice_actor.*')
            ->join('anime', 'anime.id', '=', 'character_voice_actor.anime_id')
            ->where('character_voice_actor.person_id', $person->id)
            ->where('anime.is_adult', false)->whereNull('anime.hidden_at')
            ->with([
                'anime:id,slug,title_romaji,title_english,cover_image_large,cover_image_medium,format,season_year,average_score',
                'character:id,name_full,name_native,image_medium',
            ])
            ->orderByDesc('anime.popularity')
            ->orderByDesc('anime.season_year');

        $roles = $rolesQuery->paginate($perPage)->withQueryString();

        // Role counts (lifetime, restricted to non-adult anime)
        $totalRoles = CharacterVoiceActor::query()
            ->join('anime', 'anime.id', '=', 'character_voice_actor.anime_id')
            ->where('character_voice_actor.person_id', $person->id)
            ->where('anime.is_adult', false)->whereNull('anime.hidden_at')
            ->count();

        return Inertia::render('PersonDetailPage', [
            'person' => [
                'id' => $person->id,
                'slug' => $person->slug,
                'name_full' => $person->name_full,
                'name_native' => $person->name_native,
                'image_large' => $person->image_large,
                'image_medium' => $person->image_medium,
                'gender' => $person->gender,
                'birthdate' => $person->birthdate?->toDateString(),
                'site_url' => $person->site_url,
                'role_count' => $totalRoles,
            ],
            'roles' => [
                'data' => $roles->getCollection()->map(fn ($row) => [
                    'anime' => $row->anime ? [
                        'id' => $row->anime->id,
                        'slug' => $row->anime->slug,
                        'title_romaji' => $row->anime->title_romaji,
                        'title_english' => $row->anime->title_english,
                        'cover_image_large' => $row->anime->cover_image_large,
                        'cover_image_medium' => $row->anime->cover_image_medium,
                        'format' => $row->anime->format,
                        'season_year' => $row->anime->season_year,
                        'average_score' => \App\Models\Anime::normalizeScore($row->anime->average_score),
                    ] : null,
                    'character' => $row->character ? [
                        'id' => $row->character->id,
                        'name_full' => $row->character->name_full,
                        'name_native' => $row->character->name_native,
                        'image_medium' => $row->character->image_medium,
                    ] : null,
                    'language' => $row->language,
                ])->values(),
                'meta' => [
                    'current_page' => $roles->currentPage(),
                    'last_page' => $roles->lastPage(),
                    'total' => $roles->total(),
                    'per_page' => $roles->perPage(),
                ],
            ],
            'og' => [
                'title' => $person->name_full,
                'description' => "Browse anime roles voiced by {$person->name_full} on AniTrack.",
                'image' => $person->image_large ?: $person->image_medium,
                'url' => route('people.show', $person),
            ],
        ]);
    }
}
