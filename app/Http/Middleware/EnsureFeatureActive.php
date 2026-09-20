<?php

namespace App\Http\Middleware;

use App\Services\FeatureFlagService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureFeatureActive
{
    public function __construct(
        private readonly FeatureFlagService $flags,
    ) {}

    /**
     * Respond 404 unless the named Pennant flag is active for the viewer.
     *
     * Usage: ->middleware('feature:company-pages')
     *
     * Resolution goes through FeatureFlagService so the admin panel's global
     * "Everyone" toggle and per-user overrides are both honoured, for guests
     * as well as signed-in users.
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        abort_unless($this->flags->active($feature, $request->user()), 404);

        return $next($request);
    }
}
