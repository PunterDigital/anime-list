<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        // Horizon serves its own assets; skip CSP for its routes
        if ($request->is('horizon*')) {
            return $next($request);
        }

        $nonce = base64_encode(random_bytes(16));
        app()->instance('csp-nonce', $nonce);
        Vite::useCspNonce($nonce);

        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        $isLocal = app()->environment('local');

        // AdSense loads its ad code from several Google hosts and frames the
        // creatives from others. The nonce on the loader tag is propagated by
        // AdSense to the scripts it injects, so no 'unsafe-inline' is needed.
        $adsense = 'https://pagead2.googlesyndication.com https://partner.googleadservices.com '
            .'https://tpc.googlesyndication.com https://googleads.g.doubleclick.net '
            .'https://www.googletagservices.com https://adservice.google.com '
            .'https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google';

        // Cloudflare Turnstile (contact form captcha) loads its widget script
        // from, and renders its challenge iframe on, this single host.
        $turnstile = 'https://challenges.cloudflare.com';

        $scriptSrc = $isLocal
            ? "script-src 'self' http://localhost:5173 'unsafe-inline' 'nonce-{$nonce}' {$adsense} {$turnstile}; "
            : "script-src 'self' 'nonce-{$nonce}' https://www.googletagmanager.com {$adsense} {$turnstile}; ";

        $connectSrc = $isLocal
            ? "connect-src 'self' ws://localhost:5173 {$adsense}; "
            : "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com {$adsense}; ";

        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; "
            .$scriptSrc
            ."style-src 'self' 'unsafe-inline'; "
            ."img-src 'self' https://s4.anilist.co https://img.anilist.co https://img1.ak.crunchyroll.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://*.googlesyndication.com https://*.doubleclick.net https://www.google.com https://*.gstatic.com data:; "
            ."font-src 'self'; "
            .$connectSrc
            ."worker-src 'self' blob:; "
            ."frame-src https://www.youtube.com https://www.dailymotion.com {$adsense} https://www.google.com {$turnstile}; "
            ."frame-ancestors 'none'"
        );

        return $response;
    }
}
