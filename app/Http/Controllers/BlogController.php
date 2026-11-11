<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Services\FeatureFlagService;
use App\Support\BlogImages;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public blog (card 4481): `/blog` and `/blog/{slug}`, behind the `blog`
 * flag. Admins always see the pages, drafts included (with a preview
 * banner and noindex), so a post can be checked before it's published.
 */
class BlogController extends Controller
{
    public const PER_PAGE = 12;

    public function __construct(
        private readonly FeatureFlagService $flags,
    ) {}

    public function index(Request $request): Response
    {
        $this->ensureVisible($request);

        $paginator = BlogPost::query()
            ->published()
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        abort_if($paginator->currentPage() > 1 && $paginator->isEmpty(), 404);

        $page = $paginator->currentPage();

        return Inertia::render('BlogIndexPage', [
            'posts' => [
                'data' => collect($paginator->items())->map(fn (BlogPost $post) => $this->card($post))->all(),
                'meta' => [
                    'current_page' => $page,
                    'last_page' => $paginator->lastPage(),
                    'total' => $paginator->total(),
                ],
                'links' => [
                    'prev' => $paginator->previousPageUrl(),
                    'next' => $paginator->nextPageUrl(),
                ],
            ],
            'seo' => [
                'title' => $page > 1 ? "Blog (page {$page})" : 'Blog',
                'description' => 'News, guides and seasonal picks from the AniTrack team.',
                'url' => $page > 1 ? route('blog.index', ['page' => $page]) : route('blog.index'),
                'feed' => route('blog.feed'),
            ],
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $this->ensureVisible($request);

        $post = BlogPost::query()->where('slug', $slug)->with('author:id,name')->first();
        $isAdmin = (bool) $request->user()?->is_admin;

        abort_if($post === null || (! $post->isLive() && ! $isAdmin), 404);

        $url = route('blog.show', $post->slug);
        $description = $this->description($post);
        $image = $post->socialImageUrl();
        $preview = ! $post->isLive();

        return Inertia::render('BlogPostPage', [
            'post' => [
                ...$this->card($post),
                'body_html' => $post->bodyHtml(),
                'updated_at' => $post->updated_at?->toIso8601String(),
            ],
            'preview' => $preview,
            'seo' => [
                'title' => $post->seo_title ?: $post->title,
                'description' => $description,
                'url' => $url,
                'image' => $image,
                'feed' => route('blog.feed'),
                'published_time' => $post->published_at?->toIso8601String(),
                'modified_time' => $post->updated_at?->toIso8601String(),
                'noindex' => $preview,
            ],
            // Printed by the root view as a <script type="application/ld+json">,
            // so crawlers get it in the first HTML whatever the SSR state.
            'json_ld' => $preview ? null : $this->jsonLd($post, $url, $description, $image),
        ]);
    }

    /**
     * A post as the list and the post page show it. Dates are formatted here
     * so SSR (Node) and the browser can't disagree on the time zone.
     *
     * @return array<string, mixed>
     */
    private function card(BlogPost $post): array
    {
        $cover = BlogImages::urlFor($post->cover_image);
        $size = $cover ? BlogImages::dimensionsFromUrl($cover) : null;

        return [
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'cover' => $cover ? ['url' => $cover, 'width' => $size[0] ?? null, 'height' => $size[1] ?? null] : null,
            'published_at' => $post->published_at?->toIso8601String(),
            'published_label' => $post->published_at?->format('F j, Y'),
            'author' => $post->author?->name,
        ];
    }

    private function description(BlogPost $post): string
    {
        $text = $post->meta_description ?: $post->excerpt;
        if (! $text) {
            $text = trim((string) preg_replace('/\s+/', ' ', strip_tags($post->bodyHtml())));
        }

        return Str::limit($text, 160);
    }

    /**
     * @return array<string, mixed>
     */
    private function jsonLd(BlogPost $post, string $url, string $description, ?string $image): array
    {
        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'BlogPosting',
            'headline' => Str::limit($post->title, 110, ''),
            'description' => $description,
            'image' => $image ? [$image] : null,
            'datePublished' => $post->published_at?->toIso8601String(),
            'dateModified' => ($post->updated_at ?? $post->published_at)?->toIso8601String(),
            'author' => [
                '@type' => 'Person',
                'name' => $post->author?->name ?? 'AniTrack',
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name' => 'AniTrack',
                'url' => url('/'),
            ],
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id' => $url,
            ],
            'url' => $url,
        ], fn ($value) => $value !== null);
    }

    private function ensureVisible(Request $request): void
    {
        $user = $request->user();

        abort_unless($user?->is_admin || $this->flags->active('blog', $user), 404);
    }
}
