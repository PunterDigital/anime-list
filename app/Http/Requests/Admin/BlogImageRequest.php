<?php

namespace App\Http\Requests\Admin;

use App\Support\BlogImages;
use Illuminate\Foundation\Http\FormRequest;

/**
 * An image upload for a blog post (card 4480): JPEG, PNG, WebP or GIF, up
 * to 5 MB. {@see BlogImages::store()} checks the real image type again.
 */
class BlogImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_admin;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,gif',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif',
                'max:'.BlogImages::MAX_KILOBYTES,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.mimes' => 'Upload a JPEG, PNG, WebP or GIF image.',
            'image.mimetypes' => 'Upload a JPEG, PNG, WebP or GIF image.',
            'image.max' => 'Images can be 5 MB at most.',
        ];
    }
}
