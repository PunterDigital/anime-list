<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
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
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'webauthn/*',
            'api/v1/*',
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'admin' => \App\Http\Middleware\EnsureIsAdmin::class,
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'public-api' => \App\Http\Middleware\EnsurePublicApiEnabled::class,
            'feature' => \App\Http\Middleware\EnsureFeatureActive::class,
            'track-token-usage' => \App\Http\Middleware\TrackSanctumTokenUsage::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);

        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            if (! in_array($response->getStatusCode(), [403, 404, 419, 500, 503])) {
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
                \Illuminate\Support\Facades\Vite::useCspNonce($nonce);
            }

            return Inertia::render('ErrorPage', [
                'status' => $response->getStatusCode(),
            ])
                ->toResponse($request)
                ->setStatusCode($response->getStatusCode());
        });
    })->create();
