<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { BLOG_IMAGE_ACCEPT, uploadBlogImage } from '@/composables/useBlogImageUpload'
import { router, useForm } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'
import BlogEditor from '@/Components/BlogEditor.vue'
import AppInputText from '@/Components/ui/AppInputText.vue'
import AppTextarea from '@/Components/ui/AppTextarea.vue'
import AppButton from '@/Components/ui/AppButton.vue'
import type { AdminBlogPost } from '@/types/admin'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    post: AdminBlogPost | null
}>()

const form = useForm({
    title: props.post?.title ?? '',
    slug: props.post?.slug ?? '',
    excerpt: props.post?.excerpt ?? '',
    cover_image: props.post?.cover_image ?? '',
    body: props.post?.body ?? '',
    seo_title: props.post?.seo_title ?? '',
    meta_description: props.post?.meta_description ?? '',
})

const isPublished = computed(() => props.post?.status === 'published')

// Card 4480: the cover image, also the post's Open Graph / Twitter image.
// The upload answers a disk path (saved with the form) and a URL to preview.
const toast = useToast()
const coverInput = ref<HTMLInputElement | null>(null)
const coverUrl = ref<string | null>(props.post?.cover_image_url ?? null)
const coverUploading = ref(false)

async function onCoverChosen(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    coverUploading.value = true
    try {
        const image = await uploadBlogImage(file)
        form.cover_image = image.path
        coverUrl.value = image.url
        form.clearErrors('cover_image')
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Upload failed',
            detail: error instanceof Error ? error.message : 'The image could not be uploaded.',
            life: 6000,
        })
    } finally {
        coverUploading.value = false
    }
}

function removeCover() {
    form.cover_image = ''
    coverUrl.value = null
}

function submit() {
    if (props.post) {
        form.patch(route('admin.blog.update', { post: props.post.id }), {
            preserveScroll: true,
            onSuccess: () => form.defaults(),
        })
    } else {
        // The redirect lands on this same page component (now with a post),
        // so the form isn't rebuilt: take the slug the server made.
        form.post(route('admin.blog.store'), {
            onSuccess: () => {
                form.slug = props.post?.slug ?? form.slug
                form.defaults()
            },
        })
    }
}

function setPublished(published: boolean) {
    if (!props.post) return
    router.patch(route('admin.blog.publish', { post: props.post.id }), { published }, { preserveScroll: true })
}

function destroy() {
    if (!props.post) return
    if (!window.confirm(`Delete "${props.post.title}"? This can't be undone.`)) return
    router.delete(route('admin.blog.destroy', { post: props.post.id }))
}

function formatDateTime(iso: string | null): string | null {
    if (!iso) return null
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
    <Head :title="post ? `Edit post: ${post.title}` : 'New post'" />

    <div class="mx-auto max-w-4xl space-y-6">
        <AdminNav />

        <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
                <Link :href="route('admin.blog.index')" class="text-sm text-gray-400 transition hover:text-gray-200">
                    &larr; All posts
                </Link>
                <h1 class="mt-2 truncate text-2xl font-bold">{{ post ? post.title : 'New post' }}</h1>
                <p v-if="post" class="mt-1 text-sm" data-testid="blog-status">
                    <span :class="isPublished ? 'text-green-400' : 'text-gray-400'">{{ isPublished ? 'Published' : 'Draft' }}</span>
                    <span v-if="post.published_at" class="text-gray-500"> · first published {{ formatDateTime(post.published_at) }}</span>
                </p>
            </div>
            <div v-if="post" class="flex flex-shrink-0 items-center gap-2">
                <AppButton
                    v-if="isPublished"
                    label="Unpublish"
                    severity="secondary"
                    outlined
                    size="small"
                    @click="setPublished(false)"
                />
                <AppButton v-else label="Publish" size="small" @click="setPublished(true)" />
                <AppButton label="Delete" severity="danger" text size="small" @click="destroy" />
            </div>
        </div>

        <form class="space-y-5" data-testid="blog-form" @submit.prevent="submit">
            <div class="space-y-1">
                <label for="blog-title" class="text-sm font-medium text-gray-200">Title</label>
                <AppInputText id="blog-title" v-model="form.title" class="w-full" maxlength="200" :invalid="!!form.errors.title" />
                <p v-if="form.errors.title" class="text-sm text-red-400">{{ form.errors.title }}</p>
            </div>

            <div class="space-y-1">
                <label for="blog-slug" class="text-sm font-medium text-gray-200">Slug</label>
                <div class="flex items-center gap-2">
                    <span class="text-sm text-gray-500">/blog/</span>
                    <AppInputText id="blog-slug" v-model="form.slug" class="w-full" maxlength="190" placeholder="Made from the title if left empty" :invalid="!!form.errors.slug" />
                </div>
                <p v-if="form.errors.slug" class="text-sm text-red-400">{{ form.errors.slug }}</p>
                <p v-else-if="isPublished" class="text-xs text-amber-300">This post is live: changing the slug changes its address.</p>
            </div>

            <div class="space-y-1">
                <label for="blog-excerpt" class="text-sm font-medium text-gray-200">Excerpt</label>
                <AppTextarea id="blog-excerpt" v-model="form.excerpt" class="w-full" rows="2" maxlength="500" :invalid="!!form.errors.excerpt" />
                <p class="text-xs text-gray-500">A sentence or two shown in post listings.</p>
                <p v-if="form.errors.excerpt" class="text-sm text-red-400">{{ form.errors.excerpt }}</p>
            </div>

            <div class="space-y-2" data-testid="blog-cover">
                <span class="text-sm font-medium text-gray-200">Cover image</span>
                <div v-if="coverUrl" class="overflow-hidden rounded-md border border-gray-800 bg-gray-900/40">
                    <img :src="coverUrl" alt="Cover image preview" class="max-h-64 w-full object-cover" data-testid="blog-cover-preview" />
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <AppButton
                        :label="coverUrl ? 'Replace cover' : 'Upload cover'"
                        severity="secondary"
                        outlined
                        size="small"
                        :loading="coverUploading"
                        :disabled="coverUploading"
                        @click="coverInput?.click()"
                    />
                    <AppButton v-if="coverUrl" label="Remove cover" severity="danger" text size="small" @click="removeCover" />
                    <input
                        ref="coverInput"
                        type="file"
                        class="hidden"
                        :accept="BLOG_IMAGE_ACCEPT"
                        data-testid="blog-cover-file"
                        @change="onCoverChosen"
                    />
                </div>
                <p class="text-xs text-gray-500">Shown with the post and used when it's shared (Open Graph / Twitter). 1200 × 630 works best. JPEG, PNG, WebP or GIF, up to 5 MB.</p>
                <p v-if="form.errors.cover_image" class="text-sm text-red-400">{{ form.errors.cover_image }}</p>
            </div>

            <div class="space-y-1">
                <span class="text-sm font-medium text-gray-200">Body</span>
                <BlogEditor v-model="form.body" :invalid="!!form.errors.body" />
                <p class="text-xs text-gray-500">Saved as Markdown. Use the Markdown button to paste or edit the raw text.</p>
                <p v-if="form.errors.body" class="text-sm text-red-400">{{ form.errors.body }}</p>
            </div>

            <fieldset class="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3">
                <legend class="px-1 text-sm font-medium text-gray-300">Search engines (optional)</legend>
                <div class="space-y-1">
                    <label for="blog-seo-title" class="text-sm text-gray-200">SEO title</label>
                    <AppInputText id="blog-seo-title" v-model="form.seo_title" class="w-full" maxlength="200" placeholder="The post title if left empty" :invalid="!!form.errors.seo_title" />
                    <p class="text-xs text-gray-500">{{ form.seo_title.length }} characters; about 60 show in search results.</p>
                    <p v-if="form.errors.seo_title" class="text-sm text-red-400">{{ form.errors.seo_title }}</p>
                </div>
                <div class="space-y-1">
                    <label for="blog-meta-description" class="text-sm text-gray-200">Meta description</label>
                    <AppTextarea id="blog-meta-description" v-model="form.meta_description" class="w-full" rows="2" maxlength="320" placeholder="The excerpt if left empty" :invalid="!!form.errors.meta_description" />
                    <p class="text-xs text-gray-500">{{ form.meta_description.length }} characters; about 155 show in search results.</p>
                    <p v-if="form.errors.meta_description" class="text-sm text-red-400">{{ form.errors.meta_description }}</p>
                </div>
            </fieldset>

            <div class="flex items-center gap-3">
                <AppButton type="submit" :label="post ? 'Save' : 'Save draft'" :loading="form.processing" :disabled="form.processing" />
                <span v-if="form.isDirty && post" class="text-xs text-gray-500">Unsaved changes</span>
            </div>
        </form>

        <section v-if="post" class="space-y-2">
            <h2 class="text-sm font-medium uppercase tracking-wide text-gray-400">Preview (as saved)</h2>
            <!-- body_html is rendered on the server with raw HTML stripped (App\Support\BlogMarkdown). -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <article class="blog-prose rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3" data-testid="blog-preview" v-html="post.body_html" />
        </section>
    </div>
</template>
