<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BlogPostRequest;
use App\Models\BlogPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Blog posts in the admin area (card 4479): list, write, publish and delete.
 * Admin-only (the `admin` middleware on the route group).
 */
class AdminBlogPostController extends Controller
{
    public function index(): Response
    {
        $paginator = BlogPost::query()
            ->with('author:id,name')
            ->orderByRaw('published_at is null desc')
            ->orderByDesc('published_at')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->paginate(25)
            ->through(fn (BlogPost $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'status' => $post->status,
                'published_at' => $post->published_at?->toIso8601String(),
                'updated_at' => $post->updated_at?->toIso8601String(),
                'author' => $post->author?->name,
            ]);

        return Inertia::render('Admin/BlogPostListPage', [
            'posts' => [
                'data' => $paginator->items(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'total' => $paginator->total(),
                ],
                'links' => [
                    'prev' => $paginator->previousPageUrl(),
                    'next' => $paginator->nextPageUrl(),
                ],
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/BlogPostEditPage', [
            'post' => null,
        ]);
    }

    public function store(BlogPostRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $post = new BlogPost($data);
        $post->slug = $data['slug'] ?: BlogPost::uniqueSlugFor($data['title']);
        $post->status = BlogPost::STATUS_DRAFT;
        $post->author_id = $request->user()->id;
        $post->save();

        return redirect()
            ->route('admin.blog.edit', $post)
            ->with('message', 'Draft saved.');
    }

    public function edit(BlogPost $post): Response
    {
        return Inertia::render('Admin/BlogPostEditPage', [
            'post' => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'excerpt' => $post->excerpt,
                'cover_image' => $post->cover_image,
                'cover_image_url' => $post->coverImageUrl(),
                'body' => $post->body,
                'body_html' => $post->bodyHtml(),
                'status' => $post->status,
                'published_at' => $post->published_at?->toIso8601String(),
                'seo_title' => $post->seo_title,
                'meta_description' => $post->meta_description,
                'updated_at' => $post->updated_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(BlogPostRequest $request, BlogPost $post): RedirectResponse
    {
        $data = $request->validated();

        $post->fill($data);
        $post->slug = $data['slug'] ?: BlogPost::uniqueSlugFor($data['title'], $post->id);
        $post->save();

        return redirect()
            ->route('admin.blog.edit', $post)
            ->with('message', 'Post saved.');
    }

    /**
     * Publish or unpublish. The first publish date is kept, so taking a post
     * down and putting it back doesn't change its date.
     */
    public function publish(Request $request, BlogPost $post): RedirectResponse
    {
        $validated = $request->validate([
            'published' => ['required', 'boolean'],
        ]);

        if ($validated['published']) {
            $post->status = BlogPost::STATUS_PUBLISHED;
            $post->published_at ??= now();
        } else {
            $post->status = BlogPost::STATUS_DRAFT;
        }
        $post->save();

        return redirect()
            ->back()
            ->with('message', $post->isPublished() ? 'Post published.' : 'Post unpublished.');
    }

    public function destroy(BlogPost $post): RedirectResponse
    {
        $post->delete();

        return redirect()
            ->route('admin.blog.index')
            ->with('message', 'Post deleted.');
    }
}
