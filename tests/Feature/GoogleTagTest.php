<?php

namespace Tests\Feature;

use Tests\TestCase;

class GoogleTagTest extends TestCase
{
    public function test_the_google_tag_loads_with_both_ids_by_default(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('https://www.googletagmanager.com/gtag/js?id=G-4K6RNYTM27', false)
            ->assertSee("gtag('config','G-4K6RNYTM27');gtag('config','AW-18128258525');", false);
    }

    public function test_the_google_tag_is_omitted_when_both_ids_are_empty(): void
    {
        config(['analytics.ga_id' => '', 'analytics.ads_id' => '']);

        $this->get('/')
            ->assertOk()
            ->assertDontSee('googletagmanager.com/gtag', false)
            ->assertDontSee('gtag(', false);
    }

    public function test_the_content_security_policy_lets_the_ads_tag_send_its_hits(): void
    {
        $csp = $this->get('/')->headers->get('Content-Security-Policy');

        preg_match('/connect-src ([^;]+);/', $csp, $connectSrc);

        $this->assertNotEmpty($connectSrc);
        $this->assertContains('https://www.google.com', explode(' ', $connectSrc[1]));
        $this->assertContains('https://ad.doubleclick.net', explode(' ', $connectSrc[1]));
    }

    public function test_the_ads_tag_alone_still_loads_the_google_tag(): void
    {
        config(['analytics.ga_id' => '']);

        $this->get('/')
            ->assertOk()
            ->assertSee('https://www.googletagmanager.com/gtag/js?id=AW-18128258525', false)
            ->assertSee("gtag('config','AW-18128258525');", false)
            ->assertDontSee('G-4K6RNYTM27', false);
    }
}
