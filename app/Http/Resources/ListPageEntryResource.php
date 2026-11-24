<?php

namespace App\Http\Resources;

use App\Models\Anime;
use Illuminate\Http\Request;

/**
 * A list entry for the My List and public list pages (card 5718): the
 * entry as ListEntryResource sends it, with only the anime fields those
 * pages show, filter and sort by. The API (/api/v1/list, the extension)
 * keeps the full ListEntryResource.
 */
class ListPageEntryResource extends ListEntryResource
{
    public function toArray(Request $request): array
    {
        $entry = parent::toArray($request);
        $anime = $this->relationLoaded('anime') ? $this->anime : null;

        $entry['anime'] = $anime ? [
            'id' => $anime->id,
            'slug' => $anime->slug,
            'title_romaji' => $anime->title_romaji,
            'title_english' => $anime->title_english,
            'format' => $anime->format,
            'season' => $anime->season,
            'season_year' => $anime->season_year,
            'episodes' => $anime->episodes,
            'cover_image_large' => $anime->cover_image_large,
            'cover_image_medium' => $anime->cover_image_medium,
            'cover_image_color' => $anime->cover_image_color,
            'average_score' => Anime::normalizeScore($anime->average_score),
            'genres' => $anime->relationLoaded('genres')
                ? $anime->genres->map(fn ($g) => ['id' => $g->id, 'name' => $g->name])->all()
                : [],
        ] : null;

        return $entry;
    }
}
