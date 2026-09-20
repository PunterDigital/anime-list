<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Anime;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAnimeController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Anime::query()
            ->select([
                'id',
                'slug',
                'title_romaji',
                'title_english',
                'format',
                'status',
                'season',
                'season_year',
                'cover_image_medium',
                'synopsis',
                'synopsis_word_count',
                'synopsis_rewritten_at',
            ]);

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title_english', 'like', "%{$search}%")
                    ->orWhere('title_romaji', 'like', "%{$search}%")
                    ->orWhere('title_native', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('rewritten_only')) {
            $query->whereNotNull('synopsis_rewritten_at');
        }

        if ($request->boolean('thin_only')) {
            $query->thinContent();
        }

        $paginator = $query
            ->orderByDesc('popularity')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Anime $a) => [
                'id' => $a->id,
                'slug' => $a->slug,
                'title' => $a->title_english ?: $a->title_romaji,
                'title_secondary' => $a->title_english ? $a->title_romaji : null,
                'format' => $a->format,
                'status' => $a->status,
                'season' => $a->season,
                'season_year' => $a->season_year,
                'cover_image_medium' => $a->cover_image_medium,
                'synopsis_excerpt' => $a->synopsis
                    ? \Illuminate\Support\Str::limit(strip_tags($a->synopsis), 140)
                    : null,
                'synopsis_word_count' => $a->synopsis_word_count,
                'is_thin' => $a->hasThinContent(),
                'synopsis_rewritten_at' => $a->synopsis_rewritten_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/AnimeListPage', [
            'anime' => [
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
                'links' => [
                    'first' => $paginator->url(1),
                    'last' => $paginator->url($paginator->lastPage()),
                    'prev' => $paginator->previousPageUrl(),
                    'next' => $paginator->nextPageUrl(),
                ],
            ],
            'filters' => [
                'search' => $search ?: null,
                'rewritten_only' => $request->boolean('rewritten_only'),
                'thin_only' => $request->boolean('thin_only'),
            ],
            'thin_content' => [
                'min_words' => Anime::MIN_INDEXABLE_SYNOPSIS_WORDS,
                'total' => Anime::query()->thinContent()->count(),
            ],
        ]);
    }

    public function edit(Anime $anime): Response
    {
        return Inertia::render('Admin/AnimeEditPage', [
            'anime' => [
                'id' => $anime->id,
                'slug' => $anime->slug,
                'title_english' => $anime->title_english,
                'title_romaji' => $anime->title_romaji,
                'title_native' => $anime->title_native,
                'cover_image_medium' => $anime->cover_image_medium,
                'format' => $anime->format,
                'status' => $anime->status,
                'season' => $anime->season,
                'season_year' => $anime->season_year,
                'synopsis' => $anime->synopsis,
                'synopsis_word_count' => $anime->synopsis_word_count,
                'is_thin' => $anime->hasThinContent(),
                'synopsis_rewritten_at' => $anime->synopsis_rewritten_at?->toIso8601String(),
            ],
            'min_words' => Anime::MIN_INDEXABLE_SYNOPSIS_WORDS,
        ]);
    }

    public function update(Request $request, Anime $anime): RedirectResponse
    {
        $validated = $request->validate([
            'synopsis' => ['required', 'string', 'min:10', 'max:10000'],
        ]);

        $anime->forceFill([
            'synopsis' => $validated['synopsis'],
            'synopsis_rewritten_at' => now(),
        ])->save();

        \Illuminate\Support\Facades\Cache::forget("anime:v3:{$anime->id}");

        return redirect()
            ->route('admin.anime.edit', $anime)
            ->with('message', 'Description saved.');
    }

    public function reset(Anime $anime): RedirectResponse
    {
        $anime->forceFill([
            'synopsis_rewritten_at' => null,
        ])->save();

        \Illuminate\Support\Facades\Cache::forget("anime:v3:{$anime->id}");

        return back()->with('message', 'Reverted to auto-synced description. The next sync will overwrite it.');
    }
}
