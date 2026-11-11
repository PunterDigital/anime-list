<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'
import type { AdminBlogPostRow } from '@/types/admin'

defineOptions({ layout: AppLayout })

defineProps<{
    posts: {
        data: AdminBlogPostRow[]
        meta: { current_page: number, last_page: number, total: number }
        links: { prev: string | null, next: string | null }
    }
}>()


function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function setPublished(post: AdminBlogPostRow, published: boolean) {
    router.patch(route('admin.blog.publish', { post: post.id }), { published }, { preserveScroll: true })
}

function destroy(post: AdminBlogPostRow) {
    if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return
    router.delete(route('admin.blog.destroy', { post: post.id }), { preserveScroll: true })
}
</script>

<template>
    <Head title="Admin: Blog" />

    <div class="mx-auto max-w-5xl space-y-6">
        <AdminNav />

        <div class="flex items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold">Blog</h1>
                <p class="text-sm text-gray-500">{{ posts.meta.total }} {{ posts.meta.total === 1 ? 'post' : 'posts' }}, drafts included.</p>
            </div>
            <Link
                :href="route('admin.blog.create')"
                class="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
            >
                New post
            </Link>
        </div>

        <div v-if="posts.data.length === 0" class="rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-8 text-center text-sm text-gray-400">
            No posts yet.
        </div>

        <div v-else class="overflow-x-auto rounded-lg border border-gray-800">
            <table class="w-full">
                <thead class="border-b border-gray-800 bg-gray-900">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Post</th>
                        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Published</th>
                        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Updated</th>
                        <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-800">
                    <tr v-for="post in posts.data" :key="post.id" class="hover:bg-gray-900/50">
                        <td class="px-4 py-3">
                            <div class="font-medium text-gray-100">{{ post.title }}</div>
                            <div class="text-xs text-gray-500">/blog/{{ post.slug }}<template v-if="post.author"> · {{ post.author }}</template></div>
                        </td>
                        <td class="px-4 py-3 text-sm">
                            <span
                                class="rounded px-2 py-0.5 text-xs font-medium"
                                :class="post.status === 'published' ? 'bg-green-900/40 text-green-300' : 'bg-gray-800 text-gray-300'"
                            >
                                {{ post.status === 'published' ? 'Published' : 'Draft' }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-gray-400">{{ formatDate(post.published_at) }}</td>
                        <td class="px-4 py-3 text-sm text-gray-400">{{ formatDate(post.updated_at) }}</td>
                        <td class="px-4 py-3 text-right text-sm">
                            <div class="flex items-center justify-end gap-2">
                                <Link :href="route('admin.blog.edit', { post: post.id })" class="text-primary-400 hover:text-primary-300">Edit</Link>
                                <button
                                    v-if="post.status === 'published'"
                                    type="button"
                                    class="text-gray-400 hover:text-gray-200"
                                    @click="setPublished(post, false)"
                                >
                                    Unpublish
                                </button>
                                <button
                                    v-else
                                    type="button"
                                    class="text-gray-400 hover:text-gray-200"
                                    @click="setPublished(post, true)"
                                >
                                    Publish
                                </button>
                                <button type="button" class="text-red-400 hover:text-red-300" @click="destroy(post)">Delete</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="posts.meta.last_page > 1" class="flex items-center justify-between text-sm">
            <Link v-if="posts.links.prev" :href="posts.links.prev" class="text-gray-400 hover:text-gray-200">&larr; Newer</Link>
            <span v-else />
            <span class="text-gray-500">Page {{ posts.meta.current_page }} of {{ posts.meta.last_page }}</span>
            <Link v-if="posts.links.next" :href="posts.links.next" class="text-gray-400 hover:text-gray-200">Older &rarr;</Link>
            <span v-else />
        </div>
    </div>
</template>
