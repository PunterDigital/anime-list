<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Which Ziggy route group a visitor gets (card 5710): admins get every
 * route, everyone else the `public` group from config/ziggy.php (no admin.*
 * or horizon.* names).
 *
 * The browser keeps the list @routes printed on the first page load for as
 * long as the document lives, so admin pages are always entered with a full
 * page load: the navbar's Admin link is a plain <a>, and a sign-in whose
 * target is an admin page answers with Inertia::location().
 */
final class ZiggyGroup
{
    public static function for(?Request $request): ?string
    {
        return $request?->user()?->is_admin ? null : 'public';
    }

    public static function isAdminPath(string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '/';

        return $path === '/admin' || str_starts_with($path, '/admin/');
    }
}
