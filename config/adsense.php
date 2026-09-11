<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google AdSense
    |--------------------------------------------------------------------------
    |
    | The publisher ID ("client") identifies the account. It is public — it is
    | shipped in the page markup — so it is safe to keep a default here.
    |
    | The slot ID identifies one ad unit created in the AdSense dashboard. The
    | ad bar only renders when a slot is configured, so leaving this empty
    | disables the unit without touching the code.
    |
    */

    'client' => env('ADSENSE_CLIENT', 'ca-pub-2580714906111016'),

    'slot' => env('ADSENSE_SLOT'),
];
