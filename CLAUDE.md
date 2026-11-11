# AniTrack - Project Conventions

## Feature Flags

All new user-facing features MUST be gated behind a feature flag using Laravel Pennant. This allows testing features on production with specific users before enabling them for everyone.

### Adding a new feature flag

1. Define the flag in `app/Providers/AppServiceProvider.php` → `defineFeatureFlags()`:
   ```php
   Feature::define('my-feature', fn ($user) => false);
   ```

2. Use **kebab-case** for flag names (e.g., `playlists`, `social-profiles`, `anime-reviews`).

3. Check the flag in PHP (controllers, middleware, etc.):
   ```php
   use Laravel\Pennant\Feature;

   if (Feature::for($user)->active('my-feature')) {
       // feature-specific logic
   }
   ```

4. Check the flag in Vue components:
   ```vue
   <script setup>
   import { useFeature } from '@/composables/useFeature'
   const showFeature = useFeature('my-feature')
   </script>

   <template>
       <div v-if="showFeature">...</div>
   </template>
   ```

5. Manage flags at `/admin/features` — toggle between Everyone, Nobody, or specific users.

### When to use feature flags

- Any new page, section, or significant UI change
- New API endpoints that change user-facing behavior
- Do NOT flag internal refactors, bug fixes, or admin-only changes

## Tech Stack

- **Backend:** Laravel 13, PHP 8.4 (the lockfile needs 8.4; CI and production run 8.4)
- **Frontend:** Vue 3 + TypeScript, Inertia.js, Tailwind CSS (local controls in `resources/js/Components/ui`, no component library)
- **Database:** MySQL
- **Queue:** Redis + Laravel Horizon
- **External API:** AniList GraphQL API
- **SSR:** Inertia SSR with Node.js

## Key Patterns

- **Services** handle business logic (`app/Services/`)
- **API Resources** format data for frontend (`app/Http/Resources/`)
- **Form Requests** validate input (`app/Http/Requests/`)
- **Composables** for reusable Vue logic (`resources/js/composables/`)
- **Types** in `resources/js/types/` with barrel export from `index.ts`
- Anime uses **slug-based routing** (`getRouteKeyName()` → `'slug'`)
- API routes use `{model:id}` binding (not slug) for mutation endpoints
- Frontend mutations use **TanStack Vue Query** via composables

## Commands

```bash
composer install                # on Windows add --ignore-platform-req=ext-pcntl --ignore-platform-req=ext-posix
npm ci
vendor/bin/pint                 # fix style; CI runs `vendor/bin/pint --test`
npm run lint                    # ESLint (eslint.config.js); `npx eslint . --fix` fixes most of it
npm run build                   # vue-tsc + client build + SSR build
php artisan test                # Pest, in-memory SQLite (forced in phpunit.xml)
npm run test:e2e                # Playwright; needs `npm run build` first
```

On Shay's PC the default `php` is 8.3: put 8.4 first on `PATH`
(`export PATH="$(ls -d ~/.pvm/versions/php-8.4* | sort -V | tail -1):$PATH"`) and run Composer
as `php <that dir>/composer/composer.phar`.

## E2E

- `playwright.config.ts` starts `tests/e2e/serve.mjs`: it recreates a throwaway SQLite file
  (in the OS temp dir), runs `migrate:fresh --seeder=E2ESeeder` and `php artisan serve` on
  `127.0.0.1:8765`. Env overrides in the config beat `.env`: database cache (on the throwaway
  SQLite, so nothing cached by an earlier run survives), file session, sync queue,
  collection Scout driver, no Redis, no SSR, and Sentry, AdSense and the Google tag switched off.
- A second server on `127.0.0.1:8766` (own SQLite file) has the production Google tag IDs, for
  `google-tag.spec.ts` only (Playwright project `google-tag`). That spec lets the tag's scripts
  load and answers every other non-local request itself, so no hit reaches Google; it fails on
  CSP errors from the tag's page_view hits.
- A third server on `127.0.0.1:8767` (own SQLite file) has SSR on and talks to
  `node bootstrap/ssr/ssr.js` on port 13716 (`INERTIA_SSR_PORT`), for `ssr.spec.ts` only
  (Playwright project `ssr`). It checks the raw HTML inside `#app` before any JS runs, then
  that the page hydrates without console errors.
- Seed data lives in `database/seeders/E2ESeeder.php` (three anime + `e2e@example.com`).
- Specs fail on any browser console error. The production CSP is active in E2E (`APP_ENV=e2e`),
  so a CSP violation shows up as a failure: seed images must be `null` or on an allowed host.
- `throttle:auth` allows 5 auth requests a minute per IP and per email in production
  (`config/auth.php` `throttle_per_minute`). The E2E servers set `AUTH_THROTTLE_PER_MINUTE=60`:
  with the blog spec's admin login the suite went past 5 and smoke's signup got a 429
  (card 4479). Pest's `AuthenticationTest` checks the production limit.

## Deploy and release

- Laravel Forge deploys `main` on every push (GitHub webhook). Each merge is a production deploy:
  check https://anitrack.app afterwards (the `build/assets/app-*.js` hash changes).
- Releases are `vX.Y.Z` tags: `.github/workflows/release.yml` creates the GitHub Release with
  generated notes. The Chrome extension has its own `extension-v*` tags and an
  `extension-dev-latest` prerelease.
- Production runs Inertia SSR: a Forge daemon runs `php artisan inertia:start-ssr`, and the
  deploy script runs `npm run build` and ends with `php artisan inertia:stop-ssr` (the daemon
  restarts on the new bundle). `bootstrap/ssr/` is built, not committed (gitignored).
- `GET /version` (card 4453) answers `{"version","commit","deployed_at"}` from the deployed
  checkout's `.git` (`App\Support\DeployedVersion`, plain file reads, no `git` process), so
  `curl -s https://anitrack.app/version` confirms a deploy went live. The route skips the `web`
  group (no session cookie, no CSP headers) and sends `Cache-Control: no-store`; without a
  `.git` it reports `unknown`. Other methods hit the `Route::any` fallback (404).
- Check SSR on the live site with `curl -s https://anitrack.app/ | grep -o '<div data-server-rendered="true" id="app">.\{0,80\}'`:
  the page's HTML should follow. Without SSR the page has only `<div id="app"></div>` (the props
  are in a `<script data-page="app" type="application/json">` before it, since Inertia 3).

## Quirks

- Google tag IDs live in `config/analytics.php` (`GOOGLE_ANALYTICS_ID`, `GOOGLE_ADS_ID`); empty
  values leave the tag out. AdSense is `config/adsense.php`.
- `env('X', fallback)` returns `''` for an empty `X=` line, so the fallback never applies.
- Error pages: `bootstrap/app.php` renders `ErrorPage` with `App\Support\ErrorPageProps`. With the
  `error-pages` flag on, 403/404/419/451 use the site layout (500/503 stay standalone). Errors
  thrown before `HandleInertiaRequests` ran (route model binding, CSRF) have no shared props,
  so `ErrorPageProps` shares them itself. Unknown URLs hit a `Route::any` fallback (no CSRF)
  so they get a session; keep it `any`, since a GET-only fallback turns other methods into 405.
  Laravel 13's CSRF middleware is `PreventRequestForgery`: excluding the deprecated
  `ValidateCsrfToken` subclass does nothing (a POST to an unknown URL answered 419, card 4488).
  PHPUnit skips CSRF, and a browser's same-origin POST passes it via `Sec-Fetch-Site`, so only
  `request`-fixture E2E (no such header, like curl) catches it (`error-pages.spec.ts`).
- NSFW (card 4198): `anime.nsfw_at`, set by admins on the anime edit page (`admin.anime.nsfw`),
  never written by an AniList refresh (that writes `is_adult`). Public queries use
  `Anime::safeForWork()` (not adult, not NSFW) next to `visible()` (not hidden); raw joins on
  `anime` (PeopleController) and in-memory filters (DiscoverService) check `nsfw_at` themselves.
  Guests opening an NSFW title get `AnimeNsfwGatePage` (sign-in link with `redirect`, noindex);
  signed-in users get the page. Guests' views of public lists and playlists leave NSFW items out.
  Search results are cached 15 min per query, so `SearchController` drops ids that became
  adult/NSFW/hidden since from the cached result. AniList adult titles stay 404 for everyone.
- Inertia 3 (card 3820): `resources/js/ssr.ts` uses stock `render: renderToString` again. The
  Inertia 2.x workaround for `[object Promise]` (#3408, vuejs/core#15769) went with the upgrade:
  v3 awaits the render and builds the `#app` markup as a string. `config/inertia.php` is the v3
  file with AniTrack's values re-applied (SSR off unless `INERTIA_SSR_ENABLED`, bundle
  `bootstrap/ssr/ssr.js`, pages in `js/Pages`); the root view uses `<title data-inertia>`.
  A page without a layout leaves `layout` out (v3's types refuse `layout: false`).
- TypeScript 7 (card 3820): the extension is on TS 6.0, the last JS-based TypeScript. TS 7 has
  no JS compiler API, so `vue-tsc` can't run on it (`typescript/lib/tsc` isn't exported).
  `dependabot.yml` ignores `typescript >=7` for `/chrome-extension` until vue-tsc supports it.
- AniTrack rating (card 4476, flag `anitrack-rating`): the anime page's `anitrack_rating` prop
  is the average of users' list scores (1-10; 0 is "no score"), private entries included,
  removed entries and deleted accounts not, or `null` under 10 scores ("No Rating Yet").
  `App\Services\AnimeRatingService` caches sum + count per anime (`anime:rating:v1:{id}`,
  outside the cached page model); `UserAnimeList` saved/deleted/restored and `User`
  deleted/restored events forget it, so every write path that goes through Eloquent (list
  form, API, MAL import) shows at once. A raw `DB::table('user_anime_lists')` write wouldn't:
  forget the key there. The page's list edits reload `list_entry` and `anitrack_rating`.
  E2E: `anitrack-rating.spec.ts` and `ssr.spec.ts` on the seeded `rated-e2e-show` (8.4,
  10 ratings) and `unrated-e2e-show` (9).
- Blog (cards 4477/4479-4481): `blog_posts` (`App\Models\BlogPost`), written by admins at
  `/admin/blog` (`AdminBlogPostController`, admin-only, so no flag; the public pages in 4481
  get one). The body is stored as **Markdown**; `App\Support\BlogMarkdown` renders it with
  league/commonmark GFM, `html_input: strip` and no unsafe links, so pasted HTML or
  `javascript:` links never reach a page. The editor (`Components/BlogEditor.vue`) is TipTap 3
  with `@tiptap/markdown`: it writes the model and never reads it back after mount (reading it
  back raced with typing and dropped keystrokes). Toolbar buttons use `@mousedown.prevent`,
  or the first keys typed after a click land on the button (TipTap refocuses a frame late).
  The create page redirects to the same component (`BlogPostEditPage`), which isn't
  remounted, so the store's `onSuccess` copies the generated slug into the form. Flash
  messages show as the layout's toast (`useFlashToast`), not a page banner. Image-by-URL
  only shows hosts the CSP's `img-src` allows (self, AniList).
  E2E: `blog-admin.spec.ts` (admin writes, toggles Markdown, saves, publishes, deletes).
- Blog images (card 4480): `POST /admin/blog/images` (`AdminBlogImageController`, admin-only)
  takes JPEG/PNG/WebP/GIF up to 5 MB and `App\Support\BlogImages` stores it on the `public`
  disk as `blog/Y/m/<ulid>-<w>x<h>.<ext>`. JPEG/PNG/WebP are re-encoded with GD (needs
  `ext-gd`; CI's setup-php lists it): wider than 1600px is scaled down, EXIF (GPS) is dropped,
  phone rotation applied first. GIFs are stored as uploaded (GD would keep one frame of an
  animation), so a wide GIF keeps its size. Over 30 MP is refused before decoding.
  They're served by `BlogImageController` at `/media/blog/...` (outside the web group: no
  cookie; `Cache-Control: immutable`), so nothing depends on a `public/storage` symlink.
  Forge's zero-downtime deploys share `storage/` between releases by default, so uploads
  should survive a deploy: check that an older upload still loads after the next one.
  `BlogMarkdown` adds `loading="lazy" decoding="async"` to every image and width/height to
  ours, read from the name (no DB). The editor uploads from the "Upload image" button, a paste
  or a drop (rich and Markdown mode) and asks for alt text (the file name as a start). A post's
  `cover_image` holds the disk path (validated: must be an existing upload);
  `BlogPost::socialImageUrl()` is the absolute URL for the public page's OG/Twitter tags (4481).
  Uploads are never deleted (a removed cover or image stays on disk).
  E2E: `blog-admin.spec.ts`' second test makes PNGs with a canvas, uploads by button and paste,
  sets/removes a cover and fetches the image as a guest.
- Public blog (card 4481, flag `blog`): `/blog` (12 a page, newest first; an empty page > 1 is
  404) and `/blog/{slug}` (`BlogController`). The flag is checked in the controller, not with
  `feature:` middleware, because admins always see the pages: drafts and future posts are 404
  for everyone else and show admins a preview banner with `noindex` and no JSON-LD.
  `BlogPost::isLive()` is "published and the date has come". SEO: `<Head>` tags in the Vue
  pages (title/description from the overrides, else title/excerpt/body text; canonical;
  OG `article` + Twitter, the cover as image), and the BlogPosting JSON-LD comes from the
  page's `json_ld` prop, printed by `app.blade.php` (with `JSON_HEX_TAG`), so it's in the
  first HTML with or without SSR. Dates are formatted in PHP (`published_label`) so SSR and
  the browser agree. `BlogMarkdown` turns `#` headings into `<h2>` (the title is the only
  `<h1>`). `/blog/feed.xml` (RSS 2.0, latest 20, `content:encoded`, outside the web group) and
  the sitemap's blog URLs exist only while the flag is on for guests; a saved or deleted post
  clears the cached sitemap (`sitemap:xml`). Footer "Blog" link follows the flag; the admin
  edit page links to the post ("Preview" for drafts).
  E2E: `E2ESeeder` turns `blog` on and seeds `welcome-to-the-anitrack-blog` (published) and
  `unfinished-draft`, so `blog-admin.spec.ts` checks only its own rows. `blog-public.spec.ts`
  (list, post, head tags, feed, sitemap, admin preview) and `ssr.spec.ts` (raw HTML: `<h1>`,
  meta tags, JSON-LD).
- PrimeVue is gone (card 4272): PrimeVue 5 became a commercial PrimeUI package that needs a
  licence key, so AniTrack moved to its own components. Don't add it back.
- Form controls (card 4272): `resources/js/Components/ui` has `AppButton` (label,
  severity primary/secondary/danger, text, outlined, size small, loading), `AppInputText`,
  `AppTextarea`, `AppToggleSwitch` (checkbox with `role="switch"`), `AppPassword` (toggle-mask
  is a labelled Show/Hide password button), `AppProgressBar`, `AppSelect` (combobox +
  listbox; `options`/`option-label`/`option-value`, `show-clear`, `filter`, `invalid`; give it
  an `aria-label`), `AppDialog` (modal, `v-model:visible`, `header`, `#footer` slot; Escape,
  focus trap, scroll lock, focus back to the opener), `AppSlider` (role="slider" handle) and
  `AppToast` (in AppLayout) with `useToast().add({ severity, summary, detail, life })` from
  `composables/useToast.ts` (`createToast()` is installed in `app.ts` and `ssr.ts`, one store
  per app). They look like PrimeVue's Aura dark theme through the `--color-control-*` and
  `--color-toast-*` tokens in `resources/css/app.css` (Aura's Tailwind 3 hex palette).
  `.dark { color-scheme: dark }` there replaces what Aura set, so native controls (date picker
  icons, spinners, scrollbars) stay dark. The Select list and the Dialog are teleported to
  `<body>` only after mount, so SSR output and hydration agree. `data-ui="…"` attributes name
  each part. E2E: `controls.spec.ts` (Select on /anime) and the smoke spec's register test
  (Dialog, Select, Slider, Toast, the filter box on /settings; a separate sign-in would hit
  `throttle:auth`).
- Passkeys (card 4237): laravel/passkeys (server, pinned `~0.3.0`) and `@laravel/passkeys`
  (browser client, `^0.4.1`) replaced the abandoned laragear/webauthn + `@laragear/webpass`.
  The package's routes are off (`Passkeys::ignoreRoutes()` in AppServiceProvider); AniTrack's
  `PasskeyController` uses its actions on its own routes: `GET /passkeys/login/options` +
  `POST /passkeys/login` (guest, `throttle:auth`, JSON `{message, redirect}` with the same
  `redirect`/intended handling as password login) and `GET /settings/passkeys/options` +
  `POST /settings/passkeys` (auth, no password confirm), plus rename/delete under
  `/settings/passkeys/{passkey}` (404 for someone else's). All are CSRF-protected: the
  client sends `X-XSRF-TOKEN` from the cookie. `App\Models\Passkey` is the package's model
  with `user()` including soft-deleted users (the package's `PasskeyVerified` event needs one;
  null was a 500); the controller refuses deleted accounts. `config/passkeys.php` keeps
  laragear's env names (`WEBAUTHN_ID`, `WEBAUTHN_ORIGINS`) and always allows the https origin
  of APP_URL's host (Forge's APP_URL is http://).
  Existing passkeys were copied by the migration `copy_webauthn_credentials_to_passkeys`
  (`App\Support\LegacyPasskeys`): laragear's encrypted PEM becomes a COSE key (P-256 → ES256,
  RSA → RS256; laragear always verified with SHA-256). Ed25519 rows are skipped: laravel/passkeys
  only verifies ES256/RS256, and a copied EdDSA key 500'd at sign-in ("Unsupported algorithm",
  first CI run). The record keeps
  laragear's user handle: `base64url_decode(<UUID as 32 hex chars>)`, the bytes SimpleWebAuthn
  13 made from laragear's `user.id`, which the authenticator returns at sign-in. Disabled or
  unconvertible rows are logged and printed by the migration. `webauthn_credentials` stays
  (its migration is written out by hand now) until a cleanup card drops it.
  The `auth` limiter keys its second bucket by email only when there is one: passkey requests
  have none, and `by('')` made every passkey sign-in on the site share one 5/min bucket.
  Tests: `tests/Support/SoftwareAuthenticator.php` signs real assertions (ES256/RS256; key
  generation on Windows PHP needs its `extras/ssl/openssl.cnf`, which the helper finds).
  Windows PHP here has no ext-sodium, so EdDSA paths only run in CI. `passkeys.spec.ts` runs on
  `http://localhost` (WebAuthn refuses an IP as RP ID) with a CDP virtual authenticator: a
  seeded laragear-format passkey (E2ESeeder, throwaway key) signs in, and a new one is added,
  used and removed.
