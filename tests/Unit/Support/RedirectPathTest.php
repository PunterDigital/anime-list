<?php

namespace Tests\Unit\Support;

use App\Support\RedirectPath;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class RedirectPathTest extends TestCase
{
    /**
     * @return array<string, array{string}>
     */
    public static function safePaths(): array
    {
        return [
            'anime page' => ['/anime/cowboy-bebop'],
            'with a query string' => ['/anime?season=fall&year=2026'],
            'with a fragment' => ['/anime/cowboy-bebop#characters'],
            'root' => ['/'],
            'encoded slashes stay a path' => ['/%2F%2Fevil.com'],
        ];
    }

    /**
     * @return array<string, array{mixed}>
     */
    public static function unsafeValues(): array
    {
        return [
            'absolute https url' => ['https://evil.com/anime/x'],
            'absolute http url' => ['http://evil.com'],
            'scheme with one slash' => ['http:/evil.com'],
            'protocol-relative' => ['//evil.com'],
            'protocol-relative with path' => ['//evil.com/anime/cowboy-bebop'],
            'slash backslash' => ['/\evil.com'],
            'double backslash' => ['\\\\evil.com'],
            'backslash later in the path' => ['/anime\..\\\\evil.com'],
            'tab between slashes' => ["/\t/evil.com"],
            'newline between slashes' => ["/\n/evil.com"],
            'carriage return' => ["/\r/evil.com"],
            'leading space' => [' //evil.com'],
            'null byte' => ["/anime\0"],
            'javascript url' => ['javascript:alert(1)'],
            'data url' => ['data:text/html,<script>alert(1)</script>'],
            'bare host' => ['evil.com'],
            'relative path' => ['anime/cowboy-bebop'],
            'empty string' => [''],
            'null' => [null],
            'array' => [['/anime/cowboy-bebop']],
            'integer' => [42],
            'too long' => ['/'.str_repeat('a', 2000)],
        ];
    }

    #[DataProvider('safePaths')]
    public function test_it_accepts_same_site_paths(string $path): void
    {
        $this->assertSame($path, RedirectPath::sanitize($path));
    }

    #[DataProvider('unsafeValues')]
    public function test_it_rejects_anything_that_could_leave_the_site(mixed $value): void
    {
        $this->assertNull(RedirectPath::sanitize($value));
    }
}
