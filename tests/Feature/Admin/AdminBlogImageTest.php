<?php

namespace Tests\Feature\Admin;

use App\Models\BlogPost;
use App\Models\User;
use App\Support\BlogImages;
use App\Support\BlogMarkdown;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Card 4480: image uploads in blog posts and a cover image per post.
 */
class AdminBlogImageTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function upload(UploadedFile $file)
    {
        return $this->postJson('/admin/blog/images', ['image' => $file]);
    }

    public function test_admin_uploads_an_image_stored_under_blog_on_the_public_disk(): void
    {
        $this->actingAsAdmin();

        $response = $this->upload(UploadedFile::fake()->image('Frieren poster.png', 800, 600));

        $response->assertCreated()->assertJson(['width' => 800, 'height' => 600]);
        $path = $response->json('path');
        $this->assertMatchesRegularExpression('#^blog/\d{4}/\d{2}/[0-9a-z]{26}-800x600\.png$#', $path);
        Storage::disk('public')->assertExists($path);
        $this->assertSame('/media/blog/'.substr($path, 5), $response->json('url'));
    }

    public function test_wide_images_are_scaled_down_to_1600_pixels(): void
    {
        $this->actingAsAdmin();

        $response = $this->upload(UploadedFile::fake()->image('wide.jpg', 3200, 1000));

        $response->assertCreated()->assertJson(['width' => 1600, 'height' => 500]);
        $stored = Storage::disk('public')->get($response->json('path'));
        $size = getimagesizefromstring($stored);
        $this->assertSame([1600, 500], [$size[0], $size[1]]);
        $this->assertSame(IMAGETYPE_JPEG, $size[2]);
    }

    public function test_webp_and_gif_are_accepted(): void
    {
        $this->actingAsAdmin();

        $this->upload(UploadedFile::fake()->image('a.webp', 100, 50))
            ->assertCreated()
            ->assertJsonPath('url', fn (string $url) => str_ends_with($url, '-100x50.webp'));
        $this->upload(UploadedFile::fake()->image('b.gif', 40, 30))
            ->assertCreated()
            ->assertJsonPath('url', fn (string $url) => str_ends_with($url, '-40x30.gif'));
    }

    public function test_other_file_types_are_refused(): void
    {
        $this->actingAsAdmin();

        $this->upload(UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
        $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $this->upload($svg)->assertUnprocessable()->assertJsonValidationErrors('image');

        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_a_text_file_named_like_an_image_is_refused(): void
    {
        $this->actingAsAdmin();

        $fake = UploadedFile::fake()->createWithContent('photo.jpg', 'not an image at all');

        $this->upload($fake)->assertUnprocessable()->assertJsonValidationErrors('image');
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_images_over_5_mb_are_refused(): void
    {
        $this->actingAsAdmin();

        $big = UploadedFile::fake()->image('big.jpg', 100, 100)->size(5121);

        $this->upload($big)->assertUnprocessable()->assertJsonValidationErrors(['image' => '5 MB']);
    }

    public function test_only_admins_can_upload(): void
    {
        $this->postJson('/admin/blog/images', ['image' => UploadedFile::fake()->image('x.png')])
            ->assertUnauthorized();

        $this->actingAs(User::factory()->create());
        $this->postJson('/admin/blog/images', ['image' => UploadedFile::fake()->image('x.png')])
            ->assertForbidden();

        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_uploaded_images_are_served_without_a_session_cookie(): void
    {
        $this->actingAsAdmin();
        $url = $this->upload(UploadedFile::fake()->image('x.png', 20, 10))->json('url');
        $this->app['auth']->forgetGuards();

        $response = $this->get($url);

        $response->assertOk();
        $this->assertSame('image/png', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('immutable', (string) $response->headers->get('Cache-Control'));
        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame([], $response->headers->getCookies());
    }

    public function test_unknown_or_malformed_image_paths_are_404(): void
    {
        Storage::disk('public')->put('secret.txt', 'x');

        $this->get('/media/blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-10x10.png')->assertNotFound();
        $this->get('/media/blog/../secret.txt')->assertNotFound();
        $this->get('/media/blog/2026/11/..%2F..%2Fsecret.txt')->assertNotFound();
    }

    public function test_a_post_saves_and_shows_its_cover_image(): void
    {
        $this->actingAsAdmin();
        $path = $this->upload(UploadedFile::fake()->image('cover.jpg', 1200, 630))->json('path');
        $post = BlogPost::factory()->create();

        $this->patch("/admin/blog/{$post->id}", [
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => '',
            'cover_image' => $path,
            'body' => $post->body,
        ])->assertSessionHasNoErrors();

        $post->refresh();
        $this->assertSame($path, $post->cover_image);
        $this->assertSame('/media/blog/'.substr($path, 5), $post->coverImageUrl());
        $this->assertSame(url($post->coverImageUrl()), $post->socialImageUrl());

        $this->get("/admin/blog/{$post->id}/edit")->assertInertia(fn ($page) => $page
            ->where('post.cover_image', $path)
            ->where('post.cover_image_url', $post->coverImageUrl()));

        // Removing it.
        $this->patch("/admin/blog/{$post->id}", [
            'title' => $post->title,
            'slug' => $post->slug,
            'cover_image' => '',
            'body' => $post->body,
        ])->assertSessionHasNoErrors();
        $this->assertNull($post->refresh()->cover_image);
        $this->assertNull($post->socialImageUrl());
    }

    public function test_a_cover_image_must_be_an_uploaded_blog_image(): void
    {
        $this->actingAsAdmin();
        Storage::disk('public')->put('avatars/someone.png', 'x');
        $post = BlogPost::factory()->create();

        foreach (['avatars/someone.png', '../.env', 'blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-10x10.png'] as $value) {
            $this->patch("/admin/blog/{$post->id}", [
                'title' => $post->title,
                'slug' => $post->slug,
                'cover_image' => $value,
                'body' => $post->body,
            ])->assertSessionHasErrors('cover_image');
        }

        $this->assertNull($post->refresh()->cover_image);
    }

    public function test_markdown_images_load_lazily_and_uploads_get_their_size(): void
    {
        $html = BlogMarkdown::toHtml(
            "![Frieren](/media/blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-1600x900.webp)\n\n"
            ."![Elsewhere](https://img.anilist.co/x.jpg)\n\n"
            .'![Our site](https://anitrack.app/media/blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-800x450.png)'
        );

        $this->assertStringContainsString(
            '<img loading="lazy" decoding="async" width="1600" height="900" src="/media/blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-1600x900.webp" alt="Frieren" />',
            $html,
        );
        $this->assertStringContainsString('<img loading="lazy" decoding="async" src="https://img.anilist.co/x.jpg" alt="Elsewhere" />', $html);
        // Another host's /media/blog/ path is not ours: no size taken from it.
        config(['app.url' => 'https://anitrack.app']);
        $this->assertStringContainsString(
            'width="800" height="450"',
            BlogMarkdown::toHtml('![x](https://anitrack.app/media/blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-800x450.png)'),
        );
        $this->assertStringNotContainsString(
            'width=',
            BlogMarkdown::toHtml('![x](https://evil.example/media/blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-800x450.png)'),
        );
    }

    public function test_dimensions_only_come_from_well_formed_blog_urls(): void
    {
        $this->assertSame([10, 20], BlogImages::dimensionsFromUrl('/media/blog/2026/11/01jabcdefghjkmnpqrstvwxyz0-10x20.jpg'));
        $this->assertNull(BlogImages::dimensionsFromUrl('/media/blog/2026/11/whatever-10x20.jpg'));
        $this->assertNull(BlogImages::dimensionsFromUrl('/images/01jabcdefghjkmnpqrstvwxyz0-10x20.jpg'));
    }
}
