<?php

namespace App\Providers;

use App\Services\AniListClient;
use App\Services\FeatureFlagService;
use GuzzleHttp\Client;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(FeatureFlagService::class);

        $this->app->singleton(AniListClient::class, function ($app) {
            $guzzle = new Client([
                'base_uri' => config('anilist.endpoint'),
                'timeout' => config('anilist.http.timeout'),
                'connect_timeout' => config('anilist.http.connect_timeout'),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ],
            ]);

            return new AniListClient(
                http: $guzzle,
                requestsPerMinute: config('anilist.rate_limit.requests_per_minute'),
                maxRetries: config('anilist.retry.max_attempts'),
                backoffBase: config('anilist.retry.backoff_base_seconds'),
                rateLimitBackoff: config('anilist.retry.rate_limit_backoff_seconds'),
                serviceUnavailableBackoff: config('anilist.retry.service_unavailable_backoff_seconds'),
                storeRawResponses: config('anilist.sync.store_raw_responses'),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });

        RateLimiter::for('auth', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
            Limit::perMinute(5)->by($request->string('email')->lower()->toString()),
        ]);

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));

        RateLimiter::for('contact', fn (Request $request) => Limit::perMinute(5)->by($request->user()?->id ?: $request->ip()));

        $this->defineFeatureFlags();
    }

    private function defineFeatureFlags(): void
    {
        Feature::define('playlists', fn ($user) => false);
        Feature::define('studio-pages', fn ($user) => false);
        Feature::define('voice-actor-pages', fn ($user) => false);
        Feature::define('public-api', fn ($user) => false);
        Feature::define('picked-for-you', fn ($user) => false);
        Feature::define('episodes-tab', fn ($user) => true);
        Feature::define('landing-page', fn ($user) => false);
        Feature::define('ads', fn ($user) => false);
        Feature::define('company-pages', fn ($user) => false);
    }
}
