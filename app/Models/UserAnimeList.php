<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAnimeList extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_WATCHING = 'watching';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_ON_HOLD = 'on_hold';

    public const STATUS_DROPPED = 'dropped';

    public const STATUS_PLAN_TO_WATCH = 'plan_to_watch';

    public const STATUSES = [
        self::STATUS_WATCHING,
        self::STATUS_COMPLETED,
        self::STATUS_ON_HOLD,
        self::STATUS_DROPPED,
        self::STATUS_PLAN_TO_WATCH,
    ];

    protected $fillable = [
        'user_id',
        'anime_id',
        'status',
        'score',
        'progress',
        'rewatch_count',
        'started_at',
        'completed_at',
        'notes',
        'tags',
        'is_private',
        'is_rewatching',
    ];

    protected function casts(): array
    {
        return [
            'score' => 'integer',
            'progress' => 'integer',
            'rewatch_count' => 'integer',
            'started_at' => 'date',
            'completed_at' => 'date',
            'tags' => 'array',
            'is_private' => 'boolean',
            'is_rewatching' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function anime(): BelongsTo
    {
        return $this->belongsTo(Anime::class);
    }

    public function getDisplayScoreAttribute(): ?int
    {
        return $this->score;
    }
}
