<?php

/*
|--------------------------------------------------------------------------
| Trusted proxies (card 5703, copied from MCPacks #5525)
|--------------------------------------------------------------------------
|
| anitrack.app sits behind Cloudflare, so the address PHP sees is Cloudflare's
| edge, not the visitor. Trusting Cloudflare's ranges makes $request->ip()
| the visitor again (from X-Forwarded-For, which Cloudflare appends to), so
| rate limits (throttle:auth, the AniList fetch cap) and the IPs stored with
| API tokens are per visitor, not per Cloudflare edge.
| Only X-Forwarded-For and X-Forwarded-Proto are trusted (bootstrap/app.php):
| Cloudflare passes a visitor's own X-Forwarded-Host through untouched.
|
| A request from any other address keeps its REMOTE_ADDR and its forwarded
| headers are ignored. Ranges from https://www.cloudflare.com/ips (checked
| Nov 23, 2026). TRUSTED_PROXIES (comma separated) replaces the list.
|
*/

$cloudflare = [
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
];

return [
    'proxies' => env('TRUSTED_PROXIES') ?: $cloudflare,
];
