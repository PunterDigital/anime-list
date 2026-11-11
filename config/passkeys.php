<?php

/*
 * laravel/passkeys (card 4237). AniTrack registers its own passkey routes
 * (routes/web.php, `PasskeyController`), so the package's routes are switched
 * off in AppServiceProvider and the route-only keys (middleware, throttle,
 * redirect) don't apply.
 */

$appUrl = (string) config('app.url');
$appHost = parse_url($appUrl, PHP_URL_HOST) ?: 'localhost';
$appPort = parse_url($appUrl, PHP_URL_PORT);

// Forge's default APP_URL is http:// even once the site has a certificate, so
// the https origin of the same host is always allowed too. WEBAUTHN_ORIGINS
// (comma separated) is kept from laragear's config.
$origins = array_filter([
    rtrim($appUrl, '/'),
    'https://'.$appHost.($appPort ? ':'.$appPort : ''),
    ...array_map('trim', explode(',', (string) env('WEBAUTHN_ORIGINS'))),
]);

return [

    // The domain passkeys are bound to. Laragear read WEBAUTHN_ID, so it still does.
    'relying_party_id' => env('WEBAUTHN_ID') ?: $appHost,

    'allowed_origins' => array_values(array_unique($origins)),

    // Derives the user handle for passkeys registered from now on. Passkeys copied
    // from laragear keep the handle their authenticator already holds.
    'user_handle_secret' => env('PASSKEYS_USER_HANDLE_SECRET') ?: config('app.key'),

    'timeout' => 60000,

    'guard' => 'web',

    'middleware' => ['web'],

    'management_middleware' => [],

    'throttle' => null,

    'redirect' => '/',

];
