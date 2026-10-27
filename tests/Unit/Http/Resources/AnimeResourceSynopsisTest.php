<?php

namespace Tests\Unit\Http\Resources;

use App\Http\Resources\AnimeResource;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class AnimeResourceSynopsisTest extends TestCase
{
    public function test_null_stays_null(): void
    {
        $this->assertNull(AnimeResource::synopsisHtml(null));
    }

    public function test_plain_anilist_text_is_unchanged(): void
    {
        $synopsis = "A boy meets a <i>shinigami</i>.<br><br>\n(Source: <b>MAL Rewrite</b>)";

        $this->assertSame($synopsis, AnimeResource::synopsisHtml($synopsis));
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function attributeCases(): array
    {
        return [
            'event handler' => ['<p onclick="alert(1)">Hi</p>', '<p>Hi</p>'],
            'style' => ['<b style="position:fixed;inset:0">Hi</b>', '<b>Hi</b>'],
            'single quotes' => ["<em class='x' onmouseover='alert(1)'>Hi</em>", '<em>Hi</em>'],
            'unquoted' => ['<strong onfocus=alert(1) tabindex=0>Hi</strong>', '<strong>Hi</strong>'],
            'self-closing br' => ['One<br />Two<BR class="x">Three', 'One<br>Two<BR>Three'],
            'quoted angle bracket' => ['<i title="a>b" onclick="x">Hi</i>', '<i>Hi</i>'],
            'closing tag' => ['<p>Hi</p foo="bar">', '<p>Hi</p>'],
        ];
    }

    #[DataProvider('attributeCases')]
    public function test_attributes_are_removed_from_allowed_tags(string $synopsis, string $expected): void
    {
        $this->assertSame($expected, AnimeResource::synopsisHtml($synopsis));
    }

    public function test_disallowed_tags_are_still_stripped(): void
    {
        $synopsis = '<p>Hi<script>alert(1)</script> <a href="javascript:alert(1)">link</a><img src=x onerror=alert(1)></p>';

        $this->assertSame('<p>Hialert(1) link</p>', AnimeResource::synopsisHtml($synopsis));
    }

    public function test_tags_with_similar_names_are_not_kept(): void
    {
        $this->assertSame('Hi', AnimeResource::synopsisHtml('<button onclick="x">Hi</button>'));
        $this->assertSame('Hi', AnimeResource::synopsisHtml('<pre onclick="x">Hi</pre>'));
    }
}
