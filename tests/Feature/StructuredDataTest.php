<?php

namespace Tests\Feature;

use Tests\TestCase;

class StructuredDataTest extends TestCase
{
    // Blade's @context directive used to compile the JSON-LD "@context" key into PHP
    // source, so the live page source showed "<?php $__contextArgs = …" (card 4456).
    public function test_root_view_has_valid_json_ld(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringNotContainsString('<?php', $html);
        $this->assertSame(1, preg_match('#<script type="application/ld\+json"[^>]*>(.*?)</script>#s', $html, $m));

        $data = json_decode($m[1], true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame([
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => 'AniTrack',
            'url' => config('app.url'),
        ], $data);
    }
}
