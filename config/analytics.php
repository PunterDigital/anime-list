<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google tag (Analytics + Ads)
    |--------------------------------------------------------------------------
    |
    | Both IDs are public: they are shipped in the page markup. Set either to
    | an empty value to leave it out; with both empty the Google tag is not
    | loaded at all (the E2E suite does this so test runs never record visits).
    |
    */

    'ga_id' => env('GOOGLE_ANALYTICS_ID', 'G-4K6RNYTM27'),

    'ads_id' => env('GOOGLE_ADS_ID', 'AW-18128258525'),
];
