<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * For actions that add a way into the account, such as a new passkey (card
 * 5529): the password must have been confirmed (settings.confirm-password) in
 * the last auth.password_timeout seconds. Answers 423, as Laravel's own
 * password.confirm middleware does for JSON requests, but never redirects:
 * AniTrack has no confirm-password page, and these routes are JSON only.
 */
class EnsurePasswordRecentlyConfirmed
{
    public function handle(Request $request, Closure $next): Response
    {
        $confirmedAt = (int) $request->session()->get('auth.password_confirmed_at', 0);

        abort_if(
            time() - $confirmedAt > (int) config('auth.password_timeout', 10800),
            423,
            'Confirm your password first.',
        );

        return $next($request);
    }
}
