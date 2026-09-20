<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Contact Form
    |--------------------------------------------------------------------------
    |
    | Every submission is stored in the contact_messages table. When a
    | recipient address is configured, a copy is also emailed there with the
    | sender set as reply-to. Leave it empty to keep messages database-only.
    |
    */

    'to' => env('CONTACT_TO_ADDRESS', env('MAIL_FROM_ADDRESS')),
];
