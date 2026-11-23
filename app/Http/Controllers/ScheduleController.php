<?php

namespace App\Http\Controllers;

use App\Http\Resources\ScheduleDayResource;
use App\Models\AiringSchedule;
use App\Models\UserAnimeList;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $week = max(0, min(1, (int) $request->query('week', 0)));
        $myListOnly = $request->boolean('my_list') && auth()->check();

        $weekStart = now()->startOfWeek(Carbon::MONDAY)->addWeeks($week)->startOfDay();
        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        $query = AiringSchedule::query()
            ->with(['anime:id,slug,title_romaji,title_english,cover_image_medium,cover_image_color,average_score,format,episodes', 'anime.genres'])
            ->whereBetween('airs_at', [$weekStart, $weekEnd])
            // Card 5719: the airing sync stores rows for every title in the
            // catalogue, adult ones included. Leave out adult, admin-NSFW and
            // hidden titles like the catalogue pages do; on "My list" an NSFW
            // title the viewer added themselves stays, as on their list.
            ->whereHas('anime', fn ($q) => $myListOnly
                ? $q->where('is_adult', false)->visible()
                : $q->safeForWork()->visible())
            ->orderBy('airs_at');

        if ($myListOnly) {
            $listAnimeIds = UserAnimeList::where('user_id', auth()->id())
                ->pluck('anime_id');
            $query->whereIn('anime_id', $listAnimeIds);
        }

        $schedules = $query->get();

        $grouped = $schedules
            ->groupBy(fn ($s) => $s->airs_at->toDateString())
            ->map(fn ($day) => ScheduleDayResource::collection($day));

        return Inertia::render('SchedulePage', [
            'days' => $grouped,
            'weekOffset' => $week,
            'weekStart' => $weekStart->toIso8601String(),
            'weekEnd' => $weekEnd->toIso8601String(),
            'myListOnly' => $myListOnly,
            'isAuth' => auth()->check(),
        ]);
    }
}
