<?php

/*
 * Card 5710: the route list printed by @routes (and given to the SSR server)
 * leaves the admin and Horizon routes out for everyone but admins. See
 * App\Support\ZiggyGroup.
 */
return [
    'groups' => [
        'public' => ['!admin.*', '!horizon.*'],
    ],
];
