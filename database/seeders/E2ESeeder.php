<?php

namespace Database\Seeders;

use App\Models\Anime;
use App\Models\BlogPost;
use App\Models\Recommendation;
use App\Models\User;
use App\Models\UserAnimeList;
use App\Services\FeatureFlagService;
use App\Support\LegacyPasskeys;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Data for the Playwright E2E suite (tests/e2e). Runs against a throwaway
 * SQLite file, never a real database.
 */
class E2ESeeder extends Seeder
{
    public const USER_EMAIL = 'e2e@example.com';

    public const USER_PASSWORD = 'e2e-password';

    public const HIDDEN_SLUG = 'hidden-e2e-show';

    public const ADMIN_EMAIL = 'e2e-admin@example.com';

    public const NSFW_SLUG = 'nsfw-e2e-show';

    public const RATED_SLUG = 'rated-e2e-show';

    public const UNRATED_SLUG = 'unrated-e2e-show';

    public const BLOG_SLUG = 'welcome-to-the-anitrack-blog';

    public const BLOG_DRAFT_SLUG = 'unfinished-draft';

    public const SLUGLESS_TITLE = 'Slugless E2E Show';

    public const LEGACY_PASSKEY_EMAIL = 'e2e-legacy-passkey@example.com';

    public const LEGACY_PASSKEY_CREDENTIAL_ID = '_JTjK-fK6TE2NI77Mj8BFUmBk4D18Sg97vlLV-cxxL0';

    // Laragear's user handle: a UUID as 32 hex characters.
    public const LEGACY_PASSKEY_USER_HANDLE = '693d1b8f955849aabef1ab5395fd411e';

    // Public half of the throwaway P-256 test key in tests/e2e/passkeys.spec.ts.
    public const LEGACY_PASSKEY_PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n"
        ."MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEvDm2vZla8G0c8esCra23e2Ew2rF\n"
        ."uvymgowsL1axU0gTA1itq97YMfgrrisHqE3TWXB7u+Y59qxPAc63aTuJWQ==\n"
        ."-----END PUBLIC KEY-----\n";

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

        // Card 4198: an admin, and a title nsfw.spec.ts marks NSFW.
        User::factory()->admin()->create([
            'name' => 'E2E Admin',
            'username' => 'e2e-admin',
            'email' => self::ADMIN_EMAIL,
            'password' => self::USER_PASSWORD,
        ]);
        Anime::factory()->finished()->create([
            'title_english' => 'Nsfw E2E Show',
            'title_romaji' => 'Nsfw E2E Show',
            'slug' => self::NSFW_SLUG,
            'format' => 'TV',
            'episodes' => 12,
            'cover_image_large' => null,
            'cover_image_medium' => null,
            'banner_image' => null,
            'synopsis' => 'A show the NSFW end-to-end test marks.',
            'popularity' => 1000,
        ]);

        // Card 4476: the AniTrack rating. Ten users score one title (8.4 on
        // average) and nine score another (too few, "No Rating Yet"). Their
        // own titles, so the smoke spec's list edits never move these numbers.
        app(FeatureFlagService::class)->setGlobalStatus('anitrack-rating', 'everyone');
        $rated = $this->ratingTitle('Rated E2E Show', self::RATED_SLUG);
        $unrated = $this->ratingTitle('Unrated E2E Show', self::UNRATED_SLUG);
        foreach ([8, 8, 8, 8, 8, 8, 9, 9, 9, 9] as $i => $score) {
            $rater = User::factory()->create([
                'name' => "E2E Rater {$i}",
                'username' => "e2e-rater-{$i}",
                'email' => "e2e-rater-{$i}@example.com",
            ]);
            // Private entries count too; only the average and the count are shown.
            $rater->animeList()->create([
                'anime_id' => $rated->id,
                'status' => UserAnimeList::STATUS_COMPLETED,
                'score' => $score,
                'is_private' => $i % 2 === 0,
            ]);
            if ($i < 9) {
                $rater->animeList()->create([
                    'anime_id' => $unrated->id,
                    'status' => UserAnimeList::STATUS_COMPLETED,
                    'score' => $score,
                ]);
            }
        }
        // An entry without a score doesn't count.
        User::where('email', self::USER_EMAIL)->firstOrFail()->animeList()->create([
            'anime_id' => $unrated->id,
            'status' => UserAnimeList::STATUS_PLAN_TO_WATCH,
            'score' => 0,
        ]);

        // Card 4481: the public blog. One published post and one draft
        // (blog-public.spec.ts, ssr.spec.ts); blog-admin.spec.ts adds and
        // deletes its own posts next to them.
        app(FeatureFlagService::class)->setGlobalStatus('blog', 'everyone');
        $admin = User::where('email', self::ADMIN_EMAIL)->firstOrFail();
        $published = BlogPost::factory()->create([
            'title' => 'Welcome to the AniTrack Blog',
            'slug' => self::BLOG_SLUG,
            'excerpt' => 'What we will write about here.',
            'body' => "## What to expect\n\nSeasonal picks, guides and **news**.\n\n### Staying in touch\n\nFollow the feed.",
            'seo_title' => 'Welcome to the AniTrack Blog (SEO)',
            'meta_description' => 'Seasonal picks, guides and news from AniTrack.',
        ]);
        $published->forceFill([
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
            'author_id' => $admin->id,
        ])->save();
        BlogPost::factory()->create([
            'title' => 'Unfinished Draft',
            'slug' => self::BLOG_DRAFT_SLUG,
        ])->forceFill(['author_id' => $admin->id])->save();

        // Card 4505: a title without a slug (some AniList entries have none);
        // its admin edit page crashed on route('anime.show').
        // Model events always fill a slug, so it's cleared with a query
        // update, as a bulk write would leave it.
        $slugless = Anime::factory()->finished()->create([
            'title_english' => self::SLUGLESS_TITLE,
            'title_romaji' => self::SLUGLESS_TITLE,
            'slug' => null,
            'format' => 'TV',
            'episodes' => 12,
            'cover_image_large' => null,
            'cover_image_medium' => null,
            'banner_image' => null,
            'synopsis' => 'A title without a slug.',
            'popularity' => 1,
        ]);
        Anime::query()->whereKey($slugless->id)->update(['slug' => null]);

        $this->seedLegacyPasskey();
    }

    /**
     * Card 4237: a passkey as laragear/webauthn stored it, copied to
     * `passkeys` by the same code the production migration runs.
     * `passkeys.spec.ts` gives a virtual authenticator the matching private
     * key (a throwaway test key, see the spec) and signs in with it on
     * http://localhost (WebAuthn refuses an IP address as RP ID).
     */
    private function seedLegacyPasskey(): void
    {
        $user = User::factory()->create([
            'name' => 'Legacy Passkey',
            'username' => 'legacy_passkey',
            'email' => self::LEGACY_PASSKEY_EMAIL,
        ]);

        DB::table('webauthn_credentials')->insert([
            'id' => self::LEGACY_PASSKEY_CREDENTIAL_ID,
            'authenticatable_type' => User::class,
            'authenticatable_id' => $user->id,
            'user_id' => self::LEGACY_PASSKEY_USER_HANDLE,
            'alias' => 'Old laptop',
            'counter' => 0,
            'rp_id' => 'localhost',
            'origin' => 'http://localhost',
            'transports' => json_encode(['internal']),
            'aaguid' => '00000000-0000-0000-0000-000000000000',
            'public_key' => Crypt::encryptString(self::LEGACY_PASSKEY_PUBLIC_KEY),
            'attestation_format' => 'none',
            'certificates' => null,
            'disabled_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        LegacyPasskeys::copyAll();
    }

    private function ratingTitle(string $title, string $slug): Anime
    {
        return Anime::factory()->finished()->create([
            'title_english' => $title,
            'title_romaji' => $title,
            'slug' => $slug,
            'format' => 'TV',
            'episodes' => 12,
            'cover_image_large' => null,
            'cover_image_medium' => null,
            'banner_image' => null,
            'synopsis' => 'A show the AniTrack rating end-to-end test uses.',
            'popularity' => 500,
        ]);
    }
}
