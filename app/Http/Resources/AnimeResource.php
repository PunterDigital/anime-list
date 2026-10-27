<?php

namespace App\Http\Resources;

use App\Models\Anime;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnimeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'anilist_id' => $this->anilist_id,
            'mal_id' => $this->mal_id,
            'title_romaji' => $this->title_romaji,
            'title_english' => $this->title_english,
            'title_native' => $this->title_native,
            'title_synonyms' => $this->title_synonyms,
            'format' => $this->format,
            'status' => $this->status,
            'season' => $this->season,
            'season_year' => $this->season_year,
            'source' => $this->source,
            'episodes' => $this->episodes,
            'duration' => $this->duration,
            'episode_count_unknown' => $this->episode_count_unknown,
            'aired_from' => $this->aired_from?->toDateString(),
            'aired_to' => $this->aired_to?->toDateString(),
            'synopsis' => self::synopsisHtml($this->synopsis),
            'cover_image_large' => $this->cover_image_large,
            'cover_image_medium' => $this->cover_image_medium,
            'cover_image_color' => $this->cover_image_color,
            'banner_image' => $this->banner_image,
            'trailer_url' => $this->trailer_url,
            'average_score' => Anime::normalizeScore($this->average_score),
            'mean_score' => Anime::normalizeScore($this->mean_score),
            'bayesian_score' => Anime::normalizeScore($this->bayesian_score),
            'popularity' => $this->popularity,
            'trending' => $this->trending,
            'favourites' => $this->favourites,
            'is_adult' => $this->is_adult,
            'genres' => GenreResource::collection($this->whenLoaded('genres')),
            'studios' => StudioResource::collection($this->whenLoaded('studios')),
            'characters' => CharacterResource::collection($this->whenLoaded('characters')),
            'external_ids' => ExternalIdResource::collection($this->whenLoaded('externalIds')),
            'airing_schedules' => AiringScheduleResource::collection($this->whenLoaded('airingSchedules')),
            'episodes_list' => EpisodeResource::collection($this->whenLoaded('episodeList')),
            'next_airing_episode' => $this->whenLoaded('nextAiringEpisode', function () {
                return $this->nextAiringEpisode
                    ? new AiringScheduleResource($this->nextAiringEpisode)
                    : null;
            }),
            'relations' => AnimeRelationResource::collection($this->whenLoaded('relations')),
        ];
    }

    /**
     * The synopsis is rendered with v-html, so keep only a few formatting tags,
     * and none of their attributes: strip_tags() leaves `<p onclick="...">` alone.
     */
    public static function synopsisHtml(?string $synopsis): ?string
    {
        if ($synopsis === null) {
            return null;
        }

        $html = strip_tags($synopsis, '<br><i><b><em><strong><p>');

        return preg_replace(
            '/<(\/?)(br|i|b|em|strong|p)\b(?:[^>"\']|"[^"]*"|\'[^\']*\')*>/i',
            '<$1$2>',
            $html,
        );
    }
}
