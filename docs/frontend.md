# AniTrack Frontend Documentation

This document provides a comprehensive reference for the AniTrack frontend codebase. The frontend is a Vue 3 + TypeScript application served as an Inertia.js v2 monolith within a Laravel 12 backend. All source files live under `resources/js/`.

---

## Table of Contents

1. [App Bootstrap](#1-app-bootstrap)
2. [Layout](#2-layout)
3. [Pages](#3-pages)
4. [Components](#4-components)
5. [Composables](#5-composables)
6. [Pinia Stores](#6-pinia-stores)
7. [TypeScript Types](#7-typescript-types)
8. [Auth Flow](#8-auth-flow)
9. [Search Flow](#9-search-flow)
10. [List Management Flow](#10-list-management-flow)

---

## 1. App Bootstrap

**File:** `resources/js/app.ts`

The application entry point uses Inertia's `createInertiaApp()` to wire together Vue, plugins, and dynamic page resolution.

### Page Resolution

Pages are loaded dynamically via Vite's `import.meta.glob`:

```ts
resolve: (name) => {
    const pages = import.meta.glob<DefineComponent>('./Pages/**/*.vue')
    const page = pages[`./Pages/${name}.vue`]
    if (!page) throw new Error(`Page not found: ${name}`)
    return page()
}
```

The `name` parameter comes from the Laravel controller's `Inertia::render('PageName')` call. Pages are resolved from the `resources/js/Pages/` directory using lazy imports (code-splitting per page).

### Plugin Registration Order

1. **Inertia Plugin** (`plugin`) -- core Inertia client-side router
2. **ZiggyVue** -- makes Laravel's `route()` helper available in all components
3. **Pinia** (`createPinia()`) -- state management
4. **VueQueryPlugin** (TanStack Vue Query) -- async data fetching and caching
5. **createToast()** (`composables/useToast.ts`) -- the toast store behind `useToast()` and `<AppToast>`

Form controls (buttons, inputs, Select, Dialog, Slider, Toast and others) are AniTrack's own
components in `resources/js/Components/ui` (card 4272 replaced PrimeVue, whose v5 needs a
commercial licence).

### Global Components

Two Inertia components are registered globally so they can be used in any template without importing:

- `<Link>` -- Inertia's client-side navigation link (replaces `<a>` for SPA transitions)
- `<Head>` -- manages `<title>` and `<meta>` tags per page

### CSS

The global stylesheet is imported at the top of the file:

```ts
import '../css/app.css'
```

---

## 2. Layout

**File:** `resources/js/Layouts/AppLayout.vue`

The single shared layout wrapping all pages (except `ErrorPage`, which opts out).

### Structure

```
<div class="min-h-screen bg-gray-950 text-gray-100 dark">
    <AppNavbar :user="user" :is-authenticated="isAuthenticated" />
    <main class="container mx-auto px-4 py-6">
        <slot />   <!-- page content injected here -->
    </main>
    <Toast position="top-right" />
</div>
```

### Dark Mode

The root `<div>` has `class="dark"` hardcoded. Together with `.dark { color-scheme: dark }` in `resources/css/app.css` (so native controls are dark too), the entire application is always in dark mode. The background is `bg-gray-950` and default text is `text-gray-100`.

### Auth State

The layout reads the shared Inertia `auth.user` prop via `usePage()`:

```ts
const page = usePage<{ auth: { user: User | null } }>()
const user = computed(() => page.props.auth.user)
const isAuthenticated = computed(() => !!user.value)
```

These are passed down to `AppNavbar` as props.

### Flash Messages

The `useFlashToast()` composable is called at layout level. It watches the `flash.message` shared prop and automatically shows a toast (`useToast()`, rendered by `<AppToast>`) whenever the server sets a flash message.

---

## 3. Pages

All pages are in `resources/js/Pages/`. Each page sets its layout via `defineOptions({ layout: AppLayout })` (or `layout: false` for standalone error pages). Pages use `<Head>` for page titles.

### 3.1 HomePage

**File:** `resources/js/Pages/HomePage.vue`
**Auth:** Public (shows different content for authenticated users)

**Props:**

```ts
{
    seasonalShowcase: AnimeCard[]
    airingNow: AnimeCard[]
    currentSeason: AnimeSeason
    currentYear: number
    isAuthenticated: boolean
    stats?: DashboardStats         // only when authenticated
    airingToday?: ScheduleSlot[]   // only when authenticated
    continueWatching?: ListEntryResource[]  // only when authenticated
}
```

Where `DashboardStats` is defined locally:

```ts
interface DashboardStats {
    totalAnime: number
    episodesWatched: number
    avgScore: number | null
    watchingCount: number
}
```

**Behavior:**
- **Anonymous users** see a hero section with a welcome message, centered `SearchBar`, and two shared showcase sections (seasonal anime, currently airing).
- **Authenticated users** see a dashboard with `DashboardStatsBar`, `AiringTodaySection` (episodes airing today from their watching list), `ContinueWatchingRow` (in-progress entries), plus the same seasonal and airing showcases.

**Components used:** `AppLayout`, `AnimeHeroSection`, `SearchBar`, `DashboardStatsBar`, `ContinueWatchingRow`, `AiringTodaySection`

---

### 3.2 AnimeIndexPage

**File:** `resources/js/Pages/AnimeIndexPage.vue`
**Auth:** Public

**Props:**

```ts
{
    anime: PaginatedResponse<AnimeCard>
    genres: FilterOption[]
    studios: FilterOption[]
}
```

**Behavior:**
Browse/filter page for the anime catalog. Features a sidebar with filter controls (format, status, season, year, genre, studio) powered by the `useBrowseFilters` composable. Supports two view modes (`grid` and `list`), persisted to `localStorage` under the key `browse_view`. Includes sort controls via `SortBar` and pagination via `PaginationBar`. Responsive: filters collapse into a toggleable mobile panel on small screens.

**Components used:** `AppLayout`, `AnimeCard`, `FilterSidebar`, `SortBar`, `PaginationBar`

---

### 3.3 AnimeDetailPage

**File:** `resources/js/Pages/AnimeDetailPage.vue`
**Auth:** Public (add-to-list button shown only when authenticated)

**Props:**

```ts
{
    anime: AnimeDetail
    list_entry: ListEntryResource | null
}
```

**Behavior:**
Full anime detail view. Displays:
- Banner image (full-width, if available)
- Cover image in a left sidebar (overlaps the banner)
- `AddToListButton` (authenticated users only) with current list status
- Metadata cards: format, episodes, duration, status, season, aired dates, source
- Score cards: average score (`ScoreBadge`), mean score, popularity, favourites
- Studios (main studios and producers)
- External links (AniList, MAL, etc.)
- Title block (English, romaji, native)
- Genre badges (`GenreBadge`)
- Synopsis (rendered as HTML)
- Embedded trailer (YouTube/Dailymotion)
- Related anime row (`RelatedAnimeRow`)
- Airing schedule table (`AiringScheduleTable`)

**Components used:** `AppLayout`, `ScoreBadge`, `GenreBadge`, `RelatedAnimeRow`, `AiringScheduleTable`, `AddToListButton`

---

### 3.4 MyListPage

**File:** `resources/js/Pages/MyListPage.vue`
**Auth:** Authenticated

**Props:**

```ts
{
    entries: ListEntryResource[]
    counts: Record<string, number>   // counts per status
}
```

**Behavior:**
The user's anime list. Features:
- Status tabs (`ListStatusTabs`) for filtering by status (`all`, `watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped`)
- Three view modes (`table`, `card`, `compact`) persisted to `localStorage` under key `list_view`
- Client-side sorting by: last updated, score, title, or progress
- Inline editing: status changes and progress increments via `useListMutations`
- Full edit modal (`ListEntryModal`) for detailed entry editing
- Export XML link and Import link in the header

**Components used:** `AppLayout`, `ListStatusTabs`, `ListTableView`, `ListCardView`, `ListCompactView`, `ListEntryModal`

---

### 3.5 SearchPage

**File:** `resources/js/Pages/SearchPage.vue`
**Auth:** Public

**Props:** None (no server-side props)

**Behavior:**
Full-page search interface. Uses the `useAnimeSearch` composable for debounced search. On mount, reads the `q` query parameter from the URL to pre-fill the search box. Shows results as a grid of `AnimeCard` components. Displays loading state, empty state, and a prompt to type at least 2 characters.

**Components used:** `AppLayout`, `AnimeCard`

---

### 3.6 SeasonalPage

**File:** `resources/js/Pages/SeasonalPage.vue`
**Auth:** Public

**Props:**

```ts
{
    groups: SeasonalGroup[]
    year: number
    season: AnimeSeason
    adjacentSeasons: AdjacentSeasons
}
```

**Behavior:**
Displays anime grouped by format (TV, Movie, OVA, etc.) for a given season/year. The `SeasonSelector` component provides navigation to previous/next seasons. Each group shows a heading with format label and count, followed by an anime card grid.

**Components used:** `AppLayout`, `AnimeCard`, `SeasonSelector`

---

### 3.7 SchedulePage

**File:** `resources/js/Pages/SchedulePage.vue`
**Auth:** Public (authenticated users get a "My Watching Only" filter)

**Props:**

```ts
{
    days: ScheduleDayMap        // Record<string, ScheduleSlot[]>
    weekOffset: number
    weekStart: string           // ISO date
    weekEnd: string             // ISO date
    watchingOnly: boolean
    isAuth: boolean
}
```

**Behavior:**
Weekly airing schedule displayed as a 7-column grid (one `ScheduleDayColumn` per day). Navigation controls for "This Week" and "Next Week" via `router.get()`. Authenticated users can toggle "My Watching Only" to filter to their watching list. Today's column is highlighted.

**Components used:** `AppLayout`, `ScheduleDayColumn`

---

### 3.8 ImportPage

**File:** `resources/js/Pages/ImportPage.vue`
**Auth:** Authenticated

**Props:** None

**Behavior:**
Wrapper page that renders the `ImportWizard` component, which handles the entire MAL XML import flow.

**Components used:** `AppLayout`, `ImportWizard`

---

### 3.9 ProfilePage

**File:** `resources/js/Pages/ProfilePage.vue`
**Auth:** Public (any user's profile can be viewed)

**Props:**

```ts
{
    profile: UserProfile
    stats: Record<string, number>   // counts per ListStatus
    avg_score: number | null
    episodes_watched: number
}
```

**Behavior:**
Displays a user's profile header (avatar via `UserAvatar`, name, member since date, timezone, bio) and anime statistics (per-status counts, total entries, episodes watched, mean score).

**Components used:** `AppLayout`, `UserAvatar`

---

### 3.10 SettingsPage

**File:** `resources/js/Pages/SettingsPage.vue`
**Auth:** Authenticated

**Props:**

```ts
{
    timezones: string[]
}
```

**Behavior:**
Two Inertia forms:
1. **Profile form** -- edits name, email, bio, timezone (searchable `Select`), and avatar URL. Submits via `PATCH` to `settings.profile`.
2. **Password form** -- changes password (current password, new password, confirmation). Submits via `PATCH` to `settings.password`. Resets on success.

Uses the local form controls: `AppInputText`, `AppTextarea`, `AppSelect`, `AppPassword`, `AppButton`.

**Components used:** `AppLayout`, the form controls in `Components/ui`

---

### 3.11 LoginPage

**File:** `resources/js/Pages/LoginPage.vue`
**Auth:** Public (guest only)

**Props:** None

**Behavior:**
Login form with email and password fields. Uses Inertia's `useForm` to POST to `route('login')`. Displays validation errors inline. Links to the registration page.

**Components used:** `AppLayout`

---

### 3.12 RegisterPage

**File:** `resources/js/Pages/RegisterPage.vue`
**Auth:** Public (guest only)

**Props:** None

**Behavior:**
Registration form with name, email, password, and password confirmation. Uses Inertia's `useForm` to POST to `route('register')`. Displays validation errors inline. Links to the login page.

**Components used:** `AppLayout`

---

### 3.13 ErrorPage

**File:** `resources/js/Pages/ErrorPage.vue`
**Auth:** N/A (standalone, no layout)

**Props:**

```ts
{
    status: number   // HTTP status code (403, 404, 500, 503)
}
```

**Behavior:**
Full-screen error page with no layout wrapper (`layout: false`). Renders its own dark background (`bg-gray-950`). Shows the numeric status code, a human-readable title, a description, and a "Go Home" link. Supports status codes 403, 404, 500, and 503 with custom messages.

**Components used:** None (standalone)

---

### 3.14 NotFoundPage

**File:** `resources/js/Pages/NotFoundPage.vue`
**Auth:** Public

**Props:** None

**Behavior:**
Simple 404 page using the standard `AppLayout`. Displays "404", "Page not found.", and a "Go Home" link pointing to `route('home')`.

**Components used:** `AppLayout`

---

## 4. Components

All components are in `resources/js/Components/`.

### Navigation

#### AppNavbar

**File:** `resources/js/Components/AppNavbar.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `user` | `User \| null` | Current authenticated user |
| `isAuthenticated` | `boolean` | Whether the user is logged in |

**Behavior:**
Sticky top navigation bar (`sticky top-0 z-50`) with backdrop blur. Contains:
- **Left:** AniTrack logo (links to home), desktop navigation links (Seasonal, Schedule, Search)
- **Right (authenticated):** "My List" link, user dropdown (avatar + name) with Profile, Settings, and Logout actions
- **Right (anonymous):** Login link and "Sign Up" button

The user dropdown toggles via click with a delayed close on blur. Logout is handled via `router.post(route('logout'))`.

---

#### SearchBar

**File:** `resources/js/Components/SearchBar.vue`

**Props:** None
**Emits:** None

**Behavior:**
Inline search input with a dropdown results panel. Uses the `useAnimeSearch` composable internally. The dropdown appears on focus when the query is >= 2 characters and disappears on blur (with a 200ms delay to allow clicking results). Shows:
- Loading state ("Searching...")
- Empty state ("No results found")
- Result list: thumbnail, title, format, year, score
- "View all N results" link (when total > 5) that navigates to `SearchPage` with the query parameter

---

### Anime Display

#### AnimeCard

**File:** `resources/js/Components/AnimeCard.vue`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `anime` | `AnimeCard` | required | Anime data to display |
| `viewMode` | `'grid' \| 'list'` | `'grid'` | Display mode |

**Behavior:**
Clickable card that links to the anime detail page. Two layouts:
- **Grid mode:** Cover image (3:4 aspect ratio) with score badge overlay at bottom, next airing episode badge at top-right, title below, format and episode count.
- **List mode:** Horizontal layout with small thumbnail, title, format, episodes, score badge, and up to 3 genre badges.

Handles both local anime (with `id`) and AniList-only anime (using `anilist_id` for the URL).

---

#### AnimeCardSkeleton

**File:** `resources/js/Components/AnimeCardSkeleton.vue`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `viewMode` | `'grid' \| 'list'` | -- | Display mode |

**Behavior:**
Animated loading placeholder matching the dimensions of `AnimeCard`. Uses `animate-pulse` with gray blocks for the image, title, and metadata areas.

---

#### AnimeHeroSection

**File:** `resources/js/Components/AnimeHeroSection.vue`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `anime` | `AnimeCard[]` | required | Array of anime to display |
| `title` | `string` | required | Section heading |
| `seeAllRoute` | `string \| undefined` | -- | URL for the "See All" link |

**Behavior:**
Horizontal showcase section with a title heading and optional "See All" link. Renders a 6-column grid of anime cards, each showing cover image with score overlay and title. Used on the `HomePage` for seasonal showcase and currently airing sections.

---

#### ScoreBadge

**File:** `resources/js/Components/ScoreBadge.vue`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `score` | `number \| null \| undefined` | -- | Score value to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |

**Behavior:**
Color-coded score badge. Renders nothing if score is null/undefined. Colors based on score value:
- >= 8.0: green
- >= 7.0: lime
- >= 6.0: yellow
- >= 5.0: orange
- < 5.0: red

Score is displayed with one decimal place via `toFixed(1)`.

---

#### GenreBadge

**File:** `resources/js/Components/GenreBadge.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Genre name |

**Behavior:**
Small rounded pill that links to the anime browse page filtered by that genre (`route('anime.index', { 'filter[genre]': name })`). Styled with `bg-gray-800` and hover highlight.

---

#### RelatedAnimeRow

**File:** `resources/js/Components/RelatedAnimeRow.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `relations` | `AnimeRelationEntry[]` | Array of related anime entries |

**Behavior:**
Horizontally scrollable row of related anime cards (136px wide each). Each card shows cover image, title (2-line clamp), and relation type label (e.g., "Sequel", "Prequel"). Only renders if `relations.length > 0`.

---

#### AiringScheduleTable

**File:** `resources/js/Components/AiringScheduleTable.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `schedules` | `AiringScheduleEntry[]` | Upcoming episode schedules |

**Behavior:**
Table showing upcoming episodes with columns: Episode number, Date (localized via `formatLocalDate`), and Countdown (via `formatCountdown` from `useCountdown`). Only renders if `schedules.length > 0`.

---

### List Management

#### AddToListButton

**File:** `resources/js/Components/AddToListButton.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `anime` | `AnimeCard` | The anime to add/edit |
| `initialEntry` | `ListEntryResource \| null` | Existing list entry, if any |

**Behavior:**
Displays either:
- "Add to List" button (`AppButton`) when no entry exists
- Status label button (showing current status like "Watching") when an entry exists

Clicking either opens the `ListEntryModal`.

---

#### ListEntryModal

**File:** `resources/js/Components/ListEntryModal.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `anime` | `AnimeCard` | The anime being edited |
| `entry` | `ListEntryResource \| null` | Existing entry (null for new) |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `close` | -- | Modal dismissed |
| `saved` | -- | Entry successfully saved |
| `deleted` | -- | Entry successfully deleted |

**Behavior:**
`AppDialog` modal with form fields:
- **Status:** dropdown (`Select`) with all 5 MAL statuses
- **Score:** slider (`Slider`) from 0-10 in 0.5 increments (stored as 0-100 internally)
- **Progress:** number input with total episode count displayed
- **Start/Finish dates:** date inputs
- **Notes:** expandable textarea (collapsed by default)

Footer has a "Remove" button (for existing entries), "Cancel", and "Save". Uses `useListMutations` for API calls (`storeMutation` for new, `updateMutation` for edit, `destroyMutation` for delete).

---

#### ListStatusTabs

**File:** `resources/js/Components/ListStatusTabs.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `activeStatus` | `ListStatus \| 'all'` | Currently selected tab |
| `counts` | `Record<string, number>` | Entry counts per status |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `ListStatus \| 'all'` | Tab selection changed |

**Behavior:**
Horizontal tab bar with tabs: All, Watching, Completed, Plan to Watch, On Hold, Dropped. Each tab shows the label and count in parentheses. Active tab has a primary-colored bottom border.

---

#### ListTableView

**File:** `resources/js/Components/ListTableView.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `entries` | `ListEntryResource[]` | List entries to display |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update` | `[id: number, patch: Record<string, unknown>]` | Inline field update |
| `delete` | `[id: number]` | Entry deletion |
| `edit` | `[entry: ListEntryResource]` | Open edit modal |

**Behavior:**
Full table view with columns: thumbnail, title (links to detail), status (inline `Select` dropdown), score (inline number input), progress (with "+" increment button), type/format, and last updated date. Empty state message when no entries.

---

#### ListCardView

**File:** `resources/js/Components/ListCardView.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `entries` | `ListEntryResource[]` | List entries to display |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `edit` | `[entry: ListEntryResource]` | Open edit modal |

**Behavior:**
Card grid (6 columns on large screens) showing cover images with gradient overlays displaying title, status label, score, and progress. Edit button appears on hover (top-right corner).

---

#### ListCompactView

**File:** `resources/js/Components/ListCompactView.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `entries` | `ListEntryResource[]` | List entries to display |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update` | `[id: number, patch: Record<string, unknown>]` | Inline field update |

**Behavior:**
Minimal row-based layout. Each row shows: linked title, inline status `Select` dropdown, score, progress with "+" button, and format. Compact text (`text-xs`), no images.

---

### Browse/Filter

#### FilterSidebar

**File:** `resources/js/Components/FilterSidebar.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `filters` | `BrowseFilters` | Current filter state |
| `genres` | `FilterOption[]` | Available genre options |
| `studios` | `FilterOption[]` | Available studio options |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update:filters` | `BrowseFilters` | Filter values changed |
| `apply` | -- | Filters should be applied |
| `clear` | -- | Filters should be cleared |

**Behavior:**
Vertical stack of `AppSelect` dropdowns for: Format (7 options), Status (5 options), Season (4 options), Year (dynamically generated from current year back to 1940), Genre (searchable, from server), Studio (searchable, from server). Each dropdown has a "show-clear" option to unset. A "Clear Filters" button at the bottom emits `clear`. Changing any filter immediately emits both `update:filters` and `apply`.

---

#### SortBar

**File:** `resources/js/Components/SortBar.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `sort` | `string \| undefined` | Current sort field |
| `total` | `number` | Total result count |
| `viewMode` | `'grid' \| 'list'` | Current view mode |

**Emits:**

| Event | Payload | Description |
|-------|---------|-------------|
| `update:sort` | `string \| undefined` | Sort option changed |
| `update:viewMode` | `'grid' \| 'list'` | View mode toggled |

**Behavior:**
Displays total result count, a sort dropdown (Popularity, Score, Trending, Favourites, Title A-Z/Z-A, Newest, Oldest), and grid/list view toggle buttons with SVG icons.

---

#### PaginationBar

**File:** `resources/js/Components/PaginationBar.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `currentPage` | `number` | Current page number |
| `lastPage` | `number` | Total number of pages |
| `total` | `number` | Total number of results |

**Behavior:**
Page navigation with Prev/Next buttons and numbered page buttons. Shows a window of 5 pages centered on the current page, with ellipsis and first/last page shortcuts. Hidden when `lastPage <= 1`. Navigates via `router.get()` preserving existing query parameters.

---

#### SeasonSelector

**File:** `resources/js/Components/SeasonSelector.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `year` | `number` | Current year |
| `season` | `AnimeSeason` | Current season |
| `adjacentSeasons` | `AdjacentSeasons` | Previous and next season/year pairs |

**Behavior:**
Navigation control showing the current season/year label with left/right arrow links to the previous and next seasons. Links use `route('seasonal', { year, season })`.

---

### Schedule

#### ScheduleDayColumn

**File:** `resources/js/Components/ScheduleDayColumn.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `utcDate` | `string` | UTC date string (YYYY-MM-DD) |
| `slots` | `ScheduleSlot[]` | Airing slots for this day |
| `isToday` | `boolean` | Whether this day is today |

**Behavior:**
Single day column in the schedule grid. Header shows the day label with special highlighting for today (primary-colored border and background). Lists airing slots with cover thumbnail, title, episode number, local air time, countdown, and score badge. Shows "No episodes" placeholder for empty days. Uses `useCountdown` for time formatting. Reads user timezone from shared Inertia props.

---

#### AiringTodaySection

**File:** `resources/js/Components/AiringTodaySection.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `slots` | `ScheduleSlot[]` | Today's airing schedule slots |

**Behavior:**
Dashboard section showing anime episodes airing today from the user's watching list. Renders a 3-column grid of cards, each showing cover thumbnail, title, episode number, local air time, countdown, and score badge. Links to the full schedule page. Filters out slots with null anime.

---

### Dashboard

#### DashboardStatsBar

**File:** `resources/js/Components/DashboardStatsBar.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `totalAnime` | `number` | Total anime in user's list |
| `episodesWatched` | `number` | Total episodes watched |
| `avgScore` | `number \| null` | Average score across list |
| `watchingCount` | `number` | Number of currently watching entries |

**Behavior:**
Four-column stat card grid showing Total Anime, Episodes Watched, Avg Score (one decimal), and Watching count (in primary color).

---

#### ContinueWatchingRow

**File:** `resources/js/Components/ContinueWatchingRow.vue`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `entries` | `ListEntryResource[]` | In-progress watching entries |

**Behavior:**
Horizontally scrollable row of anime cards (128px wide). Each card shows cover image with a progress bar overlay at the bottom and a progress badge (e.g., "5/12") at the top-right. Links to the anime detail page. Section header links to "My List".

---

### Forms

#### ImportWizard

**File:** `resources/js/Components/ImportWizard.vue`

**Props:** None
**Emits:** None

**Behavior:**
Multi-step wizard for importing MAL XML exports. Steps:

1. **Upload** -- file input (`.xml` only). Posts via `axios.post(route('import.upload'))` with `FormData`. Receives a token, preview entries, and total count.
2. **Preview** -- shows first 20 entries in a table (title, status, score, progress). Checkbox for "Overwrite existing entries". Confirm/Cancel buttons.
3. **Processing** -- progress bar (`AppProgressBar`). Polls `route('import.status')` every 2 seconds.
4. **Done** -- shows import results (imported, skipped, errors, total). Links to "Go to My List" and "Import Another".

Error handling displays a red banner above the current step.

---

#### UserAvatar

**File:** `resources/js/Components/UserAvatar.vue`

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | required | User's display name |
| `avatarUrl` | `string \| null` | `null` | Avatar image URL |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Avatar size |

**Behavior:**
Displays avatar image if `avatarUrl` is provided; otherwise renders a circular fallback with the user's initials on a deterministic HSL background color (derived from a hash of the name). Sizes: sm = 32px, md = 40px, lg = 80px.

---

## 5. Composables

All composables are in `resources/js/composables/`.

### useAnimeSearch

**File:** `resources/js/composables/useAnimeSearch.ts`

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `query` | `Ref<string>` | The raw search input (bind to `v-model`) |
| `debouncedQuery` | `Ref<string>` | Debounced version of query (300ms delay) |
| `results` | `ComputedRef<AnimeCard[]>` | Search result anime cards |
| `total` | `ComputedRef<number>` | Total number of results |
| `isLoading` | `Ref<boolean>` | Whether the query is in flight |
| `isError` | `Ref<boolean>` | Whether the last query errored |

**Behavior:**
Wraps TanStack Vue Query. Debounces the query input by 300ms, then fires a GET request to `/api/search?q=<query>` (only when query >= 2 characters). Results are cached for 15 minutes (`staleTime: 15 * 60 * 1000`). The query key includes the debounced query value so each unique search string gets its own cache entry.

---

### useListMutations

**File:** `resources/js/composables/useListMutations.ts`

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `storeMutation` | `UseMutationReturnType` | Creates a new list entry |
| `updateMutation` | `UseMutationReturnType` | Updates an existing list entry |
| `destroyMutation` | `UseMutationReturnType` | Deletes a list entry |

**Behavior:**
Three TanStack Vue Query mutations for list CRUD:
- **store:** `POST /api/list` with `ListEntryPayload` body. Returns `ListEntryResource`.
- **update:** `PATCH /api/list/{id}` with partial `ListEntryPayload`. Returns `ListEntryResource`.
- **destroy:** `DELETE /api/list/{id}`.

All three invalidate the `['myList']` query cache on success.

---

### useBrowseFilters

**File:** `resources/js/composables/useBrowseFilters.ts`

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `filters` | `BrowseFilters` (reactive) | Current filter state |
| `applyFilters` | `() => void` | Navigate to browse page with current filters |
| `clearFilters` | `() => void` | Reset all filters and navigate |
| `hasActiveFilters` | `ComputedRef<boolean>` | Whether any filter is set |

**Behavior:**
Initializes filter state from the current URL query parameters (e.g., `filter[format]`, `filter[status]`, `sort`). `applyFilters()` builds a query object and navigates via `router.get(route('anime.index'), query)` with `preserveState: true`. `clearFilters()` sets all filter fields to `undefined` and then calls `applyFilters()`.

---

### useFlashToast

**File:** `resources/js/composables/useFlashToast.ts`

**Returns:** Nothing (side effect only)

**Behavior:**
Watches the `flash.message` shared Inertia prop. When a non-null message appears, displays a toast (`useToast()`) with:
- **Severity** mapped from `flash.status`: `success`, `error` (mapped to `error`), `warning` (mapped to `warn`), `info`
- **Summary:** capitalized status string
- **Detail:** the flash message text
- **Duration:** 3 seconds (`life: 3000`)

The watcher is automatically stopped on component unmount.

---

### useDebounce

**File:** `resources/js/composables/useDebounce.ts`

**Signature:**

```ts
function useDebounce<T>(source: Ref<T>, delay?: number): Ref<T>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | `Ref<T>` | required | The reactive ref to debounce |
| `delay` | `number` | `300` | Debounce delay in milliseconds |

**Returns:** A new `Ref<T>` that updates only after the source has stopped changing for `delay` ms.

**Behavior:**
Generic debounce utility. Watches the source ref and updates the debounced ref after the specified delay. Cleans up the timeout on scope disposal via `onScopeDispose`.

---

### useCountdown

**File:** `resources/js/composables/useCountdown.ts`

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `now` | `Ref<number>` | Current timestamp (updated every 60 seconds) |
| `formatCountdown` | `(airsAt: string) => string` | Formats time remaining as "3d 5h", "2h 30m", "45m", or "Aired" |
| `formatLocalTime` | `(iso: string, timezone?: string) => string` | Formats ISO timestamp as local time (e.g., "09:30 PM") |
| `formatLocalDate` | `(iso: string, timezone?: string) => string` | Formats ISO timestamp as local date (e.g., "Mon, Mar 5") |

**Behavior:**
Module-level singleton timer shared across all component instances. Uses a reference counter to start/stop a single `setInterval` that updates `now` every 60 seconds. The first component to mount starts the timer; the last to unmount stops it. All three formatting functions accept an optional timezone string for localization.

---

## 6. Pinia Stores

Both stores are in `resources/js/stores/` and use the Composition API (setup) style.

### anime store

**File:** `resources/js/stores/anime.ts`
**Store ID:** `'anime'`

**State:**

| Property | Type | Description |
|----------|------|-------------|
| `currentSeason` | `Ref<AnimeSeason>` | Current anime season, computed from the current month |
| `currentYear` | `Ref<number>` | Current calendar year |

**Actions:**

| Method | Returns | Description |
|--------|---------|-------------|
| `getCurrentSeason()` | `AnimeSeason` | Determines season from current month: Jan-Mar = WINTER, Apr-Jun = SPRING, Jul-Sep = SUMMER, Oct-Dec = FALL |

---

### userList store

**File:** `resources/js/stores/userList.ts`
**Store ID:** `'userList'`

**State:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activeStatus` | `Ref<ListStatus>` | `'watching'` | Currently selected list status filter |

**Actions:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `setActiveStatus` | `status: ListStatus` | Updates the active status |

---

## 7. TypeScript Types

All type definitions are in `resources/js/types/` and re-exported via `resources/js/types/index.ts`.

### anime.ts

**Interfaces:**

#### AnimeCard

The compact representation used in lists, grids, and search results.

```ts
interface AnimeCard {
    id: number | null
    anilist_id: number
    title_romaji: string
    title_english: string | null
    format: AnimeFormat | null
    status: AnimeStatus | null
    season: AnimeSeason | null
    season_year: number | null
    episodes: number | null
    cover_image_medium: string | null
    cover_image_color: string | null
    average_score: number | null
    bayesian_score: number | null
    popularity: number | null
    genres: Genre[]
    next_airing_episode: AiringScheduleEntry | null
}
```

#### AnimeDetail

Extends `AnimeCard` with full detail fields. Used on the detail page.

```ts
interface AnimeDetail extends AnimeCard {
    anilist_id: number
    mal_id: number | null
    title_native: string | null
    title_synonyms: string[] | null
    source: string | null
    duration: number | null
    episode_count_unknown: boolean
    aired_from: string | null
    aired_to: string | null
    synopsis: string | null
    cover_image_large: string | null
    banner_image: string | null
    trailer_url: string | null
    mean_score: number | null
    trending: number | null
    favourites: number | null
    is_adult: boolean
    studios: StudioEntry[]
    external_ids: ExternalId[]
    airing_schedules: AiringScheduleEntry[]
    relations: AnimeRelationEntry[]
}
```

#### Anime

Legacy type alias: `type Anime = AnimeDetail`

#### Genre

```ts
interface Genre {
    id: number
    name: string
}
```

#### StudioEntry

Flattened studio representation returned by the API resource.

```ts
interface StudioEntry {
    id: number
    name: string
    is_animation_studio: boolean
    is_main: boolean
}
```

#### Studio

Full Eloquent-style studio with optional pivot.

```ts
interface Studio {
    id: number
    anilist_id: number
    name: string
    is_animation_studio: boolean
    pivot?: { is_main: boolean }
}
```

#### AiringScheduleEntry

Compact airing schedule entry (embedded in AnimeCard/AnimeDetail).

```ts
interface AiringScheduleEntry {
    id: number
    episode: number
    airs_at: string
}
```

#### AiringSchedule

Full airing schedule model.

```ts
interface AiringSchedule {
    id: number
    anime_id: number
    episode: number
    airs_at: string
    time_until_airing: number | null
}
```

#### AnimeRelationEntry

Relation as returned by the API resource (flattened).

```ts
interface AnimeRelationEntry {
    id: number
    relation_type: string
    related_anime: RelatedAnimeCard | null
}
```

#### RelatedAnimeCard

Minimal anime data for related anime display.

```ts
interface RelatedAnimeCard {
    id: number
    title_romaji: string
    title_english: string | null
    format: AnimeFormat | null
    status: AnimeStatus | null
    cover_image_medium: string | null
    cover_image_color: string | null
    average_score: number | null
    genres: Genre[]
}
```

#### AnimeRelation

Full Eloquent-style relation model.

```ts
interface AnimeRelation {
    id: number
    anime_id: number
    related_anime_id: number
    relation_type: string
    related_anime?: Anime
}
```

#### ExternalId

```ts
interface ExternalId {
    id: number
    platform: string
    external_id: string | null
    url: string | null
}
```

#### SeasonalGroup

```ts
interface SeasonalGroup {
    format: string
    anime: AnimeCard[]
}
```

#### AdjacentSeasons

```ts
interface AdjacentSeasons {
    previous: { year: number; season: AnimeSeason }
    next: { year: number; season: AnimeSeason }
}
```

#### BrowseFilters

```ts
interface BrowseFilters {
    format?: AnimeFormat
    status?: AnimeStatus
    season?: AnimeSeason
    season_year?: number
    genre?: string
    studio?: number
    sort?: string
}
```

#### FilterOption

```ts
interface FilterOption {
    id: number | string
    name: string
}
```

**Type Aliases:**

```ts
type AnimeFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC'
type AnimeStatus = 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS'
type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'
```

---

### list.ts

**Type Aliases:**

```ts
type ListStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch'
type ListViewMode = 'table' | 'card' | 'compact'
```

**Interfaces:**

#### ListEntryResource

API resource representation of a user's list entry.

```ts
interface ListEntryResource {
    id: number
    anime_id: number
    status: ListStatus
    score: number | null           // internal 0-100
    display_score: number | null   // display 0-10
    progress: number
    rewatch_count: number
    is_rewatching: boolean
    started_at: string | null
    completed_at: string | null
    notes: string | null
    tags: string[]
    is_private: boolean
    updated_at: string
    anime?: AnimeCard
}
```

#### UserAnimeListEntry

Full Eloquent-style model representation.

```ts
interface UserAnimeListEntry {
    id: number
    user_id: number
    anime_id: number
    status: ListStatus
    score: number
    progress: number
    rewatch_count: number
    started_at: string | null
    completed_at: string | null
    notes: string | null
    tags: string[] | null
    is_private: boolean
    is_rewatching: boolean
    anime?: AnimeCard
}
```

#### ListEntryPayload

Payload for creating/updating a list entry.

```ts
interface ListEntryPayload {
    anime_id: number
    status: ListStatus
    score?: number | null
    progress?: number
    started_at?: string | null
    completed_at?: string | null
    notes?: string | null
    is_private?: boolean
}
```

#### MalPreviewEntry

Preview of a MAL XML import entry.

```ts
interface MalPreviewEntry {
    mal_id: number | null
    title: string
    status: ListStatus
    score: number
    progress: number
    started_at: string | null
    completed_at: string | null
}
```

#### ImportResult

```ts
interface ImportResult {
    imported: number
    skipped: number
    errors: number
    total: number
}
```

#### ImportStatus

```ts
interface ImportStatus {
    status: 'pending' | 'processing' | 'done' | 'failed'
    processed: number
    total: number
    result?: ImportResult
}
```

**Constants:**

```ts
const LIST_STATUS_LABELS: Record<ListStatus, string> = {
    watching: 'Watching',
    completed: 'Completed',
    on_hold: 'On Hold',
    dropped: 'Dropped',
    plan_to_watch: 'Plan to Watch',
}
```

---

### api.ts

#### PaginatedResponse

Generic wrapper for Laravel paginated responses.

```ts
interface PaginatedResponse<T> {
    data: T[]
    meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
    links: {
        first: string | null
        last: string | null
        prev: string | null
        next: string | null
    }
}
```

#### ApiResponse

```ts
interface ApiResponse<T> {
    data: T
}
```

#### ApiError

```ts
interface ApiError {
    message: string
    errors?: Record<string, string[]>
}
```

#### SearchResponse

```ts
interface SearchResponse {
    data: AnimeCard[]
    query: string
    total: number
}
```

---

### schedule.ts

#### ScheduleAnime

Compact anime data included in schedule slots.

```ts
interface ScheduleAnime {
    id: number
    title_romaji: string
    title_english: string | null
    cover_image_medium: string | null
    cover_image_color: string | null
    average_score: number | null
    format: string | null
    episodes: number | null
    genres: Genre[]
}
```

#### ScheduleSlot

```ts
interface ScheduleSlot {
    id: number
    episode: number
    airs_at: string              // ISO8601 UTC
    anime: ScheduleAnime | null
}
```

#### ScheduleDayMap

```ts
type ScheduleDayMap = Record<string, ScheduleSlot[]>   // keyed by "YYYY-MM-DD"
```

---

### user.ts

#### User

Authenticated user (shared via Inertia props).

```ts
interface User {
    id: number
    name: string
    email: string
    avatar_url: string | null
    bio: string | null
    timezone: string
}
```

#### UserProfile

Public profile data (no email).

```ts
interface UserProfile {
    id: number
    name: string
    avatar_url: string | null
    bio: string | null
    timezone: string
    created_at: string
}
```

---

### Type Declaration Files

#### inertia.d.ts

Augments Inertia's `PageProps` interface to include the shared props injected by `HandleInertiaRequests` middleware:

```ts
declare module '@inertiajs/vue3' {
    interface PageProps {
        auth: {
            user: User | null
        }
        flash: {
            message: string | null
            status: string | null
        }
    }
}
```

#### vue-augment.d.ts

Augments Vue's `ComponentCustomProperties` so the Ziggy `route()` helper is recognized by TypeScript in templates:

```ts
declare module 'vue' {
    interface ComponentCustomProperties {
        route: (name: string, params?: Record<string, unknown> | unknown, absolute?: boolean) => string
    }
}
```

#### env.d.ts

Vite client types and module declarations:
- References `vite/client` types
- Declares `*.vue` modules as `DefineComponent`
- Declares the global `route()` function
- Declares the `ziggy-js` module exporting `ZiggyVue`

---

## 8. Auth Flow

### Session-Based Authentication

AniTrack uses standard Laravel session authentication served through Inertia. There are no API tokens or Sanctum SPA cookies.

### Login

1. User visits `/login` (renders `LoginPage`).
2. User fills in email and password.
3. `useForm({ email, password }).post(route('login'))` sends a POST request.
4. Laravel authenticates and redirects (Inertia handles the redirect as a client-side navigation).
5. On validation failure, Inertia populates `form.errors` which are displayed inline.

### Registration

1. User visits `/register` (renders `RegisterPage`).
2. User fills in name, email, password, and password confirmation.
3. `useForm({ name, email, password, password_confirmation }).post(route('register'))` sends a POST request.
4. Laravel creates the user, logs them in, and redirects.

### Logout

Triggered from the `AppNavbar` dropdown:

```ts
router.post(route('logout'))
```

### Shared Props

The `HandleInertiaRequests` middleware shares the following props on every page load:

```ts
{
    auth: {
        user: User | null     // null when not authenticated
    },
    flash: {
        message: string | null,
        status: string | null
    }
}
```

These are accessed via `usePage()` in layouts and pages.

### Protected vs. Public Pages

| Page | Access |
|------|--------|
| HomePage | Public (different content for auth/anon) |
| AnimeIndexPage | Public |
| AnimeDetailPage | Public (list button shown when authed) |
| SeasonalPage | Public |
| SchedulePage | Public (filter toggle when authed) |
| SearchPage | Public |
| ProfilePage | Public |
| MyListPage | Authenticated |
| SettingsPage | Authenticated |
| ImportPage | Authenticated |
| LoginPage | Guest only |
| RegisterPage | Guest only |
| ErrorPage | N/A |
| NotFoundPage | Public |

---

## 9. Search Flow

### Architecture

Search uses a two-layer approach: the `useAnimeSearch` composable for data fetching and two UI surfaces (SearchBar dropdown and SearchPage full results).

### Flow

1. **User types** in either `SearchBar` (navbar/home) or `SearchPage` (full page).
2. **`query` ref** is updated via `v-model`.
3. **`useDebounce`** delays the query by 300ms to avoid excessive requests.
4. **TanStack Vue Query** fires a GET request to `/api/search?q=<debouncedQuery>` when `debouncedQuery.length >= 2`.
5. **Server-side:** Laravel Scout searches the local database first. If 0 results are found, it falls back to querying the AniList GraphQL API.
6. **Response** is a `SearchResponse` (`{ data: AnimeCard[], query: string, total: number }`).
7. **Results are cached** for 15 minutes per query string.

### SearchBar (Dropdown)

- Located in the `AppNavbar` and `HomePage` hero section.
- Shows a floating dropdown below the input with search results.
- Displays up to ~5 results inline with thumbnails.
- "View all N results" link navigates to `SearchPage?q=<query>`.
- Dropdown opens on focus, closes on blur (200ms delay).

### SearchPage (Full Results)

- Reads `?q=` from the URL on mount to pre-fill the search.
- Displays results in a 5-column grid of `AnimeCard` components.
- Shows loading state, empty state, and "type at least 2 characters" prompt.

---

## 10. List Management Flow

### Architecture

List management uses `useListMutations` (TanStack Vue Query mutations via axios) for all CRUD operations and `ListEntryModal` (`AppDialog`) for the edit form.

### Adding an Entry

1. User clicks "Add to List" on `AnimeDetailPage` (via `AddToListButton`).
2. `ListEntryModal` opens with default status `plan_to_watch`.
3. User sets status, score (0-10 slider), progress, dates, and notes.
4. On save, `storeMutation` fires `POST /api/list` with `ListEntryPayload`.
5. Score is converted from display (0-10) to internal (0-100) before sending: `Math.round(displayScore * 10)`.
6. On success, the `['myList']` query cache is invalidated.

### Editing an Entry

1. User clicks an existing status button on `AnimeDetailPage`, or clicks edit on `MyListPage`.
2. `ListEntryModal` opens pre-filled with the existing entry data.
3. On save, `updateMutation` fires `PATCH /api/list/{id}`.
4. Cache is invalidated on success.

### Inline Editing (MyListPage)

- **Status change:** `ListTableView` and `ListCompactView` have inline `Select` dropdowns. Changes emit `update` with `{ status }`.
- **Score change:** `ListTableView` has an inline number input. Changes emit `update` with `{ score }` (converted to 0-100).
- **Progress increment:** "+" button emits `update` with `{ progress: currentProgress + 1 }`.
- All inline updates go through `updateMutation.mutate()`.

### Deleting an Entry

1. User clicks "Remove" in the `ListEntryModal` footer.
2. `destroyMutation` fires `DELETE /api/list/{id}`.
3. Cache is invalidated; modal emits `deleted`.

### View Modes

`MyListPage` supports three view modes persisted to `localStorage` (key: `list_view`):

| Mode | Component | Features |
|------|-----------|----------|
| `table` | `ListTableView` | Full table with thumbnails, inline status/score/progress editing, type, updated date |
| `card` | `ListCardView` | Image grid with overlay info, hover-to-edit button |
| `compact` | `ListCompactView` | Minimal rows with inline status and progress controls, no images |

### Client-Side Sorting

`MyListPage` sorts entries client-side using a `sortField` ref. Available sort options:

| Label | Value | Sort Logic |
|-------|-------|------------|
| Last Updated | `-updated_at` | By `updated_at` descending |
| Score | `-score` | By `score` descending (null = -1) |
| Title | `title` | By English/romaji title ascending |
| Progress | `-progress` | By `progress` descending |

The sort field prefix `-` indicates descending order.

### Client-Side Filtering

Entries are filtered by the `activeStatus` tab selection. When set to `all`, no filtering is applied. Otherwise, entries are filtered to match the selected `ListStatus`.
