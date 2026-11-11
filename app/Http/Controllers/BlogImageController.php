<?php

namespace App\Http\Controllers;

use App\Support\BlogImages;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

/**
 * Serves blog images from the `public` disk at `/media/blog/...` (card 4480),
 * so they don't depend on a `public/storage` symlink on the server. Outside
 * the web group: no session, no cookies. Names are unique per upload, so
 * browsers may cache them for a year.
 */
class BlogImageController extends Controller
{
    public function __invoke(string $path): Response
    {
        $diskPath = BlogImages::DIRECTORY.'/'.$path;

        abort_unless(BlogImages::exists($diskPath), 404);

        return Storage::disk(BlogImages::DISK)->response($diskPath, null, [
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
