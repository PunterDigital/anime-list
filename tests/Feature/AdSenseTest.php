<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\FeatureFlagService;
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
        config(['adsense.client' => null, 'adsense.slot' => '1234567890']);
        app(FeatureFlagService::class)->setGlobalStatus('ads', 'everyone');

        $this->get('/')
            ->assertOk()
            ->assertDontSee('pagead2.googlesyndication.com');
    }

    public function test_the_adsense_loader_is_omitted_while_the_ads_flag_is_off(): void
    {
        config(['adsense.client' => 'ca-pub-2580714906111016', 'adsense.slot' => '1234567890']);

        $this->get('/')
            ->assertOk()
            ->assertSee('<meta name="google-adsense-account" content="ca-pub-2580714906111016">', false)
            ->assertDontSee('adsbygoogle.js');
    }

    public function test_the_adsense_loader_is_omitted_without_a_slot(): void
    {
        config(['adsense.client' => 'ca-pub-2580714906111016', 'adsense.slot' => null]);
        app(FeatureFlagService::class)->setGlobalStatus('ads', 'everyone');

        $this->get('/')
            ->assertOk()
            ->assertSee('<meta name="google-adsense-account" content="ca-pub-2580714906111016">', false)
            ->assertDontSee('adsbygoogle.js');
    }

    public function test_turning_the_ads_flag_on_brings_the_loader_back(): void
    {
        config(['adsense.client' => 'ca-pub-2580714906111016', 'adsense.slot' => '1234567890']);

        $this->get('/')->assertOk()->assertDontSee('adsbygoogle.js');

        app(FeatureFlagService::class)->setGlobalStatus('ads', 'everyone');

        $this->get('/')
            ->assertOk()
            ->assertSee('<meta name="google-adsense-account" content="ca-pub-2580714906111016">', false)
            ->assertSee('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2580714906111016', false);
    }

    public function test_the_adsense_loader_follows_the_flag_for_each_viewer(): void
    {
        config(['adsense.client' => 'ca-pub-2580714906111016', 'adsense.slot' => '1234567890']);
        $user = User::factory()->create();
        app(FeatureFlagService::class)->activateForUser('ads', $user);

        $this->get('/')->assertOk()->assertDontSee('adsbygoogle.js');

        $this->actingAs($user)
            ->get('/')
            ->assertOk()
            ->assertSee('adsbygoogle.js');
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

    public function test_the_content_security_policy_allows_the_consent_message(): void
    {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        $directives = [];
        foreach (array_filter(array_map('trim', explode(';', $csp))) as $directive) {
            $parts = explode(' ', $directive);
            $directives[array_shift($parts)] = $parts;
        }

        foreach (['script-src', 'connect-src', 'frame-src'] as $name) {
            $this->assertContains('https://fundingchoicesmessages.google.com', $directives[$name], $name);
        }
    }
}
