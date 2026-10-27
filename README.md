# AniTrack

Track the anime you watch, plan what's next and find something new. Live at
**[anitrack.app](https://anitrack.app)**.

- Browse and search the full anime catalogue (synced from AniList), with seasonal charts,
  the airing schedule, top lists, studios and people
- Keep your list: watching, completed, on hold, dropped and plan to watch, with progress,
  scores and notes; import from and export to MyAnimeList
- Discover page with mood picks and recommendations based on your taste
- Playlists, public profiles and lists, passkey sign-in
- A public API and a Chrome extension (`chrome-extension/`)

Part of [Shay's personal apps](https://punterdigital.github.io/personal-apps/).

## Stack

Laravel 12 (PHP 8.4), Inertia 2 + Vue 3 + TypeScript, PrimeVue, Tailwind CSS 4, MySQL,
Redis + Horizon, Inertia SSR. Hosted on Laravel Forge: every push to `main` deploys.

## Development

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
npm ci
composer run dev        # serve + queue + logs + Vite
```

Docker alternative: `docker compose up -d` (see [docs/infrastructure.md](docs/infrastructure.md)).

## Tests

```bash
vendor/bin/pint --test  # code style
npm run build           # type-check + client and SSR builds
php artisan test        # Pest (in-memory SQLite)
npm run test:e2e        # Playwright smoke suite (throwaway SQLite, php artisan serve)
```

More in [docs/](docs/README.md).

## Licence

[MIT](LICENSE)
