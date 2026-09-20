<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

class Anime extends Model
{
    use HasFactory, Searchable;

    protected $table = 'anime';

    protected $fillable = [
        'anilist_id',
        'mal_id',
        'title_romaji',
        'title_english',
        'title_native',
        'slug',
        'title_synonyms',
        'format',
        'status',
        'season',
        'season_year',
        'source',
        'episodes',
        'duration',
        'episode_count_unknown',
        'aired_from',
        'aired_to',
        'synopsis',
        'synopsis_rewritten_at',
        'cover_image_large',
        'cover_image_medium',
        'cover_image_color',
        'banner_image',
        'trailer_url',
        'average_score',
        'mean_score',
        'bayesian_score',
        'popularity',
        'trending',
        'favourites',
        'is_adult',
        'anilist_updated_at',
        'synced_at',
        'refresh_excluded_at',
        'refresh_exclusion_reason',
    ];

    protected function casts(): array
    {
        return [
            'title_synonyms' => 'array',
            'episode_count_unknown' => 'boolean',
            'aired_from' => 'date',
            'aired_to' => 'date',
            'is_adult' => 'boolean',
            'anilist_updated_at' => 'datetime',
            'synced_at' => 'datetime',
            'synopsis_rewritten_at' => 'datetime',
            'refresh_excluded_at' => 'datetime',
        ];
    }

    /**
     * Minimum synopsis word count for a title page to be worth indexing.
     */
    public const MIN_INDEXABLE_SYNOPSIS_WORDS = 150;

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Whether the title page carries enough content to be indexed by search
     * engines. Thin pages (short or missing synopsis, no episode data, no
     * score) get a robots noindex and are left out of the sitemap.
     */
    public function isIndexable(): bool
    {
        if ($this->is_adult) {
            return false;
        }

        if ($this->synopsisWordCount() < self::MIN_INDEXABLE_SYNOPSIS_WORDS) {
            return false;
        }

        if (! $this->hasEpisodeData()) {
            return false;
        }

        return $this->average_score !== null && $this->average_score > 0;
    }

    public function synopsisWordCount(): int
    {
        $text = trim(strip_tags(str_replace('<br>', ' ', (string) $this->synopsis)));

        if ($text === '') {
            return 0;
        }

        return count(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: []);
    }

    /**
     * True when the title has a known episode count or at least one episode row.
     */
    public function hasEpisodeData(): bool
    {
        if ($this->episodes !== null && $this->episodes > 0) {
            return true;
        }

        if (array_key_exists('episode_list_exists', $this->attributes)) {
            return (bool) $this->attributes['episode_list_exists'];
        }

        if ($this->relationLoaded('episodeList')) {
            return $this->episodeList->isNotEmpty();
        }

        return $this->episodeList()->exists();
    }

    protected static function booted(): void
    {
        static::saving(function (Anime $anime) {
            if (! $anime->slug || $anime->isDirty(['title_english', 'title_romaji'])) {
                $anime->slug = static::generateUniqueSlug($anime);
            }
        });
    }

    public static function generateUniqueSlug(Anime $anime): string
    {
        $title = $anime->title_english ?: $anime->title_romaji;
        $base = Str::slug($title) ?: 'anime';

        $slug = $base;
        $counter = 2;

        while (static::where('slug', $slug)->where('id', '!=', $anime->id ?? 0)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    // Relationships

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'anime_genre');
    }

    public function studios(): BelongsToMany
    {
        return $this->belongsToMany(Studio::class, 'anime_studio')
            ->withPivot('is_main');
    }

    public function characters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class, 'anime_character')
            ->withPivot('role');
    }

    public function voiceActorEntries(): HasMany
    {
        return $this->hasMany(CharacterVoiceActor::class);
    }

    public function relations(): HasMany
    {
        return $this->hasMany(AnimeRelation::class);
    }

    public function airingSchedules(): HasMany
    {
        return $this->hasMany(AiringSchedule::class);
    }

    public function nextAiringEpisode(): HasOne
    {
        return $this->hasOne(AiringSchedule::class)
            ->where('airs_at', '>', now())
            ->orderBy('airs_at');
    }

    public function episodeList(): HasMany
    {
        return $this->hasMany(Episode::class);
    }

    public function userEntries(): HasMany
    {
        return $this->hasMany(UserAnimeList::class);
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(Recommendation::class);
    }

    public function externalIds(): HasMany
    {
        return $this->hasMany(ExternalId::class);
    }

    // Scopes

    public function scopeFinished(Builder $query): Builder
    {
        return $query->where('status', 'FINISHED');
    }

    public function scopeReleasing(Builder $query): Builder
    {
        return $query->where('status', 'RELEASING');
    }

    public function scopeForSeason(Builder $query, int $year, string $season): Builder
    {
        return $query->where('season_year', $year)->where('season', $season);
    }

    public function scopeByFormat(Builder $query, string $format): Builder
    {
        return $query->where('format', $format);
    }

    public function scopeAdultContent(Builder $query, bool $include = false): Builder
    {
        return $include ? $query : $query->where('is_adult', false);
    }

    /**
     * Anime whose local copy has not been refreshed from AniList recently
     * (never-synced rows included).
     */
    public function scopeStale(Builder $query, ?int $days = null): Builder
    {
        $days ??= (int) config('anilist.refresh.stale_after_days', 30);
        $cutoff = now()->subDays($days);

        return $query->where(function (Builder $q) use ($cutoff) {
            $q->whereNull('synced_at')->orWhere('synced_at', '<', $cutoff);
        });
    }

    /**
     * Anime the stale-refresh sweep is still allowed to fetch.
     */
    public function scopeRefreshable(Builder $query): Builder
    {
        return $query->whereNull('refresh_excluded_at');
    }

    public function scopeRefreshExcluded(Builder $query): Builder
    {
        return $query->whereNotNull('refresh_excluded_at');
    }

    // Score normalization (stored 0-100, displayed 0-10)

    public static function normalizeScore(?int $score): ?float
    {
        return $score !== null ? round($score / 10, 1) : null;
    }

    // Scout

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title_romaji' => $this->title_romaji,
            'title_english' => $this->title_english,
            'title_native' => $this->title_native,
            'title_synonyms' => $this->title_synonyms,
            'format' => $this->format,
            'status' => $this->status,
            'season_year' => $this->season_year,
        ];
    }
}
