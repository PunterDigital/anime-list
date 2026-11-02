<?php

namespace App\Support;

/**
 * Validates a "come back here after signing in" target (the `redirect` query
 * parameter on /login and /register). Only a path on this site is accepted, so
 * the parameter can't be used as an open redirect to another site.
 */
class RedirectPath
{
    private const MAX_LENGTH = 2000;

    /**
     * Return the value if it is a safe same-site path ("/anime/cowboy-bebop"),
     * otherwise null.
     */
    public static function sanitize(mixed $value): ?string
    {
        if (! is_string($value) || $value === '' || strlen($value) > self::MAX_LENGTH) {
            return null;
        }

        // A path, not a URL: "https://...", "evil.com", "javascript:..." all fail here.
        if ($value[0] !== '/') {
            return null;
        }

        // Browsers read "//evil.com" (and "/\evil.com") as a link to another host.
        if (str_contains($value, '\\') || str_starts_with($value, '//')) {
            return null;
        }

        // Browsers strip tabs and newlines from URLs ("/\t/evil.com" becomes
        // "//evil.com"), so refuse any whitespace or control character.
        if (preg_match('/[\s\x00-\x1F\x7F]/', $value) === 1) {
            return null;
        }

        $parts = parse_url($value);

        if ($parts === false || isset($parts['scheme']) || isset($parts['host'])) {
            return null;
        }

        return $value;
    }
}
