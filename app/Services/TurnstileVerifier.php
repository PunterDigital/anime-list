<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Server-side verification of a Cloudflare Turnstile response token.
 *
 * Tokens are single-use and short-lived, so a fresh one is needed for every
 * submission attempt. Any failure (network, malformed response, rejected
 * token) is treated as "not verified" — the form fails closed.
 */
class TurnstileVerifier
{
    public function isConfigured(): bool
    {
        return (string) config('turnstile.site_key') !== ''
            && (string) config('turnstile.secret_key') !== '';
    }

    public function verify(?string $token, ?string $ip = null): bool
    {
        if ($token === null || $token === '' || ! $this->isConfigured()) {
            return false;
        }

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post(config('turnstile.verify_url'), array_filter([
                    'secret' => config('turnstile.secret_key'),
                    'response' => $token,
                    'remoteip' => $ip,
                ]));
        } catch (ConnectionException $e) {
            Log::warning('Turnstile verification request failed', ['error' => $e->getMessage()]);

            return false;
        }

        if (! $response->successful()) {
            Log::warning('Turnstile verification returned a non-2xx status', ['status' => $response->status()]);

            return false;
        }

        return $response->json('success') === true;
    }
}
