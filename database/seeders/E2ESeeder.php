<?php

namespace Database\Seeders;

use App\Models\Anime;
use App\Models\Recommendation;
use App\Models\User;
use App\Services\FeatureFlagService;
use Illuminate\Database\Seeder;

/**
 * Data for the Playwright E2E suite (tests/e2e). Runs against a throwaway
 * SQLite file, never a real database.
 */
class E2ESeeder extends Seeder
{
    public const USER_EMAIL = 'e2e@example.com';

    public const USER_PASSWORD = 'e2e-password';

    public const HIDDEN_SLUG = 'hidden-e2e-show';

    public function run(): void
    {
        User::factory()->create([
            'name' => 'E2E User',
            'username' => 'e2e-user',
            'email' => self::USER_EMAIL,
            'password' => self::USER_PASSWORD,
        ]);

        $titles = [
            ['Frieren Beyond Journeys End', 'Sousou no Frieren'],
            ['Cowboy Bebop', 'Cowboy Bebop'],
            ['Mob Psycho 100', 'Mob Psycho 100'],
        ];

        foreach ($titles as $i => [$english, $romaji]) {
            Anime::factory()->finished()->create([
                'title_english' => $english,
                'title_romaji' => $romaji,
                'format' => 'TV',
                'episodes' => 12,
                // The CSP only allows AniList image hosts, so no placeholder URLs.
                'cover_image_large' => null,
                'cover_image_medium' => null,
                'banner_image' => null,
                // Formatting tags with attributes: the page must keep the tags and drop the attributes.
                'synopsis' => '<p onclick="window.synopsisClicked = true" style="color: red">'
                    .str_repeat("A story used by the end-to-end tests ({$english}). ", 20)
                    ."<i class=\"seed\" title=\"x\">{$english}</i></p>",
                'popularity' => 300_000 - $i * 1000,
                'trending' => 900 - $i * 10,
            ]);
        }

        // A page hidden by an admin (451), recommending two of the anime above.
        $hidden = Anime::factory()->finished()->create([
            'title_english' => 'Hidden E2E Show',
            'title_romaji' => 'Hidden E2E Show',
            'slug' => self::HIDDEN_SLUG,
            'cover_image_large' => null,
            'cover_image_medium' => null,
            'banner_image' => null,
            'synopsis' => 'Hidden synopsis that must never be shown.',
            'hidden_at' => now(),
            'hidden_reason' => 'E2E takedown',
        ]);
        foreach (['cowboy-bebop' => 90, 'mob-psycho-100' => 50] as $slug => $rating) {
            Recommendation::create([
                'anime_id' => $hidden->id,
                'recommended_anime_id' => Anime::where('slug', $slug)->value('id'),
                'source' => 'anilist',
                'rating' => $rating,
            ]);
        }

        app(FeatureFlagService::class)->setGlobalStatus('error-pages', 'everyone');
    }
}
