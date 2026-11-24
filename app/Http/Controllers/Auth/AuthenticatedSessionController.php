<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\RedirectPath;
use App\Support\ZiggyGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class AuthenticatedSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('LoginPage', [
            'redirect' => RedirectPath::sanitize($request->query('redirect')),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse|HttpResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $target = RedirectPath::sanitize($request->input('redirect'));

        if ($target !== null) {
            $request->session()->forget('url.intended');
        } else {
            $target = $request->session()->pull('url.intended', route('home'));
        }

        // Card 5710: the browser keeps the route list of the guest page it
        // signed in from, which has no admin.* names, so an admin page must
        // open with a full page load.
        if ($request->user()->is_admin && ZiggyGroup::isAdminPath($target) && $request->header('X-Inertia')) {
            return Inertia::location($target);
        }

        return redirect()->to($target);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
