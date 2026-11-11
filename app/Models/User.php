<?php

namespace App\Models;

use App\Services\AnimeRatingService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passkeys\Contracts\PasskeyUser;
use Laravel\Passkeys\PasskeyAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements PasskeyUser
{
    use HasApiTokens, HasFactory, Notifiable, PasskeyAuthenticatable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'avatar_url',
        'bio',
        'timezone',
        'mal_id',
        'mal_username',
        'is_admin',
        'list_is_public',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mal_access_token',
        'mal_refresh_token',
    ];

    protected static function booted(): void
    {
        // Card 4476: a deleted account's scores leave the AniTrack rating
        // (and come back if the account is restored).
        $forgetRatings = function (User $user): void {
            $user->animeList()
                ->where('score', '>', 0)
                ->pluck('anime_id')
                ->each(fn (int $animeId) => AnimeRatingService::forget($animeId));
        };

        static::deleted($forgetRatings);
        static::restored($forgetRatings);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'mal_token_expires_at' => 'datetime',
            'is_admin' => 'boolean',
            'list_is_public' => 'boolean',
        ];
    }

    public function animeList(): HasMany
    {
        return $this->hasMany(UserAnimeList::class);
    }

    public function recommendationVotes(): HasMany
    {
        return $this->hasMany(RecommendationVote::class);
    }

    public function playlists(): HasMany
    {
        return $this->hasMany(Playlist::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    public function hasRole(string $slug): bool
    {
        return $this->roles->contains('slug', $slug);
    }
}
