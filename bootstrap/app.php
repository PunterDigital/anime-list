<?php

use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureFeatureActive;
use App\Http\Middleware\EnsureIsAdmin;
use App\Http\Middleware\EnsurePublicApiEnabled;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\TrackSanctumTokenUsage;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Inertia\Inertia;
use Sentry\Laravel\Integration;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            SecurityHeaders::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'webauthn/*',
            'api/v1/*',
        ]);

        $middleware->alias([
            'verified' => EnsureEmailIsVerified::class,
            'admin' => EnsureIsAdmin::class,
            'role' => EnsureUserHasRole::class,
            'public-api' => EnsurePublicApiEnabled::class,
            'feature' => EnsureFeatureActive::class,
            'track-token-usage' => TrackSanctumTokenUsage::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if (! in_array($response->getStatusCode(), [403, 404, 419, 451, 500, 503])) {
                return $response;
            }

            // JSON / API clients should receive JSON errors rather than the
            // Inertia error page.
            if ($request->expectsJson() || $request->is('api/*')) {
                return $response;
            }

            if (! app()->bound('csp-nonce')) {
                $nonce = base64_encode(random_bytes(16));
                app()->instance('csp-nonce', $nonce);
                Vite::useCspNonce($nonce);
            }

            return Inertia::render('ErrorPage', [
                'status' => $response->getStatusCode(),
            ])
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        });
    })->create();
