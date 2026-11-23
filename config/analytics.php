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

    /*
    |--------------------------------------------------------------------------
    | Consent Mode default (card 5529)
    |--------------------------------------------------------------------------
    |
    | Visitors in these regions (EEA, UK, Switzerland: ISO 3166-1 codes) start
    | with Google's ad and analytics storage denied, so the tag sets no
    | cookies before they answer the consent message. Google's Privacy &
    | messaging CMP (loaded by AdSense) then sends the visitor's choice as a
    | consent update. wait_for_update gives it that long, in ms, first.
    |
    */

    'consent_denied_regions' => [
        'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR',
        'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT',
        'RO', 'SE', 'SI', 'SK',
    ],

    'consent_wait_for_update' => 500,
];
