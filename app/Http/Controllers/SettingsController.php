<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateApiTokenRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Services\FeatureFlagService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        private readonly FeatureFlagService $flags,
    ) {}

    public function show(Request $request): Response
    {
        $user = $request->user();

        $publicApiEnabled = $this->flags->active('public-api', $user);

        return Inertia::render('SettingsPage', [
            'timezones' => timezone_identifiers_list(),
            'publicApiEnabled' => $publicApiEnabled,
            'apiTokens' => $publicApiEnabled ? $this->tokensFor($user) : [],
            'passkeys' => $this->passkeysFor($user),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        return back()->with('message', 'Profile updated successfully.');
    }

    public function updatePassword(UpdatePasswordRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->validated('password'),
        ]);

        return back()->with('message', 'Password updated successfully.');
    }

    /**
     * Mint a new Sanctum personal access token for the authenticated user.
     * The plain-text token is flashed to the session so the UI can display
     * it once — it's unrecoverable afterwards.
     */
    public function createApiToken(CreateApiTokenRequest $request): RedirectResponse
    {
        abort_unless($this->flags->active('public-api', $request->user()), 403);

        $new = $request->user()->createToken($request->validated('name'));

        $new->accessToken->forceFill([
            'last_used_ip' => $request->ip(),
            'last_used_user_agent' => mb_substr((string) $request->userAgent(), 0, 500),
        ])->saveQuietly();

        return back()
            ->with('message', 'API token created.')
            ->with('newApiToken', [
                'id' => $new->accessToken->id,
                'name' => $new->accessToken->name,
                'plain_text' => $new->plainTextToken,
            ]);
    }

    public function destroyApiToken(Request $request, int $token): RedirectResponse
    {
        abort_unless($this->flags->active('public-api', $request->user()), 403);

        $deleted = $request->user()->tokens()->whereKey($token)->delete();

        abort_if($deleted === 0, 404);

        return back()->with('message', 'API token revoked.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function passkeysFor($user): array
    {
        return $user->passkeys()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($passkey) => [
                'id' => (string) $passkey->id,
                'alias' => $passkey->name,
                'enabled' => true,
                'created_at' => $passkey->created_at?->toISOString(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function tokensFor($user): array
    {
        return $user->tokens()
            ->orderByDesc('last_used_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($token) => [
                'id' => $token->id,
                'name' => $token->name,
                'last_used_at' => $token->last_used_at?->toISOString(),
                'last_used_ip' => $token->last_used_ip,
                'last_used_user_agent' => $token->last_used_user_agent,
                'created_at' => $token->created_at->toISOString(),
            ])
            ->values()
            ->all();
    }
}
