<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserProfileResource;
use App\Models\User;
use App\Services\UserListService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request, User $user): Response
    {
        $isOwner = $request->user()?->is($user) ?? false;

        // Stats come from the list, so they follow its privacy (card 5529): a
        // private list shows none to others, and private entries never count
        // for anyone but the owner.
        if (! $isOwner && ! $user->list_is_public) {
            return Inertia::render('ProfilePage', [
                'profile' => new UserProfileResource($user),
                'stats_hidden' => true,
                'stats' => (object) [],
                'avg_score' => null,
                'episodes_watched' => 0,
            ]);
        }

        $entries = fn () => $user->animeList()
            ->when(! $isOwner, fn ($query) => $query->where('is_private', false));

        $stats = $entries()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $scoreData = $entries()
            ->whereNotNull('score')
            ->where('score', '>', 0)
            ->selectRaw('AVG(score) as avg_score, COUNT(*) as scored_count')
            ->first();

        $episodesWatched = (int) $entries()->sum('progress');

        return Inertia::render('ProfilePage', [
            'profile' => new UserProfileResource($user),
            'stats_hidden' => false,
            'stats' => (object) $stats,
            'avg_score' => $scoreData?->avg_score ? round($scoreData->avg_score, 2) : null,
            'episodes_watched' => $episodesWatched,
        ]);
    }

    public function list(Request $request, User $user, UserListService $listService): Response
    {
        if (! $user->list_is_public) {
            return Inertia::render('PublicListPage', [
                'profile' => new UserProfileResource($user),
                'is_public' => false,
                'entries' => [],
                'counts' => (object) [],
            ]);
        }

        $data = $listService->getPublicListForPage($user, includeNsfw: $request->user() !== null);

        return Inertia::render('PublicListPage', [
            'profile' => new UserProfileResource($user),
            'is_public' => true,
            ...$data,
        ]);
    }
}
