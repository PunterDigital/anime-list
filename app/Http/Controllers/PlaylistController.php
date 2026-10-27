<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePlaylistRequest;
use App\Http\Requests\UpdatePlaylistRequest;
use App\Http\Resources\PlaylistCardResource;
use App\Http\Resources\PlaylistItemResource;
use App\Http\Resources\PlaylistResource;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Services\FeatureFlagService;
use App\Services\PlaylistService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlaylistController extends Controller
{
    public function __construct(
        private readonly PlaylistService $playlistService,
        private readonly FeatureFlagService $featureFlags,
    ) {}

    private function ensureFeatureEnabled(?Request $request = null): void
    {
        $user = $request?->user();
        if (! $this->featureFlags->active('playlists', $user)) {
            abort(404);
        }
    }

    public function index(Request $request): Response
    {
        $this->ensureFeatureEnabled($request);
        $playlists = $this->playlistService->getUserPlaylists($request->user());

        return Inertia::render('PlaylistsIndexPage', [
            'playlists' => PlaylistCardResource::collection($playlists),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->ensureFeatureEnabled($request);

        return Inertia::render('PlaylistEditPage', [
            'playlist' => null,
        ]);
    }

    public function show(Playlist $playlist, Request $request): Response
    {
        if (! $this->featureFlags->active('playlists', $playlist->user)) {
            abort(404);
        }

        if (! $playlist->is_public && $request->user()?->id !== $playlist->user_id) {
            abort(403);
        }

        $this->playlistService->getPlaylistWithItems($playlist);

        return Inertia::render('PlaylistDetailPage', [
            'playlist' => new PlaylistResource($playlist),
            'isOwner' => $request->user()?->id === $playlist->user_id,
        ]);
    }

    public function edit(Playlist $playlist, Request $request): Response
    {
        $this->ensureFeatureEnabled($request);
        abort_if($request->user()->id !== $playlist->user_id, 403);

        $this->playlistService->getPlaylistWithItems($playlist);

        return Inertia::render('PlaylistEditPage', [
            'playlist' => new PlaylistResource($playlist),
        ]);
    }

    public function store(StorePlaylistRequest $request): JsonResponse
    {
        $this->ensureFeatureEnabled($request);
        $playlist = $this->playlistService->store($request->user(), $request->validated());

        return response()->json([
            'playlist' => new PlaylistResource($playlist->load('user:id,username,avatar_url')),
        ], 201);
    }

    public function update(UpdatePlaylistRequest $request, Playlist $playlist): JsonResponse
    {
        $this->ensureFeatureEnabled($request);
        $playlist->update($request->validated());

        return response()->json([
            'playlist' => new PlaylistResource($playlist->load(['user:id,username,avatar_url', 'items.anime'])),
        ]);
    }

    public function destroy(Request $request, Playlist $playlist): JsonResponse
    {
        $this->ensureFeatureEnabled($request);
        abort_if($request->user()->id !== $playlist->user_id, 403);

        $playlist->delete();

        return response()->json(null, 204);
    }

    public function addItem(Request $request, Playlist $playlist): JsonResponse
    {
        $this->ensureFeatureEnabled($request);
        abort_if($request->user()->id !== $playlist->user_id, 403);

        $request->validate([
            'anime_id' => ['required', 'integer', 'exists:anime,id'],
            'note' => ['nullable', 'string', 'max:500'],
            'is_optional' => ['boolean'],
        ]);

        $item = $this->playlistService->addItem(
            $playlist,
            $request->input('anime_id'),
            $request->input('note'),
            $request->boolean('is_optional'),
        );

        $item->load('anime:id,slug,title_romaji,title_english,cover_image_medium,cover_image_large,cover_image_color,format,status,episodes,average_score,season,season_year,anilist_id');
        $item->load('anime.genres');

        return response()->json(new PlaylistItemResource($item), 201);
    }

    public function updateItem(Request $request, Playlist $playlist, PlaylistItem $item): JsonResponse
    {
        $this->ensureFeatureEnabled($request);
        abort_if($request->user()->id !== $playlist->user_id, 403);
        abort_if($item->playlist_id !== $playlist->id, 404);

        $request->validate([
            'note' => ['nullable', 'string', 'max:500'],
            'is_optional' => ['sometimes', 'boolean'],
        ]);

        $item->update($request->only(['note', 'is_optional']));

        return response()->json(new PlaylistItemResource($item->load('anime')));
    }

    public function removeItem(Request $request, Playlist $playlist, PlaylistItem $item): JsonResponse
    {
        $this->ensureFeatureEnabled($request);
        abort_if($request->user()->id !== $playlist->user_id, 403);
        abort_if($item->playlist_id !== $playlist->id, 404);

        $item->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request, Playlist $playlist): JsonResponse
    {
        $this->ensureFeatureEnabled($request);
        abort_if($request->user()->id !== $playlist->user_id, 403);

        $request->validate([
            'item_ids' => ['required', 'array'],
            'item_ids.*' => ['integer'],
        ]);

        $this->playlistService->reorder($playlist, $request->input('item_ids'));

        return response()->json(null, 204);
    }
}
