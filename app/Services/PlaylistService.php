<?php

namespace App\Services;

use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PlaylistService
{
    public function getUserPlaylists(User $user): Collection
    {
        return $user->playlists()
            ->with(['items.anime:id,slug,title_romaji,title_english,cover_image_medium'])
            ->withCount('items')
            ->latest()
            ->get();
    }

    public function getPlaylistWithItems(Playlist $playlist): Playlist
    {
        return $playlist->load([
            'user:id,username,avatar_url',
            'items.anime:id,slug,title_romaji,title_english,cover_image_medium,cover_image_large,cover_image_color,format,status,episodes,average_score,season,season_year,anilist_id',
            'items.anime.genres',
        ]);
    }

    public function store(User $user, array $data): Playlist
    {
        return $user->playlists()->create([
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'is_public' => $data['is_public'] ?? false,
        ]);
    }

    public function addItem(Playlist $playlist, int $animeId, ?string $note = null, bool $isOptional = false): PlaylistItem
    {
        $maxPosition = $playlist->items()->max('position') ?? 0;

        return $playlist->items()->create([
            'anime_id' => $animeId,
            'position' => $maxPosition + 1,
            'note' => $note,
            'is_optional' => $isOptional,
        ]);
    }

    public function reorder(Playlist $playlist, array $itemIds): void
    {
        $existingIds = $playlist->items()->pluck('id')->sort()->values()->all();
        $submittedIds = collect($itemIds)->map(fn ($id) => (int) $id)->sort()->values()->all();

        if ($existingIds !== $submittedIds) {
            abort(422, 'Item IDs do not match the playlist items.');
        }

        DB::transaction(function () use ($playlist, $itemIds) {
            foreach ($itemIds as $position => $itemId) {
                $playlist->items()->where('id', $itemId)->update(['position' => $position + 1]);
            }
        });
    }
}
