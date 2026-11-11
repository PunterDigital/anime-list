<?php

namespace App\Support;

use App\Http\Controllers\BlogImageController;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Blog image uploads (card 4480). Images live on the `public` disk under
 * `blog/` and are served by {@see BlogImageController}
 * at `/media/blog/...`, so they work without a `public/storage` symlink.
 *
 * JPEG, PNG and WebP are re-encoded with GD: anything wider than
 * {@see self::MAX_WIDTH} is scaled down, and the re-encode drops EXIF data
 * (camera GPS and the like). GIFs are stored as uploaded, since GD would keep
 * only the first frame of an animation.
 *
 * The stored name carries the image size (`<ulid>-<w>x<h>.<ext>`), which is
 * how the Markdown renderer adds width/height without a database lookup.
 */
class BlogImages
{
    public const DISK = 'public';

    public const DIRECTORY = 'blog';

    public const MAX_WIDTH = 1600;

    /** Upload limit in kilobytes (the `max` rule's unit). */
    public const MAX_KILOBYTES = 5120;

    /** Refuse anything bigger before GD decodes it (memory). */
    public const MAX_PIXELS = 30_000_000;

    public const URL_PREFIX = '/media/blog/';

    /** A stored path relative to {@see self::DIRECTORY}: `2026/11/<ulid>-1600x900.webp`. */
    public const RELATIVE_PATTERN = '\d{4}/\d{2}/[0-9a-z]{26}-(\d{1,5})x(\d{1,5})\.(?:jpg|png|webp|gif)';

    private const EXTENSIONS = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_WEBP => 'webp',
        IMAGETYPE_GIF => 'gif',
    ];

    /**
     * Store an upload. Returns the disk path (`blog/2026/11/...`), its public
     * URL path and the stored size.
     *
     * @return array{path: string, url: string, width: int, height: int}
     */
    public static function store(UploadedFile $file): array
    {
        $source = $file->getRealPath();
        $info = $source !== false ? @getimagesize($source) : false;
        if ($info === false || ! isset(self::EXTENSIONS[$info[2]])) {
            throw new RuntimeException('That file is not a JPEG, PNG, WebP or GIF image.');
        }

        [$width, $height, $type] = $info;
        if ($width < 1 || $height < 1 || $width * $height > self::MAX_PIXELS) {
            throw new RuntimeException('That image is too large (30 megapixels at most).');
        }

        $extension = self::EXTENSIONS[$type];

        if ($type === IMAGETYPE_GIF) {
            $bytes = (string) file_get_contents($source);
        } else {
            [$bytes, $width, $height] = self::reencode($source, $type, $width, $height);
        }

        $relative = now()->format('Y/m').'/'.strtolower((string) Str::ulid())."-{$width}x{$height}.{$extension}";
        $path = self::DIRECTORY.'/'.$relative;

        Storage::disk(self::DISK)->put($path, $bytes);

        return [
            'path' => $path,
            'url' => self::URL_PREFIX.$relative,
            'width' => $width,
            'height' => $height,
        ];
    }

    /** Is this a disk path that {@see self::store()} could have made? */
    public static function isStoredPath(?string $path): bool
    {
        return is_string($path)
            && preg_match('#^'.self::DIRECTORY.'/'.self::RELATIVE_PATTERN.'$#', $path) === 1;
    }

    public static function exists(string $path): bool
    {
        return self::isStoredPath($path) && Storage::disk(self::DISK)->exists($path);
    }

    /** `/media/blog/...` for a disk path, or null if it isn't one of ours. */
    public static function urlFor(?string $path): ?string
    {
        if (! self::isStoredPath($path)) {
            return null;
        }

        return self::URL_PREFIX.substr((string) $path, strlen(self::DIRECTORY) + 1);
    }

    /**
     * The width and height in a blog image URL (`/media/blog/...` or the
     * same on this site's absolute URL), or null for any other image.
     *
     * @return array{0: int, 1: int}|null
     */
    public static function dimensionsFromUrl(string $url): ?array
    {
        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || ! str_starts_with($path, self::URL_PREFIX)) {
            return null;
        }

        $host = parse_url($url, PHP_URL_HOST);
        if (is_string($host) && $host !== parse_url((string) config('app.url'), PHP_URL_HOST)) {
            return null;
        }

        if (preg_match('#^'.preg_quote(self::URL_PREFIX, '#').self::RELATIVE_PATTERN.'$#', $path, $m) !== 1) {
            return null;
        }

        return [(int) $m[1], (int) $m[2]];
    }

    /**
     * @return array{0: string, 1: int, 2: int}
     */
    private static function reencode(string $source, int $type, int $width, int $height): array
    {
        if (! function_exists('imagecreatefromstring')) {
            throw new RuntimeException('Image processing (GD) is not available on this server.');
        }

        // A 30 MP image takes ~120 MB once decoded.
        $limit = ini_get('memory_limit');
        if ($limit !== false && $limit !== '-1' && self::bytes($limit) < 512 * 1024 * 1024) {
            ini_set('memory_limit', '512M');
        }

        $image = @imagecreatefromstring((string) file_get_contents($source));
        if ($image === false) {
            throw new RuntimeException('That image could not be read.');
        }

        if ($type === IMAGETYPE_JPEG) {
            $image = self::applyExifOrientation($image, $source);
            $width = imagesx($image);
            $height = imagesy($image);
        }

        if ($width > self::MAX_WIDTH) {
            $newHeight = max(1, (int) round($height * self::MAX_WIDTH / $width));
            $resized = imagecreatetruecolor(self::MAX_WIDTH, $newHeight);
            if ($type !== IMAGETYPE_JPEG) {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
                imagefill($resized, 0, 0, (int) imagecolorallocatealpha($resized, 0, 0, 0, 127));
            }
            imagecopyresampled($resized, $image, 0, 0, 0, 0, self::MAX_WIDTH, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
            $width = self::MAX_WIDTH;
            $height = $newHeight;
        } elseif ($type !== IMAGETYPE_JPEG) {
            imagealphablending($image, false);
            imagesavealpha($image, true);
        }

        ob_start();
        $ok = match ($type) {
            IMAGETYPE_JPEG => imagejpeg($image, null, 85),
            IMAGETYPE_PNG => imagepng($image, null, 6),
            IMAGETYPE_WEBP => imagewebp($image, null, 85),
        };
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        if (! $ok || $bytes === '') {
            throw new RuntimeException('That image could not be saved.');
        }

        return [$bytes, $width, $height];
    }

    /**
     * Phones store photos sideways with an EXIF Orientation tag; the
     * re-encode drops the tag, so turn the pixels instead.
     */
    private static function applyExifOrientation(\GdImage $image, string $source): \GdImage
    {
        if (! function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($source);
        $orientation = is_array($exif) ? (int) ($exif['Orientation'] ?? 1) : 1;

        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => $image,
        };

        if ($rotated !== false && $rotated !== $image) {
            imagedestroy($image);

            return $rotated;
        }

        return $image;
    }

    private static function bytes(string $value): int
    {
        $value = trim($value);
        $number = (int) $value;

        return match (strtolower(substr($value, -1))) {
            'g' => $number * 1024 ** 3,
            'm' => $number * 1024 ** 2,
            'k' => $number * 1024,
            default => $number,
        };
    }
}
