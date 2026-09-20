<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactMessageRequest;
use App\Mail\ContactMessageReceived;
use App\Models\ContactMessage;
use App\Services\TurnstileVerifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function show(Request $request, TurnstileVerifier $turnstile): Response
    {
        $user = $request->user();
        $requiresCaptcha = $user === null;

        return Inertia::render('ContactPage', [
            'requiresCaptcha' => $requiresCaptcha,
            // The site key is public by design; only send it when it is needed.
            'turnstileSiteKey' => $requiresCaptcha && $turnstile->isConfigured()
                ? config('turnstile.site_key')
                : null,
            'prefill' => [
                'name' => $user?->name ?? '',
                'email' => $user?->email ?? '',
            ],
        ]);
    }

    public function store(StoreContactMessageRequest $request): RedirectResponse
    {
        // Bots that fill the hidden field get the same success response as
        // everyone else, so they cannot tell they were filtered out.
        if ($request->isHoneypotTripped()) {
            return $this->sent();
        }

        $message = ContactMessage::create([
            'user_id' => $request->user()?->id,
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'subject' => $request->validated('subject'),
            'message' => $request->validated('message'),
            'ip_address' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 512) ?: null,
        ]);

        if ($to = config('contact.to')) {
            Mail::to($to)->send(new ContactMessageReceived($message));
        }

        return $this->sent();
    }

    private function sent(): RedirectResponse
    {
        return redirect()
            ->route('contact')
            ->with('status', 'success')
            ->with('message', 'Thanks! Your message has been sent. We will get back to you as soon as we can.');
    }
}
