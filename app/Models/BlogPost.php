<?php

namespace App\Models;

use App\Support\BlogImages;
use App\Support\BlogMarkdown;
use Database\Factories\BlogPostFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * A blog post (card 4479). Admins write them in the admin area; the body is
 * Markdown, rendered with {@see BlogMarkdown}.
 *
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string|null $excerpt
 * @property string|null $cover_image
 * @property string $body
 * @property string $status
 * @property Carbon|null $published_at
 * @property int|null $author_id
 * @property string|null $seo_title
 * @property string|null $meta_description
 */
class BlogPost extends Model
{
    /** @use HasFactory<BlogPostFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'cover_image',
        'body',
        'seo_title',
        'meta_description',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Published posts whose publish date has come.
     *
     * @param  Builder<BlogPost>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', self::STATUS_PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /** Published and its date has come: what guests can see (card 4481). */
    public function isLive(): bool
    {
        return $this->isPublished()
            && $this->published_at !== null
            && $this->published_at->lessThanOrEqualTo(now());
    }

    /**
     * The sitemap is cached for hours; publishing, editing or deleting a
     * post refreshes it (card 4481).
     */
    protected static function booted(): void
    {
        $forget = fn () => Cache::forget('sitemap:xml');
        static::saved($forget);
        static::deleted($forget);
    }

    public function bodyHtml(): string
    {
        return BlogMarkdown::toHtml($this->body);
    }

    /** The cover image's `/media/blog/...` path, or null (card 4480). */
    public function coverImageUrl(): ?string
    {
        return BlogImages::urlFor($this->cover_image);
    }

    /**
     * The absolute cover image URL for Open Graph / Twitter cards (card
     * 4480; the public pages in 4481 print it), or null without a cover.
     */
    public function socialImageUrl(): ?string
    {
        $path = $this->coverImageUrl();

        return $path === null ? null : url($path);
    }

    /**
     * A slug from the title that no other post uses: "my-post", then
     * "my-post-2", "my-post-3" and so on.
     */
    public static function uniqueSlugFor(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'post';
        $base = Str::limit($base, 190, '');
        $slug = $base;
        $n = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$base}-{$n}";
            $n++;
        }

        return $slug;
    }
}
