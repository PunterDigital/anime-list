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
    public function show(User $user): Response
    {
        $stats = $user->animeList()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $scoreData = $user->animeList()
            ->whereNotNull('score')
            ->where('score', '>', 0)
            ->selectRaw('AVG(score) as avg_score, COUNT(*) as scored_count')
            ->first();

        $episodesWatched = (int) $user->animeList()->sum('progress');

        return Inertia::render('ProfilePage', [
            'profile' => new UserProfileResource($user),
            'stats' => $stats,
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
