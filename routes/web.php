<?php

use App\Http\Controllers\Admin\AdminAnimeController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFeatureFlagController;
use App\Http\Controllers\Admin\AdminJobObservabilityController;
use App\Http\Controllers\Admin\AdminRoleController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\AnimeController;
use App\Http\Controllers\Api\V1\AnimeController as ApiAnimeController;
use App\Http\Controllers\Api\V1\AuthController as ApiAuthController;
use App\Http\Controllers\Api\V1\ListController as ApiListController;
use App\Http\Controllers\Api\V1\SearchController as ApiSearchController;
use App\Http\Controllers\Api\V1\UserController as ApiUserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasskeyController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\DevelopersController;
use App\Http\Controllers\DiscoverController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\PeopleController;
use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SeasonalController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\StudioController;
use App\Http\Controllers\TopAnimeController;
use App\Http\Controllers\UserListController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Sitemap
Route::get('/sitemap.xml', SitemapController::class);

// Public pages
Route::get('/', [DiscoverController::class, 'index'])->name('home');
Route::get('/welcome', WelcomeController::class)->name('welcome');
Route::get('/anime', [AnimeController::class, 'index'])->name('anime.index');
Route::get('/anime/{id}', function (int $id) {
    $anime = \App\Models\Anime::find($id);
    if (! $anime) {
        abort(404);
    }

    return redirect()->route('anime.show', $anime, 301);
})->where('id', '[0-9]+');
Route::get('/anime/al/{anilistId}', [AnimeController::class, 'showByAnilistId'])->where('anilistId', '[0-9]+')->name('anime.show.anilist');
Route::get('/anime/{anime:slug}', [AnimeController::class, 'show'])->name('anime.show');
Route::get('/seasonal', [SeasonalController::class, 'index'])->name('seasonal');
Route::get('/schedule', ScheduleController::class)->name('schedule');
Route::get('/search', function (\Illuminate\Http\Request $request) {
    $params = [];
    $q = trim((string) $request->query('q', ''));
    if ($q !== '') {
        $params['filter[search]'] = $q;
    }

    return redirect()->route('anime.index', $params, 301);
})->name('search');
Route::get('/terms', fn () => Inertia::render('TermsPage'))->name('terms');
Route::get('/privacy', fn () => Inertia::render('PrivacyPage'))->name('privacy');
Route::get('/developers', [DevelopersController::class, 'index'])->name('developers');
Route::get('/alternatives', fn () => Inertia::render('AlternativesPage'))->name('alternatives');
Route::get('/top', [TopAnimeController::class, 'rated'])->name('top.rated');
Route::get('/top/popular', [TopAnimeController::class, 'popular'])->name('top.popular');

// Discover is now the home page; keep /discover as a permanent redirect for old links.
Route::permanentRedirect('/discover', '/');
Route::get('/api/discover/mood/{slug}', [DiscoverController::class, 'mood'])
    ->middleware('throttle:api')
    ->where('slug', '[a-z0-9-]+')
    ->name('api.discover.mood');

// JSON search endpoint
Route::get('/api/search', SearchController::class)->middleware('throttle:api')->name('api.search');

// Public playlist
Route::get('/playlist/{playlist:slug}', [PlaylistController::class, 'show'])->name('playlist.show');

// Studios & producers
Route::get('/studios', [StudioController::class, 'index'])->name('studios.index');
Route::get('/studios/{studio:slug}', [StudioController::class, 'show'])->name('studios.show');
Route::get('/producers', [StudioController::class, 'producersIndex'])->name('producers.index');
Route::get('/producers/{studio:slug}', [StudioController::class, 'producerShow'])->name('producers.show');

// Voice actors / people
Route::get('/people', [PeopleController::class, 'index'])->name('people.index');
Route::get('/people/{person:slug}', [PeopleController::class, 'show'])->name('people.show');

// Public profile
Route::get('/user/{user:username}/list', [ProfileController::class, 'list'])->name('profile.list');
Route::get('/user/{user:username}', [ProfileController::class, 'show'])->name('profile.show');

// Guest-only (auth)
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->middleware('throttle:auth');
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->middleware('throttle:auth');

    Route::post('/webauthn/login/options', [PasskeyController::class, 'loginOptions'])
        ->middleware('throttle:auth')
        ->name('webauthn.login.options');
    Route::post('/webauthn/login', [PasskeyController::class, 'login'])
        ->middleware('throttle:auth')
        ->name('webauthn.login');
});

// Authenticated
Route::middleware('auth')->group(function () {
    Route::get('/list', [UserListController::class, 'index'])->name('list');
    Route::get('/list/export', [UserListController::class, 'export'])->name('list.export');

    Route::prefix('api/list')->middleware('throttle:api')->name('api.list.')->group(function () {
        Route::post('/', [UserListController::class, 'store'])->name('store');
        Route::patch('/{entry}', [UserListController::class, 'update'])->name('update');
        Route::delete('/{entry}', [UserListController::class, 'destroy'])->name('destroy');
    });

    Route::get('/import', [ImportController::class, 'show'])->name('import');
    Route::post('/import/upload', [ImportController::class, 'upload'])->name('import.upload');
    Route::post('/import/confirm', [ImportController::class, 'confirm'])->name('import.confirm');
    Route::get('/import/status', [ImportController::class, 'status'])->name('import.status');

    Route::get('/playlists', [PlaylistController::class, 'index'])->name('playlists.index');
    Route::get('/playlists/create', [PlaylistController::class, 'create'])->name('playlists.create');
    Route::get('/playlists/{playlist:slug}/edit', [PlaylistController::class, 'edit'])->name('playlists.edit');

    Route::prefix('api/playlists')->middleware('throttle:api')->name('api.playlists.')->group(function () {
        Route::post('/', [PlaylistController::class, 'store'])->name('store');
        Route::patch('/{playlist:id}', [PlaylistController::class, 'update'])->name('update');
        Route::delete('/{playlist:id}', [PlaylistController::class, 'destroy'])->name('destroy');
        Route::post('/{playlist:id}/items', [PlaylistController::class, 'addItem'])->name('items.store');
        Route::patch('/{playlist:id}/items/{item}', [PlaylistController::class, 'updateItem'])->name('items.update');
        Route::delete('/{playlist:id}/items/{item}', [PlaylistController::class, 'removeItem'])->name('items.remove');
        Route::patch('/{playlist:id}/reorder', [PlaylistController::class, 'reorder'])->name('reorder');
    });

    Route::get('/settings', [SettingsController::class, 'show'])->name('settings');
    Route::patch('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
    Route::patch('/settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password');
    Route::post('/settings/api-tokens', [SettingsController::class, 'createApiToken'])->name('settings.api-tokens.store');
    Route::delete('/settings/api-tokens/{token}', [SettingsController::class, 'destroyApiToken'])->whereNumber('token')->name('settings.api-tokens.destroy');

    Route::post('/webauthn/register/options', [PasskeyController::class, 'registerOptions'])->name('webauthn.register.options');
    Route::post('/webauthn/register', [PasskeyController::class, 'register'])->name('webauthn.register');
    Route::patch('/settings/passkeys/{passkey}', [PasskeyController::class, 'update'])->name('settings.passkeys.update');
    Route::delete('/settings/passkeys/{passkey}', [PasskeyController::class, 'destroy'])->name('settings.passkeys.destroy');

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

// Public API v1 — consumed by the Chrome extension and third-party integrations.
// Gated behind the `public-api` Pennant flag so it can be rolled out per user.
Route::prefix('api/v1')->name('api.v1.')->middleware('throttle:api')->group(function () {
    // Token issuance (credentials → bearer token). Stricter rate limiting to
    // deter credential stuffing.
    Route::post('/auth/token', [ApiAuthController::class, 'issueToken'])
        ->middleware('throttle:auth')
        ->name('auth.token');

    // All remaining endpoints require a Sanctum bearer token AND the feature
    // flag to be active for the authenticated user.
    Route::middleware(['auth:sanctum', 'public-api', 'track-token-usage'])->group(function () {
        // Token management
        Route::get('/auth/tokens', [ApiAuthController::class, 'listTokens'])->name('auth.tokens.index');
        Route::delete('/auth/token', [ApiAuthController::class, 'revokeCurrentToken'])->name('auth.token.revoke');
        Route::delete('/auth/tokens/{token}', [ApiAuthController::class, 'revokeToken'])
            ->whereNumber('token')
            ->name('auth.tokens.revoke');

        // Current user
        Route::get('/user', [ApiUserController::class, 'me'])->name('user.me');

        // Anime lookup
        Route::get('/anime/search', ApiSearchController::class)->name('anime.search');
        Route::get('/anime/anilist/{anilistId}', [ApiAnimeController::class, 'showByAnilistId'])
            ->whereNumber('anilistId')
            ->name('anime.anilist');
        Route::get('/anime/{anime:slug}', [ApiAnimeController::class, 'show'])->name('anime.show');

        // List CRUD
        Route::get('/list', [ApiListController::class, 'index'])->name('list.index');
        Route::get('/list/anime/{anime:id}', [ApiListController::class, 'showByAnime'])->name('list.show-anime');
        Route::post('/list', [ApiListController::class, 'store'])->name('list.store');
        Route::patch('/list/{entry}', [ApiListController::class, 'update'])->name('list.update');
        Route::delete('/list/{entry}', [ApiListController::class, 'destroy'])->name('list.destroy');
    });
});

// Admin
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/users', [AdminUserController::class, 'index'])->name('users');
    Route::get('/users/search', [AdminUserController::class, 'search'])->name('users.search');
    Route::patch('/users/{user}/toggle-admin', [AdminUserController::class, 'toggleAdmin'])->name('users.toggle-admin');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

    Route::get('/anime', [AdminAnimeController::class, 'index'])->name('anime.index');
    Route::get('/anime/{anime:id}/edit', [AdminAnimeController::class, 'edit'])->name('anime.edit');
    Route::patch('/anime/{anime:id}', [AdminAnimeController::class, 'update'])->name('anime.update');
    Route::delete('/anime/{anime:id}/rewrite', [AdminAnimeController::class, 'reset'])->name('anime.reset');

    Route::get('/features', [AdminFeatureFlagController::class, 'index'])->name('features');
    Route::patch('/features/{feature}', [AdminFeatureFlagController::class, 'update'])->name('features.update');
    Route::post('/features/{feature}/users', [AdminFeatureFlagController::class, 'activateForUser'])->name('features.activate-user');
    Route::delete('/features/{feature}/users/{user}', [AdminFeatureFlagController::class, 'deactivateForUser'])->name('features.deactivate-user');

    Route::get('/roles', [AdminRoleController::class, 'index'])->name('roles');
    Route::post('/roles/{role}/users', [AdminRoleController::class, 'assign'])->name('roles.assign');
    Route::delete('/roles/{role}/users/{user}', [AdminRoleController::class, 'remove'])->name('roles.remove');

    Route::get('/jobs', [AdminJobObservabilityController::class, 'index'])->name('jobs');
    Route::post('/jobs/anime', [AdminJobObservabilityController::class, 'enqueueAnime'])->name('jobs.enqueue-anime');
    Route::post('/jobs/sync/incremental', [AdminJobObservabilityController::class, 'enqueueIncrementalSync'])->name('jobs.sync.incremental');
    Route::post('/jobs/sync/stale-refresh', [AdminJobObservabilityController::class, 'enqueueStaleRefresh'])->name('jobs.sync.stale-refresh');
    Route::delete('/jobs/refresh-exclusions', [AdminJobObservabilityController::class, 'clearRefreshExclusions'])->name('jobs.refresh-exclusions.clear');
    Route::delete('/jobs/failed', [AdminJobObservabilityController::class, 'flushFailed'])->name('jobs.failed.flush');
    Route::get('/jobs/failed/{uuid}', [AdminJobObservabilityController::class, 'showFailed'])->name('jobs.failed.show');
    Route::post('/jobs/failed/{uuid}/retry', [AdminJobObservabilityController::class, 'retryFailed'])->name('jobs.failed.retry');
    Route::delete('/jobs/failed/{uuid}', [AdminJobObservabilityController::class, 'forgetFailed'])->name('jobs.failed.forget');
});
