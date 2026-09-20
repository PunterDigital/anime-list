<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cloudflare Turnstile
    |--------------------------------------------------------------------------
    |
    | Protects the contact form from bots when the visitor is not signed in.
    | The site key is public (it ships in the page markup); the secret key is
    | only ever used server-side to verify a token.
    |
    | Cloudflare publishes test key pairs for local development. The pair
    | below always passes, so the form works out of the box in dev. Both
    | values must be replaced with real keys in production.
    |
    */

    'site_key' => env('TURNSTILE_SITE_KEY', '1x00000000000000000000AA'),

    'secret_key' => env('TURNSTILE_SECRET_KEY', '1x0000000000000000000000000000000AA'),

    'verify_url' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
];
