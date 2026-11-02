<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\RedirectPath;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Http\Requests\AssertionRequest;
use Laragear\WebAuthn\Http\Requests\AttestationRequest;
use Laragear\WebAuthn\Http\Requests\AttestedRequest;
use Laragear\WebAuthn\Models\WebAuthnCredential;

class PasskeyController extends Controller
{
    public function registerOptions(AttestationRequest $request): Responsable
    {
        return $request->fastRegistration()->toCreate();
    }

    public function register(AttestedRequest $request): JsonResponse
    {
        $request->validate([
            'alias' => ['nullable', 'string', 'max:50'],
        ]);

        $request->save(function (WebAuthnCredential $credential) use ($request) {
            $credential->alias = $request->input('alias') ?: 'Passkey';
        });

        return response()->json(['message' => 'Passkey registered.']);
    }

    public function loginOptions(AssertionRequest $request): Responsable
    {
        $validated = $request->validate([
            'email' => ['sometimes', 'email'],
        ]);

        return $request->toVerify($validated);
    }

    public function login(AssertedRequest $request): JsonResponse
    {
        $user = $request->login();

        if (! $user) {
            return response()->json(['message' => 'Authentication failed.'], 422);
        }

        // Where the page should send the browser next: the safe `redirect` the
        // login page was opened with, else the page the auth middleware stopped
        // the guest at (as password login does), else Home.
        $target = RedirectPath::sanitize($request->query('redirect'));

        if ($target !== null) {
            $request->session()->forget('url.intended');
        } else {
            $target = $request->session()->pull('url.intended', route('home'));
        }

        return response()->json([
            'message' => "Welcome back, {$user->name}!",
            'redirect' => $target,
        ]);
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $deleted = $request->user()
            ->webAuthnCredentials()
            ->whereKey($id)
            ->delete();

        abort_if($deleted === 0, 404);

        return back()->with('message', 'Passkey removed.');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $data = $request->validate([
            'alias' => ['required', 'string', 'max:50'],
        ]);

        $credential = $request->user()
            ->webAuthnCredentials()
            ->whereKey($id)
            ->firstOrFail();

        $credential->alias = $data['alias'];
        $credential->save();

        return back()->with('message', 'Passkey renamed.');
    }
}
