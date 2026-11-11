import axios from 'axios'

// Card 4480: uploads one image for a blog post (the editor and the cover
// image field). The server checks the type (JPEG, PNG, WebP, GIF) and size
// (5 MB), scales anything wider than 1600px down and answers where it is.

export interface UploadedBlogImage {
    /** Disk path, saved as a post's cover image. */
    path: string
    /** `/media/blog/...`, written into the Markdown. */
    url: string
    width: number
    height: number
}

export const BLOG_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

const MAX_BYTES = 5 * 1024 * 1024
const TYPES = BLOG_IMAGE_ACCEPT.split(',')

export function isBlogImageFile(file: File): boolean {
    return TYPES.includes(file.type)
}

/** "frieren-poster_2.png" -> "frieren poster 2", a starting point for alt text. */
export function altFromFileName(name: string): string {
    const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
    return /^image$/i.test(base) ? '' : base
}

export async function uploadBlogImage(file: File): Promise<UploadedBlogImage> {
    // Checked here too, so a too-big file fails at once instead of after
    // the upload.
    if (!isBlogImageFile(file)) {
        throw new Error('Upload a JPEG, PNG, WebP or GIF image.')
    }
    if (file.size > MAX_BYTES) {
        throw new Error('Images can be 5 MB at most.')
    }

    const body = new FormData()
    body.append('image', file)

    try {
        const { data } = await axios.post<UploadedBlogImage>(route('admin.blog.images.store'), body, {
            headers: { Accept: 'application/json' },
        })
        return data
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
            const message = data?.errors?.image?.[0] ?? data?.message
            if (error.response?.status === 413) {
                throw new Error('Images can be 5 MB at most.', { cause: error })
            }
            if (message) {
                throw new Error(message, { cause: error })
            }
        }
        throw new Error('The image could not be uploaded. Please try again.', { cause: error })
    }
}
