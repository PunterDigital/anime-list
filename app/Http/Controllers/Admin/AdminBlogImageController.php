<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BlogImageRequest;
use App\Support\BlogImages;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Image uploads from the blog editor and the cover image field (card 4480).
 * Admin-only (the `admin` middleware on the route group). Answers JSON for
 * the editor to insert: the disk path (stored as a post's cover image), the
 * URL (written into the Markdown) and the stored size.
 */
class AdminBlogImageController extends Controller
{
    public function store(BlogImageRequest $request): JsonResponse
    {
        try {
            $image = BlogImages::store($request->file('image'));
        } catch (RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['image' => [$e->getMessage()]],
            ], 422);
        }

        return response()->json($image, 201);
    }
}
