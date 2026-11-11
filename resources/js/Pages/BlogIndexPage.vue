<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'
import type { BlogIndexSeo, BlogPostCard } from '@/types/blog'

// Card 4481: /blog, the published posts newest first.

defineOptions({ layout: AppLayout })

defineProps<{
    posts: {
        data: BlogPostCard[]
        meta: { current_page: number; last_page: number; total: number }
        links: { prev: string | null; next: string | null }
    }
    seo: BlogIndexSeo
}>()
</script>

<template>
    <Head :title="seo.title">
        <meta name="description" :content="seo.description" />
        <link rel="canonical" :href="seo.url" />
        <link rel="alternate" type="application/rss+xml" title="AniTrack Blog" :href="seo.feed" />
        <meta property="og:title" :content="`${seo.title} | AniTrack`" />
        <meta property="og:description" :content="seo.description" />
        <meta property="og:url" :content="seo.url" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" :content="`${seo.title} | AniTrack`" />
        <meta name="twitter:description" :content="seo.description" />
    </Head>

    <div class="mx-auto max-w-4xl space-y-8 py-4">
        <header class="space-y-2">
            <h1 class="text-3xl font-bold sm:text-4xl">Blog</h1>
            <p class="text-gray-400">{{ seo.description }}</p>
        </header>

        <p v-if="posts.data.length === 0" class="text-gray-400" data-test="blog-empty">No posts yet. Check back soon.</p>

        <ul v-else class="grid gap-6 sm:grid-cols-2" data-test="blog-list">
            <li v-for="post in posts.data" :key="post.slug">
                <article class="flex h-full flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 transition hover:border-gray-700">
                    <Link :href="route('blog.show', { slug: post.slug })" class="block" tabindex="-1" aria-hidden="true">
                        <img
                            v-if="post.cover"
                            :src="post.cover.url"
                            alt=""
                            :width="post.cover.width ?? undefined"
                            :height="post.cover.height ?? undefined"
                            loading="lazy"
                            decoding="async"
                            class="aspect-[1200/630] w-full object-cover"
                        />
                        <div v-else class="aspect-[1200/630] w-full bg-gradient-to-br from-gray-800 to-gray-900" />
                    </Link>
                    <div class="flex flex-1 flex-col gap-2 p-5">
                        <h2 class="text-lg font-semibold leading-snug text-gray-100">
                            <Link :href="route('blog.show', { slug: post.slug })" class="hover:text-primary-400">{{ post.title }}</Link>
                        </h2>
                        <p v-if="post.excerpt" class="text-sm leading-relaxed text-gray-400">{{ post.excerpt }}</p>
                        <p class="mt-auto pt-2 text-xs text-gray-500">
                            <time v-if="post.published_at" :datetime="post.published_at">{{ post.published_label }}</time>
                            <span v-if="post.author"> · {{ post.author }}</span>
                        </p>
                    </div>
                </article>
            </li>
        </ul>

        <nav v-if="posts.meta.last_page > 1" class="flex items-center justify-between text-sm" aria-label="Blog pages">
            <Link v-if="posts.links.prev" :href="posts.links.prev" rel="prev" class="text-gray-300 hover:text-gray-100">&larr; Newer posts</Link>
            <span v-else />
            <span class="text-gray-500">Page {{ posts.meta.current_page }} of {{ posts.meta.last_page }}</span>
            <Link v-if="posts.links.next" :href="posts.links.next" rel="next" class="text-gray-300 hover:text-gray-100">Older posts &rarr;</Link>
            <span v-else />
        </nav>
    </div>
</template>
