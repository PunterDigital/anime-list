<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Business Information
    |--------------------------------------------------------------------------
    |
    | Legal operator details shown in the site footer and on the contact page.
    | Kept in config (rather than hard-coded in Vue) so there is one source of
    | truth that both the frontend and any server-rendered output can share.
    |
    */

    'name' => env('BUSINESS_NAME', 'Shay Stephan Lee Punter'),

    'address' => [
        'street' => env('BUSINESS_STREET', 'Korunní 2569/108'),
        'district' => env('BUSINESS_DISTRICT', 'Vinohrady, Praha'),
        'postcode' => env('BUSINESS_POSTCODE', '101 00'),
        'country' => env('BUSINESS_COUNTRY', 'Czech Republic'),
    ],

    'business_number' => env('BUSINESS_NUMBER', '23507101'),

    'vat_number' => env('BUSINESS_VAT_NUMBER', 'CZ0003091869'),
];
