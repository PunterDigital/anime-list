# AniTrack Architecture Documentation

## 1. System Overview

AniTrack is a personal anime tracking application built as a **Laravel 12 monolith** using **Inertia.js v2**. It is not a decoupled SPA with a separate API backend. Instead, Laravel serves Vue 3 pages directly through Inertia, eliminating the need for a dedicated API layer or a client-side router like Vue Router.

### Core Characteristics

- **Monolith architecture**: A single Laravel application handles routing, authentication, business logic, and serves the Vue 3 frontend via Inertia.js.
- **No Vue Router**: Page navigation uses Inertia's `<Link>` component and Ziggy's `route()` helper to generate Laravel named route URLs on the client side.
- **No separate API**: Controllers return `Inertia::render()` for GET requests and `redirect()` for POST requests. The only JSON endpoints are lightweight internal APIs for search and list mutations (`/api/search`, `/api/list/*`).
- **Dark mode only**: The application enforces dark mode via the `.dark` CSS class on the root `<html>` element. There is no light theme and no theme toggle.
- **10-point scoring**: Follows the MAL (MyAnimeList) standard. Scores are stored internally as integers 0-100 and displayed to users as 0-10.
- **Personal use**: This is a single-user personal project. There is no public API, no marketing site, and no SEO optimization.

### Data Source

AniList's public GraphQL API (`https://graphql.anilist.co`) is the primary data source. The application syncs anime metadata, airing schedules, genres, studios, and relations from AniList on configurable schedules. MAL XML import is supported for migrating existing lists, but direct MAL API integration is deferred.

---

## 2. Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| PHP 8.4 | Runtime |
| Laravel 12 | Web framework |
| Inertia.js v2 | Server-driven SPA protocol |
| Guzzle HTTP | HTTP client for AniList GraphQL API |
| Laravel Scout | Full-text search (database driver) |
| Laravel Horizon | Redis queue dashboard and supervisor |
| Spatie Laravel Data | Data Transfer Objects (DTOs) |

### Frontend

| Technology | Purpose |
|---|---|
| Vue 3 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS v4 | Utility-first CSS |
| `Components/ui` | Own form controls (Button, Select, Dialog, Slider, Toast, ...), styled like the old PrimeVue Aura dark theme |
| Pinia | State management (anime, userList stores) |
| TanStack Vue Query | Server state / async data management |
| Ziggy | Laravel named routes in JavaScript |

### Database and Infrastructure

| Technology | Purpose |
|---|---|
| MySQL 8.4 | Primary database |
| Redis | Cache store and queue backend |
| Docker Compose | Local development (8 services) |
| Laravel Forge | Production deployment |

### Docker Compose Services

The `docker-compose.yml` defines 8 services for local development:

| Service | Image / Build | Port | Purpose |
|---|---|---|---|
| `app` | Custom Dockerfile | -- | PHP-FPM application server |
| `nginx` | `nginx:alpine` | 8000 | Web server / reverse proxy |
| `vite` | `node:22-alpine` | 5173 | Vite dev server (HMR) |
| `mysql` | `mysql:8.4` | 3306 | Database |
| `redis` | `redis:alpine` | 6379 | Cache and queues |
| `horizon` | Custom Dockerfile | -- | Queue worker supervisor |
| `scheduler` | Custom Dockerfile | -- | `schedule:work` for cron tasks |
| `mailhog` | `mailhog/mailhog` | 8025/1025 | Local email testing |

---

## 3. Directory Structure

### `app/` -- Backend Application Code

```
app/
  Console/
    Commands/
      SyncAnimeCommand.php         # Artisan command: sync:anime
      SyncScheduleCommand.php      # Artisan command: sync:schedule
  DTOs/                            # Spatie Data Transfer Objects
    AiringScheduleData.php
    AnimeData.php
    AnimeRelationData.php
    ExternalLinkData.php
    GenreData.php
    StudioData.php
    StudioEdgeData.php
    SyncProgressData.php
  Exceptions/
  Http/
    Controllers/
      Auth/
        AuthenticatedSessionController.php   # Login / logout
        RegisteredUserController.php         # Registration
        EmailVerificationNotificationController.php
        NewPasswordController.php
        PasswordResetLinkController.php
        VerifyEmailController.php
      AnimeController.php           # Anime browse and detail pages
      HomeController.php            # Landing page
      ImportController.php          # MAL XML import wizard
      ProfileController.php         # Public user profiles
      ScheduleController.php        # Airing schedule page
      SearchController.php          # JSON search endpoint
      SeasonalController.php        # Seasonal anime page
      SettingsController.php        # User settings
      UserListController.php        # User anime list CRUD + export
    Middleware/
      HandleInertiaRequests.php     # Shares auth.user and flash props
    Requests/
      Auth/                         # Form request validation classes
    Resources/
  Jobs/
    ProcessAnimeData.php            # Process and persist anime from API
    ProcessMalImport.php            # Process uploaded MAL XML file
    ResolveAnimeRelations.php       # Link related anime records
    SyncAiringSchedulePage.php      # Fetch a page of airing schedules
    SyncAnimePage.php               # Fetch a page of anime from AniList
  Models/
    AiringSchedule.php
    Anime.php                       # Has Searchable trait (Scout)
    AnimeRelation.php
    ExternalId.php
    Genre.php
    RawApiResponse.php              # Stores raw AniList API responses
    Recommendation.php              # Schema planned, deferred
    RecommendationVote.php          # Schema planned, deferred
    Studio.php
    User.php
    UserAnimeList.php
  Providers/
    AppServiceProvider.php          # Registers AniListClient singleton
  Services/
    AniListClient.php               # GraphQL HTTP client with rate limiting
    AniListQueryBuilder.php         # Builds GraphQL query strings
    AnimeDataPersistenceService.php # Persists normalized anime data to DB
    AnimeQueryService.php           # Builds Eloquent queries for anime
    MalExportService.php            # Exports user list to MAL XML
    MalImportService.php            # Parses MAL XML imports
    SeasonService.php               # Season/year calculation logic
    UserListService.php             # User anime list business logic
```

### `resources/js/` -- Frontend Application Code

```
resources/js/
  app.ts                     # Inertia app entry point
  env.d.ts                   # Vite environment type declarations
  Components/                # Reusable Vue components
    AddToListButton.vue
    AiringScheduleTable.vue
    AiringTodaySection.vue
    AnimeCard.vue
    AnimeCardSkeleton.vue
    AnimeHeroSection.vue
    AppNavbar.vue
    ContinueWatchingRow.vue
    DashboardStatsBar.vue
    FilterSidebar.vue
    GenreBadge.vue
    ImportWizard.vue
    ListCardView.vue
    ListCompactView.vue
    ListEntryModal.vue
    ListStatusTabs.vue
    ListTableView.vue
    PaginationBar.vue
    RelatedAnimeRow.vue
    ScheduleDayColumn.vue
    ScoreBadge.vue
    SearchBar.vue
    SeasonSelector.vue
    SortBar.vue
    UserAvatar.vue
  Layouts/
    AppLayout.vue            # Main application layout (navbar + toast)
  Pages/                     # Inertia page components (one per route)
    AnimeDetailPage.vue
    AnimeIndexPage.vue
    ErrorPage.vue
    HomePage.vue
    ImportPage.vue
    LoginPage.vue
    MyListPage.vue
    NotFoundPage.vue
    ProfilePage.vue
    RegisterPage.vue
    SchedulePage.vue
    SearchPage.vue
    SeasonalPage.vue
    SettingsPage.vue
  composables/               # Vue composables (reusable logic)
    useAnimeSearch.ts
    useBrowseFilters.ts
    useCountdown.ts
    useDebounce.ts
    useFlashToast.ts
    useListMutations.ts
  stores/                    # Pinia state stores
    anime.ts
    userList.ts
  types/                     # TypeScript type definitions
    anime.ts
    api.ts
    index.ts
    inertia.d.ts
    list.ts
    schedule.ts
    user.ts
    vue-augment.d.ts
```

### `config/` -- Laravel Configuration

```
config/
  anilist.php       # AniList API: endpoint, rate limits, retry, sync settings
  app.php           # Application name, timezone, locale
  auth.php          # Authentication guards and providers
  cache.php         # Cache store configuration
  database.php      # Database connection settings
  filesystems.php   # Filesystem disks
  horizon.php       # Horizon supervisors and queue worker settings
  logging.php       # Log channels
  mail.php          # Mail driver
  queue.php         # Queue connection configuration
  sanctum.php       # Sanctum configuration (present but unused for auth)
  scout.php         # Laravel Scout search configuration
  services.php      # Third-party service credentials
  session.php       # Session driver and lifetime
```

### `database/` -- Migrations, Factories, Seeders

```
database/
  migrations/
    0001_01_01_000000_create_users_table.php          # Users (modified for avatar, bio, timezone)
    0001_01_01_000001_create_cache_table.php           # Cache (Laravel default)
    0001_01_01_000002_create_jobs_table.php             # Jobs (Laravel default)
    2026_03_04_174154_create_personal_access_tokens_table.php
    2026_03_04_200001_create_genres_table.php
    2026_03_04_200002_create_studios_table.php
    2026_03_04_200003_create_anime_table.php
    2026_03_04_200004_create_anime_genre_table.php     # Pivot: anime <-> genre
    2026_03_04_200005_create_anime_studio_table.php    # Pivot: anime <-> studio
    2026_03_04_200006_create_anime_relations_table.php
    2026_03_04_200007_create_airing_schedules_table.php
    2026_03_04_200008_create_user_anime_lists_table.php
    2026_03_04_200009_create_recommendations_table.php
    2026_03_04_200010_create_recommendation_votes_table.php
    2026_03_04_200011_create_external_ids_table.php
    2026_03_04_200012_create_raw_api_responses_table.php
    2026_03_05_000001_make_genres_anilist_id_nullable.php
  factories/
  seeders/
```

### `docker/` -- Docker Configuration

```
docker/
  Dockerfile        # PHP-FPM application image
  nginx.conf        # Nginx reverse proxy configuration
```

### `routes/` -- Application Routes

```
routes/
  web.php           # All Inertia page routes + internal API endpoints
  console.php       # Artisan scheduled commands
```

---

## 4. Request Lifecycle

AniTrack uses Inertia.js to bridge Laravel and Vue. Here is how a typical page request flows through the application.

### Initial Page Load (Full HTML)

```
Browser GET /anime/123
       |
       v
  Laravel Router (routes/web.php)
       |
       v
  Route::get('/anime/{anime}', [AnimeController::class, 'show'])
       |
       v
  AnimeController::show($anime)
       |  - Fetches anime with relations from database
       |  - Prepares props array (anime data, user list entry, etc.)
       |
       v
  return Inertia::render('AnimeDetailPage', $props)
       |
       v
  HandleInertiaRequests middleware (share step)
       |  - Merges shared props into response:
       |    'auth.user' => { id, name, email, avatar_url, bio, timezone } | null
       |    'flash.message' => session flash message
       |    'flash.status' => session flash status
       |
       v
  Inertia Server-Side Adapter
       |  - Detects this is NOT an Inertia XHR request (no X-Inertia header)
       |  - Renders full HTML using the root Blade template
       |
       v
  resources/views/app.blade.php
       |  - <html class="dark">           (enforces dark mode)
       |  - @routes                        (Ziggy route definitions as JSON)
       |  - @vite(['resources/js/app.ts']) (loads compiled JS/CSS)
       |  - @inertiaHead                   (page-specific <Head> tags)
       |  - @inertia                       (div#app with page data as JSON)
       |
       v
  Browser receives full HTML + embedded page data
       |
       v
  resources/js/app.ts bootstraps:
       |  1. createInertiaApp() resolves page component via import.meta.glob
       |  2. Registers plugins: ZiggyVue, Pinia, VueQueryPlugin, createToast()
       |  3. Registers global components: <Link>, <Head>
       |  4. Mounts Vue app to #app element
       |
       v
  Vue renders AnimeDetailPage.vue inside AppLayout.vue
```

### Subsequent Navigation (Inertia XHR)

```
User clicks <Link href="/seasonal">
       |
       v
  Inertia client intercepts click
       |  - Sends XHR GET /seasonal with X-Inertia: true header
       |
       v
  Laravel Router -> SeasonalController -> Inertia::render('SeasonalPage', $props)
       |
       v
  HandleInertiaRequests middleware merges shared props
       |
       v
  Inertia Server-Side Adapter
       |  - Detects X-Inertia header
       |  - Returns JSON response: { component, props, url, version }
       |
       v
  Inertia client receives JSON
       |  - Swaps Vue page component (no full page reload)
       |  - Updates browser URL via History API
       |  - Merges new props into Vue reactivity system
```

### Form Submissions

```
User submits login form via Inertia useForm()
       |
       v
  Inertia POST /login (XHR with X-Inertia header)
       |
       v
  AuthenticatedSessionController::store()
       |  - Validates credentials
       |  - Authenticates user session
       |  - Returns redirect('/') (not Inertia::render)
       |
       v
  Inertia client follows redirect
       |  - Fetches new page data via XHR
       |  - Swaps to HomePage component with updated auth.user prop
```

### Root Blade Template

The single Blade template that serves all pages (`resources/views/app.blade.php`):

```html
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ config('app.name', 'AniTrack') }}</title>
        @routes
        @vite(['resources/js/app.ts'])
        @inertiaHead
    </head>
    <body class="antialiased bg-gray-950 text-gray-100">
        @inertia
    </body>
</html>
```

### Layout System

`AppLayout.vue` wraps all page content and provides:
- The `AppNavbar` component with user authentication state
- A `<slot>` for page content inside a responsive container
- The `AppToast` component for flash notifications
- The `useFlashToast()` composable that converts Laravel flash messages into toasts

```vue
<!-- resources/js/Layouts/AppLayout.vue -->
<template>
    <div class="min-h-screen bg-gray-950 text-gray-100 dark">
        <AppNavbar :user="user" :is-authenticated="isAuthenticated" />
        <main class="container mx-auto px-4 py-6">
            <slot />
        </main>
        <Toast position="top-right" />
    </div>
</template>
```

---

## 5. Key Architectural Decisions

### Authentication: Session-Based (No Sanctum SPA Cookies)

Because AniTrack is an Inertia monolith, the frontend and backend share the same domain and session. Standard Laravel session authentication works out of the box. There is no need for Sanctum's SPA cookie authentication or API token authentication.

The `HandleInertiaRequests` middleware (`app/Http/Middleware/HandleInertiaRequests.php`) shares the authenticated user on every response:

```php
'auth' => [
    'user' => $request->user() ? [
        'id' => $request->user()->id,
        'name' => $request->user()->name,
        'email' => $request->user()->email,
        'avatar_url' => $request->user()->avatar_url,
        'bio' => $request->user()->bio,
        'timezone' => $request->user()->timezone,
    ] : null,
],
```

### Score Storage: 0-100 Internal, 0-10 Display

Scores are stored as integers in the range 0-100 in the database. This allows for future granularity (e.g., decimal scores) without schema changes. The frontend divides by 10 for display, showing users a familiar 0-10 scale matching the MAL standard.

### Tiered Caching Strategy

Different data types have different staleness tolerances:

| Data Type | Cache TTL | Rationale |
|---|---|---|
| Search results | 15 minutes | Users expect fresh results |
| Airing schedules | 1 hour | Schedules change infrequently |
| Currently airing anime | 6 hours | Episode counts update periodically |
| Finished anime | 24 hours | Metadata rarely changes |

### Redis Queues with Horizon (3 Supervisors)

Queue processing is managed by Laravel Horizon with three dedicated supervisors, each configured for different workload characteristics (defined in `config/horizon.php`):

| Supervisor | Queue | Max Processes | Timeout | Purpose |
|---|---|---|---|---|
| `supervisor-default` | `default` | 2 (auto-balanced) | 60s | General background tasks |
| `supervisor-sync` | `sync` | 1 (fixed) | 300s | Long-running AniList API syncs |
| `supervisor-import` | `import` | 2 (auto-balanced) | 120s | MAL XML import processing |

### AniList as Primary Data Source

The `AniListClient` service (`app/Services/AniListClient.php`) is registered as a singleton in `AppServiceProvider` and configured via `config/anilist.php`:

- **Endpoint**: `https://graphql.anilist.co`
- **Rate limit**: 85 requests/minute (conservative, AniList allows 90)
- **HTTP timeout**: 60 seconds (connect: 30 seconds)
- **Retry**: Up to 3 attempts with 5-second exponential backoff; 60-second backoff on rate limit (HTTP 429)
- **Raw response storage**: Enabled by default (`ANILIST_STORE_RAW=true`) to allow data reprocessing during development

### Scheduled Sync Commands

Defined in `routes/console.php`, the scheduler keeps anime data fresh:

| Command | Schedule | Purpose |
|---|---|---|
| `sync:anime --status=RELEASING` | Every 6 hours | Keep currently airing anime up to date |
| `sync:anime --status=NOT_YET_RELEASED` | Daily at 04:00 UTC | Track upcoming anime |
| `sync:anime` (incremental) | Weekly, Monday 03:00 UTC | Full catalog incremental sync |
| `sync:schedule` | Hourly | Refresh airing schedule data |

### Soft Deletes on User Data

User-facing models use soft deletes from day one. This protects against accidental data loss and supports potential future features like data recovery or undo functionality.

### UTC Timestamps

All timestamps are stored in UTC in the database. The authenticated user's `timezone` field (shared via Inertia props) is used to convert timestamps at display time on the frontend. This avoids timezone ambiguity in the data layer.

### AniList CDN for Images

Anime cover images and banners are hotlinked directly from AniList's CDN rather than being downloaded and stored locally. This eliminates storage costs, avoids image processing complexity, and leverages AniList's existing CDN infrastructure.

### Five MAL-Standard Statuses

User anime list entries use exactly five statuses matching the MAL standard:

1. `watching`
2. `completed`
3. `on_hold`
4. `dropped`
5. `plan_to_watch`

---

## Appendix: Route Map

All routes are defined in `routes/web.php`. There are no separate API route files.

### Public Routes

| Method | URI | Controller | Page Component |
|---|---|---|---|
| GET | `/` | `HomeController` | `HomePage` |
| GET | `/anime` | `AnimeController@index` | `AnimeIndexPage` |
| GET | `/anime/{anime}` | `AnimeController@show` | `AnimeDetailPage` |
| GET | `/anime/al/{anilistId}` | `AnimeController@showByAnilistId` | (redirects) |
| GET | `/seasonal` | `SeasonalController@index` | `SeasonalPage` |
| GET | `/schedule` | `ScheduleController` | `SchedulePage` |
| GET | `/search` | (inline) | `SearchPage` |
| GET | `/api/search` | `SearchController` | (JSON response) |
| GET | `/user/{user:name}` | `ProfileController@show` | `ProfilePage` |

### Guest-Only Routes

| Method | URI | Controller | Page Component |
|---|---|---|---|
| GET | `/login` | `AuthenticatedSessionController@create` | `LoginPage` |
| POST | `/login` | `AuthenticatedSessionController@store` | (redirect) |
| GET | `/register` | `RegisteredUserController@create` | `RegisterPage` |
| POST | `/register` | `RegisteredUserController@store` | (redirect) |

### Authenticated Routes

| Method | URI | Controller | Page Component |
|---|---|---|---|
| GET | `/list` | `UserListController@index` | `MyListPage` |
| GET | `/list/export` | `UserListController@export` | (file download) |
| POST | `/api/list` | `UserListController@store` | (JSON response) |
| PATCH | `/api/list/{entry}` | `UserListController@update` | (JSON response) |
| DELETE | `/api/list/{entry}` | `UserListController@destroy` | (JSON response) |
| GET | `/import` | `ImportController@show` | `ImportPage` |
| POST | `/import/upload` | `ImportController@upload` | (redirect) |
| POST | `/import/confirm` | `ImportController@confirm` | (redirect) |
| GET | `/import/status` | `ImportController@status` | (JSON response) |
| GET | `/settings` | `SettingsController@show` | `SettingsPage` |
| PATCH | `/settings/profile` | `SettingsController@updateProfile` | (redirect) |
| PATCH | `/settings/password` | `SettingsController@updatePassword` | (redirect) |
| POST | `/logout` | `AuthenticatedSessionController@destroy` | (redirect) |
