<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Services\FeatureFlagService;
use Illuminate\Http\Response;

/**
 * RSS 2.0 feed of the latest published posts (card 4481) at /blog/feed.xml.
 * Like the sitemap, it only exists once the `blog` flag is on for guests,
 * since feed readers never sign in.
 */
class BlogFeedController extends Controller
{
    public const LIMIT = 20;

    public function __invoke(FeatureFlagService $flags): Response
    {
        abort_unless($flags->active('blog', null), 404);

        $posts = BlogPost::query()
            ->published()
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->limit(self::LIMIT)
            ->get();

        $self = route('blog.feed');
        $home = route('blog.index');
        $lastBuild = ($posts->max('updated_at') ?? now())->toRfc2822String();

        $items = $posts->map(function (BlogPost $post) {
            $link = route('blog.show', $post->slug);
            $description = $post->excerpt ?: $post->meta_description ?: '';
            $author = $post->author?->name;

            return "    <item>\n"
                .'      <title>'.$this->e($post->title)."</title>\n"
                .'      <link>'.$this->e($link)."</link>\n"
                .'      <guid isPermaLink="true">'.$this->e($link)."</guid>\n"
                .'      <pubDate>'.$post->published_at->toRfc2822String()."</pubDate>\n"
                .($author ? '      <dc:creator>'.$this->e($author)."</dc:creator>\n" : '')
                .($description !== '' ? '      <description>'.$this->e($description)."</description>\n" : '')
                .'      <content:encoded>'.$this->cdata($post->bodyHtml())."</content:encoded>\n"
                .'    </item>';
        })->implode("\n");

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">'."\n"
            ."  <channel>\n"
            ."    <title>AniTrack Blog</title>\n"
            .'    <link>'.$this->e($home)."</link>\n"
            .'    <atom:link href="'.$this->e($self).'" rel="self" type="application/rss+xml" />'."\n"
            ."    <description>News, guides and seasonal picks from the AniTrack team.</description>\n"
            ."    <language>en</language>\n"
            .'    <lastBuildDate>'.$lastBuild."</lastBuildDate>\n"
            .($items !== '' ? $items."\n" : '')
            ."  </channel>\n"
            ."</rss>\n";

        return response($xml, 200, [
            'Content-Type' => 'application/rss+xml; charset=UTF-8',
            'Cache-Control' => 'public, max-age=900',
        ]);
    }

    private function e(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }

    /** CDATA can't hold "]]>": split it across two sections. */
    private function cdata(string $html): string
    {
        return '<![CDATA['.str_replace(']]>', ']]]]><![CDATA[>', $html).']]>';
    }
}
