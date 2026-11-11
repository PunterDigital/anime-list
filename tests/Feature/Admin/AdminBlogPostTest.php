<?php

namespace Tests\Feature\Admin;

use App\Models\BlogPost;
use App\Models\User;
use App\Support\BlogMarkdown;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * Card 4479: admins write blog posts in Markdown.
 */
class AdminBlogPostTest extends TestCase
{
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Best Anime of the Season',
            'slug' => '',
            'excerpt' => 'Our picks.',
            'body' => "## Picks\n\n**Frieren** is great.",
            'seo_title' => '',
            'meta_description' => '',
        ], $overrides);
    }

    public function test_admin_creates_a_draft_with_a_slug_from_the_title(): void
    {
        $admin = $this->actingAsAdmin();

        $response = $this->post('/admin/blog', $this->payload());

        $post = BlogPost::sole();
        $response->assertRedirect(route('admin.blog.edit', $post));
        $this->assertSame('best-anime-of-the-season', $post->slug);
        $this->assertSame(BlogPost::STATUS_DRAFT, $post->status);
        $this->assertNull($post->published_at);
        $this->assertSame($admin->id, $post->author_id);
        $this->assertSame("## Picks\n\n**Frieren** is great.", $post->body);
        $this->assertNull($post->seo_title);
    }

    public function test_a_second_post_with_the_same_title_gets_a_numbered_slug(): void
    {
        $this->actingAsAdmin();
        BlogPost::factory()->create(['slug' => 'best-anime-of-the-season']);

        $this->post('/admin/blog', $this->payload())->assertRedirect();

        $this->assertTrue(BlogPost::where('slug', 'best-anime-of-the-season-2')->exists());
    }

    public function test_a_typed_slug_must_be_unique_and_url_safe(): void
    {
        $this->actingAsAdmin();
        $other = BlogPost::factory()->create(['slug' => 'taken']);

        $this->post('/admin/blog', $this->payload(['slug' => 'taken']))
            ->assertSessionHasErrors('slug');
        $this->post('/admin/blog', $this->payload(['slug' => 'Not a slug!']))
            ->assertSessionHasErrors('slug');
        $this->assertSame(1, BlogPost::count());

        // A post keeps its own slug on update.
        $this->patch("/admin/blog/{$other->id}", $this->payload(['title' => 'Renamed', 'slug' => 'taken']))
            ->assertSessionHasNoErrors();
        $this->assertSame('Renamed', $other->fresh()->title);
    }

    public function test_admin_edits_a_post_and_sees_the_rendered_preview(): void
    {
        $this->actingAsAdmin();
        $post = BlogPost::factory()->create();

        $this->patch("/admin/blog/{$post->id}", $this->payload([
            'slug' => 'new-slug',
            'body' => "# Hi\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))",
            'seo_title' => 'SEO title',
            'meta_description' => 'Meta.',
        ]))->assertRedirect(route('admin.blog.edit', $post));

        $post->refresh();
        $this->assertSame('new-slug', $post->slug);
        $this->assertSame('SEO title', $post->seo_title);
        $this->assertSame('Meta.', $post->meta_description);

        $this->get("/admin/blog/{$post->id}/edit")
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/BlogPostEditPage')
                ->where('post.slug', 'new-slug')
                ->where('post.body', $post->body)
                ->where('post.body_html', fn (string $html) => str_contains($html, '<h1>Hi</h1>')
                    && ! str_contains($html, '<script')
                    && ! str_contains($html, 'javascript:')));
    }

    public function test_publish_keeps_the_first_publish_date(): void
    {
        $this->actingAsAdmin();
        $post = BlogPost::factory()->create();

        $this->patch("/admin/blog/{$post->id}/publish", ['published' => true])->assertRedirect();
        $post->refresh();
        $this->assertTrue($post->isPublished());
        $first = $post->published_at;
        $this->assertNotNull($first);

        $this->travel(2)->days();
        $this->patch("/admin/blog/{$post->id}/publish", ['published' => false]);
        $this->assertFalse($post->fresh()->isPublished());

        $this->patch("/admin/blog/{$post->id}/publish", ['published' => true]);
        $this->assertEquals($first, $post->fresh()->published_at);
    }

    public function test_the_published_scope_leaves_out_drafts_and_future_dates(): void
    {
        $live = BlogPost::factory()->published()->create();
        BlogPost::factory()->create();
        BlogPost::factory()->published()->create(['published_at' => now()->addDay()]);

        $this->assertSame([$live->id], BlogPost::published()->pluck('id')->all());
    }

    public function test_admin_lists_drafts_and_published_posts_and_deletes_one(): void
    {
        $this->actingAsAdmin();
        $draft = BlogPost::factory()->create(['title' => 'A draft']);
        BlogPost::factory()->published()->create(['title' => 'Live post']);

        $this->get('/admin/blog')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/BlogPostListPage')
                ->has('posts.data', 2)
                ->where('posts.data.0.title', 'A draft')
                ->where('posts.data.0.status', 'draft')
                ->where('posts.data.1.status', 'published'));

        $this->delete("/admin/blog/{$draft->id}")->assertRedirect(route('admin.blog.index'));
        $this->assertModelMissing($draft);
    }

    public function test_only_admins_reach_the_blog_admin(): void
    {
        $post = BlogPost::factory()->create();

        $this->get('/admin/blog')->assertRedirect('/login');

        $this->actingAs(User::factory()->create());
        $this->get('/admin/blog')->assertForbidden();
        $this->get('/admin/blog/create')->assertForbidden();
        $this->post('/admin/blog', $this->payload())->assertForbidden();
        $this->patch("/admin/blog/{$post->id}", $this->payload())->assertForbidden();
        $this->patch("/admin/blog/{$post->id}/publish", ['published' => true])->assertForbidden();
        $this->delete("/admin/blog/{$post->id}")->assertForbidden();

        $this->assertSame(1, BlogPost::count());
        $this->assertFalse($post->fresh()->isPublished());
    }

    public function test_deleting_the_author_keeps_the_post(): void
    {
        $author = User::factory()->admin()->create();
        $post = BlogPost::factory()->create(['author_id' => $author->id]);

        $author->forceDelete();

        $this->assertNull($post->fresh()->author_id);
    }

    public function test_markdown_rendering_strips_raw_html_and_unsafe_links(): void
    {
        $html = BlogMarkdown::toHtml(implode("\n\n", [
            '## Title',
            '<script>alert("x")</script>',
            '<img src=x onerror=alert(1)>',
            '<iframe src="https://evil.example"></iframe>',
            '[bad](javascript:alert(1)) [data](data:text/html;base64,PHNjcmlwdD4=) [ok](https://anitrack.app)',
            '![pic](https://example.com/a.png)',
            '- [ ] task',
            "| a | b |\n|---|---|\n| 1 | 2 |",
        ]));

        $this->assertStringContainsString('<h2>Title</h2>', $html);
        $this->assertStringNotContainsString('<script', $html);
        $this->assertStringNotContainsString('onerror', $html);
        $this->assertStringNotContainsString('<iframe', $html);
        $this->assertStringNotContainsString('javascript:', $html);
        $this->assertStringNotContainsString('data:text/html', $html);
        $this->assertStringContainsString('<a href="https://anitrack.app">ok</a>', $html);
        $this->assertStringContainsString('<img src="https://example.com/a.png" alt="pic" />', $html);
        $this->assertStringContainsString('<table>', $html);
    }
}
