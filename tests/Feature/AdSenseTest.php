<?php

namespace Tests\Feature;

use Tests\TestCase;

class AdSenseTest extends TestCase
{
    public function test_the_adsense_account_meta_tag_is_present(): void
    {
        config(['adsense.client' => 'ca-pub-2580714906111016']);

        $this->get('/')
            ->assertOk()
            ->assertSee('<meta name="google-adsense-account" content="ca-pub-2580714906111016">', false);
    }

    public function test_the_adsense_loader_is_omitted_without_a_client(): void
    {
        config(['adsense.client' => null]);

        $this->get('/')
            ->assertOk()
            ->assertDontSee('pagead2.googlesyndication.com');
    }

    public function test_the_adsense_client_and_slot_are_shared_with_the_frontend(): void
    {
        config([
            'adsense.client' => 'ca-pub-2580714906111016',
            'adsense.slot' => '1234567890',
        ]);

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('adsense.client', 'ca-pub-2580714906111016')
                ->where('adsense.slot', '1234567890')
            );
    }

    public function test_the_content_security_policy_allows_adsense(): void
    {
        $response = $this->get('/');

        $csp = $response->headers->get('Content-Security-Policy');

        $this->assertStringContainsString('https://pagead2.googlesyndication.com', $csp);
        $this->assertStringContainsString('https://googleads.g.doubleclick.net', $csp);
    }
}
