<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/**
 * Card 5533: the headers SecurityHeaders adds to every web page.
 */
class SecurityHeadersTest extends TestCase
{
    public function test_web_pages_send_the_security_headers(): void
    {
        $response = $this->get('/')->assertOk();

        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $this->assertStringEndsWith("frame-ancestors 'none'", $response->headers->get('Content-Security-Policy'));
    }

    public function test_the_app_leaves_x_frame_options_to_nginx(): void
    {
        // Forge's nginx sends X-Frame-Options: SAMEORIGIN; a second value from the
        // app made the header invalid. frame-ancestors in the CSP covers framing.
        $this->get('/')->assertOk()->assertHeaderMissing('X-Frame-Options');
    }

    public function test_signed_in_pages_send_them_too(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/settings')
            ->assertOk()
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000');
    }
}
