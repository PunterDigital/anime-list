<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Person extends Model
{
    use HasFactory;

    protected $table = 'people';

    protected $fillable = [
        'anilist_id',
        'name_full',
        'name_native',
        'slug',
        'image_large',
        'image_medium',
        'gender',
        'birthdate',
        'site_url',
    ];

    protected function casts(): array
    {
        return [
            'birthdate' => 'date',
            'role_count' => 'integer',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (Person $person) {
            if (! $person->slug || $person->isDirty('name_full')) {
                $person->slug = static::generateUniqueSlug($person);
            }
        });
    }

    public static function generateUniqueSlug(Person $person): string
    {
        $base = Str::slug($person->name_full) ?: 'person';

        $slug = $base;
        $counter = 2;

        while (static::where('slug', $slug)->where('id', '!=', $person->id ?? 0)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    public function voiceActorEntries(): HasMany
    {
        return $this->hasMany(CharacterVoiceActor::class);
    }
}
