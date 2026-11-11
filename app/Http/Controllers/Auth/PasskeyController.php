<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Passkey;
use App\Models\User;
use App\Support\RedirectPath;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Passkeys\Actions\DeletePasskey;
use Laravel\Passkeys\Actions\GenerateRegistrationOptions;
use Laravel\Passkeys\Actions\GenerateVerificationOptions;
use Laravel\Passkeys\Actions\StorePasskey;
use Laravel\Passkeys\Actions\VerifyPasskey;
use Laravel\Passkeys\Exceptions\InvalidPasskeyException;
use Laravel\Passkeys\Http\Requests\PasskeyRegistrationRequest;
use Laravel\Passkeys\Http\Requests\PasskeyVerificationRequest;
use Laravel\Passkeys\Passkeys;
use Laravel\Passkeys\Support\WebAuthn;

/**
 * Passkey sign-in and management on laravel/passkeys' actions (card 4237). The
 * package's own routes are off (AppServiceProvider): these keep AniTrack's
 * throttle, redirect handling and Settings page. The browser side is the
 * `@laravel/passkeys` client with these routes passed in.
 */
class PasskeyController extends Controller
{
    public function registerOptions(Request $request, GenerateRegistrationOptions $generate): JsonResponse
    {
        $options = $generate($request->user());

        $request->session()->put('passkey.registration_options', WebAuthn::toJson($options));

        return response()->json(['options' => WebAuthn::toBrowserArray($options)]);
    }

    public function register(PasskeyRegistrationRequest $request, StorePasskey $store): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        $passkey = $store(
            $request->user(),
            trim($request->string('name')->toString()) ?: 'Passkey',
            $request->credential(),
            $request->registrationOptions(),
        );

        return response()->json([
            'id' => (string) $passkey->id,
            'name' => $passkey->name,
            'message' => 'Passkey registered.',
        ]);
    }

    public function loginOptions(Request $request, GenerateVerificationOptions $generate): JsonResponse
    {
        $options = $generate();

        $request->session()->put('passkey.verification_options', WebAuthn::toJson($options));

        return response()->json(['options' => WebAuthn::toBrowserArray($options)]);
    }

    public function login(PasskeyVerificationRequest $request, VerifyPasskey $verify): JsonResponse
    {
        $passkey = $verify($request->credential(), $request->verificationOptions());

        // A soft-deleted account's passkey still verifies (App\Models\Passkey
        // loads deleted users, so the package's event gets one): refuse it here.
        $user = $passkey->user;

        if (! $user instanceof User || $user->trashed() || ! Passkeys::allowsLogin($request, $passkey)) {
            throw InvalidPasskeyException::make('Unable to sign in with this account.');
        }

        Auth::login($user, $request->remember());

        $request->session()->regenerate();

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

    public function destroy(Request $request, Passkey $passkey, DeletePasskey $delete): RedirectResponse
    {
        abort_unless($this->owns($request, $passkey), 404);

        $delete($request->user(), $passkey);

        return back()->with('message', 'Passkey removed.');
    }

    public function update(Request $request, Passkey $passkey): RedirectResponse
    {
        abort_unless($this->owns($request, $passkey), 404);

        $data = $request->validate([
            'alias' => ['required', 'string', 'max:50'],
        ]);

        $passkey->name = $data['alias'];
        $passkey->save();

        return back()->with('message', 'Passkey renamed.');
    }

    private function owns(Request $request, Passkey $passkey): bool
    {
        return (string) $passkey->user_id === (string) $request->user()->getKey();
    }
}
