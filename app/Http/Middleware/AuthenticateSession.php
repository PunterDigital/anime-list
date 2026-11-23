<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\SessionGuard;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\AuthenticateSession as BaseAuthenticateSession;

/**
 * Laravel's AuthenticateSession, in the web group, so a password change or
 * reset signs every other browser out: their session's password hash no
 * longer matches (card 5529). /api/v1 is in the web group too, and there
 * `auth:sanctum` makes the token guard the default before this runs; the base
 * class then calls `viaRemember()` on Sanctum's RequestGuard (a 500). Token
 * requests have no session sign-in to check, so they pass straight through.
 */
class AuthenticateSession extends BaseAuthenticateSession
{
    public function handle($request, Closure $next)
    {
        /** @var Request $request */
        if (! $this->auth->guard() instanceof SessionGuard) {
            return $next($request);
        }

        return parent::handle($request, $next);
    }
}
