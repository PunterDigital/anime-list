<?php

namespace App\Http\Middleware;

use App\Services\FeatureFlagService;
use App\Support\ZiggyGroup;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function title(string $title): string
    {
        return $title ? "{$title} — AniTrack" : 'AniTrack';
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'username' => $request->user()->username,
                    'email' => $request->user()->email,
                    'avatar_url' => $request->user()->avatar_url,
                    'bio' => $request->user()->bio,
                    'timezone' => $request->user()->timezone,
                    'is_admin' => (bool) $request->user()->is_admin,
                    'list_is_public' => (bool) $request->user()->list_is_public,
                    'roles' => $request->user()->roles->pluck('slug')->all(),
                ] : null,
            ],
            // No session when an error page renders before StartSession ran.
            'flash' => [
                'message' => $request->hasSession() ? $request->session()->get('message') : null,
                'status' => $request->hasSession() ? $request->session()->get('status') : null,
                'newApiToken' => $request->hasSession() ? $request->session()->get('newApiToken') : null,
            ],
            'features' => fn () => app(FeatureFlagService::class)->allForUser($request->user()),
            'business' => config('business'),
            'adsense' => [
                'client' => config('adsense.client'),
                'slot' => config('adsense.slot'),
            ],
            // Card 5710: only the SSR server reads this (the browser uses the
            // list @routes printed in the first HTML), and SSR only renders
            // first loads, so Inertia visits leave it out (13 KB each).
            ...($request->header('X-Inertia') ? [] : [
                'ziggy' => fn () => [
                    ...(new Ziggy(ZiggyGroup::for($request)))->toArray(),
                    'location' => $request->url(),
                ],
            ]),
        ];
    }
}
