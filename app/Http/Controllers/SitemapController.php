<?php

namespace App\Http\Controllers;

use App\Models\Anime;
use App\Models\User;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function __invoke(): Response
    {
        $xml = Cache::remember('sitemap:xml', 21600, function () {
            return $this->generate();
        });

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
        ]);
    }

    private function generate(): string
    {
        $urls = [];

        // Static pages
        $urls[] = $this->url(route('home'), 'daily', '1.0');
        $urls[] = $this->url(route('seasonal'), 'daily', '0.8');
        $urls[] = $this->url(route('schedule'), 'daily', '0.7');
        $urls[] = $this->url(route('anime.index'), 'daily', '0.8');
        $urls[] = $this->url(route('search'), 'weekly', '0.5');
        $urls[] = $this->url(route('top.rated'), 'daily', '0.8');
        $urls[] = $this->url(route('top.popular'), 'daily', '0.8');
        $urls[] = $this->url(route('terms'), 'monthly', '0.3');
        $urls[] = $this->url(route('privacy'), 'monthly', '0.3');

        // Anime pages. Thin title pages (see Anime::isIndexable) carry a
        // robots noindex, so they are left out of the sitemap as well.
        Anime::query()
            ->whereNotNull('slug')
            ->where('is_adult', false)
            ->whereNotNull('average_score')
            ->select(['id', 'slug', 'updated_at', 'synopsis', 'episodes', 'average_score', 'is_adult'])
            ->withExists('episodeList')
            ->orderBy('id')
            ->chunk(1000, function ($animes) use (&$urls) {
                foreach ($animes as $anime) {
                    if (! $anime->isIndexable()) {
                        continue;
                    }

                    $urls[] = $this->url(
                        route('anime.show', $anime->slug),
                        'weekly',
                        '0.6',
                        $anime->updated_at?->toDateString(),
                    );
                }
            });

        // Public profiles
        User::query()
            ->where('list_is_public', true)
            ->whereNull('deleted_at')
            ->select(['username', 'updated_at'])
            ->orderBy('id')
            ->chunk(500, function ($users) use (&$urls) {
                foreach ($users as $user) {
                    $urls[] = $this->url(
                        route('profile.show', $user->username),
                        'weekly',
                        '0.4',
                        $user->updated_at?->toDateString(),
                    );
                }
            });

        $urlsXml = implode("\n", $urls);

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{$urlsXml}
</urlset>
XML;
    }

    private function url(string $loc, string $changefreq, string $priority, ?string $lastmod = null): string
    {
        $lastmodTag = $lastmod ? "\n    <lastmod>{$lastmod}</lastmod>" : '';

        return <<<XML
  <url>
    <loc>{$loc}</loc>{$lastmodTag}
    <changefreq>{$changefreq}</changefreq>
    <priority>{$priority}</priority>
  </url>
XML;
    }
}
