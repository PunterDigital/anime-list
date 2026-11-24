<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreListEntryRequest;
use App\Http\Requests\UpdateListEntryRequest;
use App\Http\Resources\ListEntryResource;
use App\Models\Anime;
use App\Models\UserAnimeList;
use App\Services\UserListService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ListController extends Controller
{
    public const DEFAULT_PER_PAGE = 100;

    public const MAX_PER_PAGE = 500;

    public function __construct(
        private readonly UserListService $listService,
    ) {}

    /**
     * Return the authenticated user's list entries, optionally filtered by status.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'string', Rule::in(UserAnimeList::STATUSES)],
            // Card 5718: optional paging. Without page/per_page the whole list
            // comes back as before, so older extension versions keep working.
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
        ]);

        $query = $request->user()->animeList()
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->with(['anime:id,slug,anilist_id,title_romaji,title_english,format,episodes,cover_image_large,cover_image_medium,cover_image_color,average_score,bayesian_score,popularity,status', 'anime.genres'])
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        if (! isset($validated['page']) && ! isset($validated['per_page'])) {
            $entries = $query->get();

            return response()->json([
                'data' => ListEntryResource::collection($entries)->resolve($request),
                'total' => $entries->count(),
            ]);
        }

        $page = $query->paginate((int) ($validated['per_page'] ?? self::DEFAULT_PER_PAGE));

        return response()->json([
            'data' => ListEntryResource::collection($page->getCollection())->resolve($request),
            'total' => $page->total(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
            ],
        ]);
    }

    /**
     * Fetch a single list entry by anime ID — used by the Chrome extension to
     * show the current list state for the page the user is on.
     */
    public function showByAnime(Request $request, Anime $anime): JsonResponse
    {
        $entry = $request->user()->animeList()
            ->where('anime_id', $anime->id)
            ->with(['anime.genres'])
            ->first();

        if (! $entry) {
            return response()->json(['message' => 'No list entry for this anime.'], 404);
        }

        return response()->json(new ListEntryResource($entry));
    }

    public function store(StoreListEntryRequest $request): JsonResponse
    {
        $entry = $this->listService->store($request->user(), $request->validated());
        $entry->load('anime.genres');

        return response()->json(new ListEntryResource($entry), 201);
    }

    public function update(UpdateListEntryRequest $request, UserAnimeList $entry): JsonResponse
    {
        $entry = $this->listService->update($entry, $request->validated());
        $entry->load('anime.genres');

        return response()->json(new ListEntryResource($entry));
    }

    public function destroy(Request $request, UserAnimeList $entry): JsonResponse
    {
        abort_if($entry->user_id !== $request->user()->id, 403);

        $this->listService->delete($entry);

        return response()->json(null, 204);
    }
}
