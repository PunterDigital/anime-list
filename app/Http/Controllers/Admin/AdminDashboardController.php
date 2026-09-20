<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Anime;
use App\Models\SyncRun;
use App\Models\User;
use App\Models\UserAnimeList;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_users' => User::count(),
            'new_users_this_month' => User::where('created_at', '>=', now()->startOfMonth())->count(),
            'total_anime' => Anime::count(),
            'total_list_entries' => UserAnimeList::count(),
            'total_episodes_watched' => (int) UserAnimeList::sum('progress'),
            'active_users_today' => UserAnimeList::where('updated_at', '>=', now()->startOfDay())
                ->distinct('user_id')
                ->count('user_id'),
            'thin_content_anime' => Anime::query()->thinContent()->count(),
            'thin_content_min_words' => Anime::MIN_INDEXABLE_SYNOPSIS_WORDS,
        ];

        $recentUsers = User::query()
            ->select(['id', 'name', 'username', 'email', 'avatar_url', 'is_admin', 'created_at'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'is_admin' => $user->is_admin,
                'created_at' => $user->created_at->toIso8601String(),
            ]);

        $syncStatuses = [
            'releasing' => $this->latestStatus(SyncRun::MODE_TARGETED, 'RELEASING'),
            'incremental' => $this->latestStatus(SyncRun::MODE_INCREMENTAL),
            'schedule' => $this->latestStatus(SyncRun::MODE_SCHEDULE),
        ];

        return Inertia::render('Admin/DashboardPage', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'syncStatuses' => $syncStatuses,
        ]);
    }

    private function latestStatus(string $mode, ?string $label = null): string
    {
        return SyncRun::query()
            ->where('mode', $mode)
            ->when($label !== null, fn ($q) => $q->where('label', $label))
            ->orderByDesc('id')
            ->value('status') ?? 'never run';
    }
}
