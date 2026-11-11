<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use App\Services\FeatureFlagService;
use App\Support\BlogImages;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Card 4481: the public blog at /blog, behind the `blog` flag.
 */
class BlogPublicTest extends TestCase
{
    private function blogOn(): void
    {
        app(FeatureFlagService::class)->setGlobalStatus('blog', 'everyone');
    }

    private function published(array $attributes = []): BlogPost
    {
        $post = BlogPost::factory()->create(array_merge(['body' => "## Intro\n\nHello **world**."], $attributes));
        $post->forceFill([
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => $attributes['published_at'] ?? now()->subDay(),
        ])->save();

        return $post->refresh();
    }

    private function draft(array $attributes = []): BlogPost
    {
        return BlogPost::factory()->create($attributes);
    }

    public function test_the_blog_is_404_while_the_flag_is_off_except_for_admins(): void
    {
        $post = $this->published(['slug' => 'hello']);

        $this->get('/blog')->assertNotFound();
        $this->get('/blog/hello')->assertNotFound();
        $this->get('/blog/feed.xml')->assertNotFound();

        $this->actingAs(User::factory()->create());
        $this->get('/blog')->assertNotFound();

        $this->actingAsAdmin();
        $this->get('/blog')->assertOk();
        $this->get('/blog/hello')->assertOk();
    }

    public function test_the_list_shows_published_posts_newest_first(): void
    {
        $this->blogOn();
        $this->published(['title' => 'Older', 'slug' => 'older', 'published_at' => now()->subDays(5)]);
        $this->published(['title' => 'Newer', 'slug' => 'newer', 'published_at' => now()->subDay()]);
        $this->draft(['title' => 'Draft', 'slug' => 'draft']);
        $this->published(['title' => 'Future', 'slug' => 'future', 'published_at' => now()->addDay()]);

        $this->get('/blog')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->component('BlogIndexPage')
            ->where('posts.meta.total', 2)
            ->where('posts.data.0.slug', 'newer')
            ->where('posts.data.1.slug', 'older')
            ->where('seo.url', route('blog.index'))
            ->where('seo.feed', route('blog.feed')));
    }

    public function test_the_list_is_paginated(): void
    {
        $this->blogOn();
        foreach (range(1, 13) as $i) {
            $this->published(['slug' => "post-{$i}", 'published_at' => now()->subDays($i)]);
        }

        $this->get('/blog')->assertInertia(fn (AssertableInertia $page) => $page
            ->has('posts.data', 12)
            ->where('posts.meta.last_page', 2));
        $this->get('/blog?page=2')->assertInertia(fn (AssertableInertia $page) => $page
            ->has('posts.data', 1)
            ->where('posts.data.0.slug', 'post-13')
            ->where('seo.url', route('blog.index', ['page' => 2])));
        $this->get('/blog?page=3')->assertNotFound();
    }

    public function test_drafts_and_future_posts_are_404_for_everyone_but_admins(): void
    {
        $this->blogOn();
        $this->draft(['slug' => 'a-draft']);
        $this->published(['slug' => 'tomorrow', 'published_at' => now()->addDay()]);

        $this->get('/blog/a-draft')->assertNotFound();
        $this->get('/blog/tomorrow')->assertNotFound();
        $this->actingAs(User::factory()->create());
        $this->get('/blog/a-draft')->assertNotFound();

        $this->actingAsAdmin();
        $this->get('/blog/a-draft')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->component('BlogPostPage')
            ->where('preview', true)
            ->where('seo.noindex', true)
            ->where('json_ld', null));
        $this->get('/blog/tomorrow')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('preview', true));
    }

    public function test_a_post_page_has_its_seo_fields(): void
    {
        $this->blogOn();
        Storage::fake('public');
        $cover = BlogImages::store(UploadedFile::fake()->image('cover.png', 1200, 630));
        $post = $this->published([
            'title' => 'Best of Autumn',
            'slug' => 'best-of-autumn',
            'excerpt' => 'Our autumn picks.',
            'seo_title' => 'Best Autumn Anime 2026',
            'meta_description' => 'The ten best anime of autumn 2026.',
            'cover_image' => $cover['path'],
        ]);

        $this->get('/blog/best-of-autumn')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->component('BlogPostPage')
            ->where('preview', false)
            ->where('post.title', 'Best of Autumn')
            ->where('post.cover.url', $cover['url'])
            ->where('post.cover.width', 1200)
            ->where('seo.title', 'Best Autumn Anime 2026')
            ->where('seo.description', 'The ten best anime of autumn 2026.')
            ->where('seo.url', route('blog.show', 'best-of-autumn'))
            ->where('seo.image', url($cover['url']))
            ->where('seo.noindex', false)
            ->where('post.body_html', fn (string $html) => str_contains($html, '<h2>Intro</h2>')));

        // Without overrides: the title and the excerpt, then the body text.
        $post->update(['seo_title' => null, 'meta_description' => null]);
        $this->get('/blog/best-of-autumn')->assertInertia(fn (AssertableInertia $page) => $page
            ->where('seo.title', 'Best of Autumn')
            ->where('seo.description', 'Our autumn picks.'));
        $post->update(['excerpt' => null]);
        $this->get('/blog/best-of-autumn')->assertInertia(fn (AssertableInertia $page) => $page
            ->where('seo.description', 'Intro Hello world.'));
    }

    public function test_the_json_ld_is_a_blog_posting_in_the_html(): void
    {
        $this->blogOn();
        $author = User::factory()->create(['name' => 'Shay Writer']);
        $post = $this->published([
            'title' => 'Winter </script><script>alert(1)</script> picks',
            'slug' => 'winter-picks',
            'excerpt' => 'Picks.',
        ]);
        $post->forceFill(['author_id' => $author->id])->save();

        $html = $this->get('/blog/winter-picks')->assertOk()->getContent();

        preg_match_all('#<script type="application/ld\+json"[^>]*>(.*?)</script>#s', $html, $m);
        $this->assertCount(2, $m[1], 'WebSite + BlogPosting');
        $data = json_decode($m[1][1], true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame('https://schema.org', $data['@context']);
        $this->assertSame('BlogPosting', $data['@type']);
        $this->assertSame('Winter </script><script>alert(1)</script> picks', $data['headline']);
        $this->assertSame($post->published_at->toIso8601String(), $data['datePublished']);
        $this->assertSame($post->refresh()->updated_at->toIso8601String(), $data['dateModified']);
        $this->assertSame(['@type' => 'Person', 'name' => 'Shay Writer'], $data['author']);
        $this->assertSame(route('blog.show', 'winter-picks'), $data['mainEntityOfPage']['@id']);
        $this->assertArrayNotHasKey('image', $data);
        // The title can't break out of the script tag.
        $this->assertStringNotContainsString('<script>alert(1)</script>', $m[1][1]);
    }

    public function test_other_pages_have_no_blog_posting(): void
    {
        $html = $this->get('/')->getContent();

        $this->assertStringNotContainsString('BlogPosting', $html);
    }

    public function test_a_hash_heading_becomes_an_h2(): void
    {
        $this->blogOn();
        $this->published(['slug' => 'h', 'body' => "# Big\n\n## Normal"]);

        $this->get('/blog/h')->assertInertia(fn (AssertableInertia $page) => $page
            ->where('post.body_html', fn (string $html) => ! str_contains($html, '<h1>') && str_contains($html, '<h2>Big</h2>')));
    }

    public function test_published_posts_are_in_the_sitemap_with_lastmod(): void
    {
        $this->published(['slug' => 'in-sitemap']);
        $this->draft(['slug' => 'not-in-sitemap']);

        // Flag off: no blog URLs.
        $this->assertStringNotContainsString('/blog', $this->get('/sitemap.xml')->getContent());

        $this->blogOn();
        // Saving any post clears the cached sitemap.
        $post = $this->published(['slug' => 'second-post']);
        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('<loc>'.route('blog.index').'</loc>', $xml);
        $this->assertStringContainsString('<loc>'.route('blog.show', 'in-sitemap').'</loc>', $xml);
        $this->assertStringContainsString('<loc>'.route('blog.show', 'second-post').'</loc>'."\n    <lastmod>".$post->updated_at->toDateString().'</lastmod>', $xml);
        $this->assertStringNotContainsString('not-in-sitemap', $xml);
        simplexml_load_string($xml) ?: $this->fail('sitemap is not valid XML');
    }

    public function test_the_rss_feed_lists_published_posts(): void
    {
        $this->blogOn();
        $this->published(['title' => 'Cats & Dogs <3', 'slug' => 'cats', 'excerpt' => 'Pets.', 'body' => 'A ]]> trap.', 'published_at' => now()->subDays(2)]);
        $this->published(['title' => 'Newest', 'slug' => 'newest', 'published_at' => now()->subHour()]);
        $this->draft(['slug' => 'secret-draft']);

        $response = $this->get('/blog/feed.xml')->assertOk();

        $this->assertStringStartsWith('application/rss+xml', $response->headers->get('Content-Type'));
        $this->assertSame([], $response->headers->getCookies());
        $xml = simplexml_load_string($response->getContent());
        $this->assertNotFalse($xml);
        $this->assertSame('AniTrack Blog', (string) $xml->channel->title);
        $this->assertCount(2, $xml->channel->item);
        $this->assertSame('Newest', (string) $xml->channel->item[0]->title);
        $this->assertSame('Cats & Dogs <3', (string) $xml->channel->item[1]->title);
        $this->assertSame(route('blog.show', 'cats'), (string) $xml->channel->item[1]->link);
        $this->assertSame('Pets.', (string) $xml->channel->item[1]->description);
        $content = (string) $xml->channel->item[1]->children('http://purl.org/rss/1.0/modules/content/')->encoded;
        $this->assertStringContainsString('A ]]&gt; trap.', $content);
        $this->assertStringNotContainsString('secret-draft', $response->getContent());
    }
}
