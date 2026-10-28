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

- **Backend:** Laravel 12, PHP 8.4 (the lockfile needs 8.4; CI and production run 8.4)
- **Frontend:** Vue 3 + TypeScript, Inertia.js, PrimeVue, Tailwind CSS
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
- `throttle:auth` allows 5 auth requests a minute: keep registrations/logins per run low.

## Deploy and release

- Laravel Forge deploys `main` on every push (GitHub webhook). Each merge is a production deploy:
  check https://anitrack.app afterwards (the `build/assets/app-*.js` hash changes).
- Releases are `vX.Y.Z` tags: `.github/workflows/release.yml` creates the GitHub Release with
  generated notes. The Chrome extension has its own `extension-v*` tags and an
  `extension-dev-latest` prerelease.
- Production runs Inertia SSR: a Forge daemon runs `php artisan inertia:start-ssr`, and the
  deploy script runs `npm run build` and ends with `php artisan inertia:stop-ssr` (the daemon
  restarts on the new bundle). `bootstrap/ssr/` is built, not committed (gitignored).
- Check SSR on the live site with `curl -s https://anitrack.app/ | grep -o '<div id="app"[^>]*>.\{0,80\}'`
  (strip the long `data-page`): the page's HTML should follow, not an empty div.

## Quirks

- Google tag IDs live in `config/analytics.php` (`GOOGLE_ANALYTICS_ID`, `GOOGLE_ADS_ID`); empty
  values leave the tag out. AdSense is `config/adsense.php`.
- `env('X', fallback)` returns `''` for an empty `X=` line, so the fallback never applies.
- `resources/js/ssr.ts` renders the page app itself and hands Inertia the finished HTML: Vue
  3.5.44 turns `innerHTML` into a string (vuejs/core#15769), and Inertia 2.x puts a Promise
  there, so stock `render: renderToString` gives `[object Promise]` (#3408).
