<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import type { BlogPostFull, BlogPostSeo } from '@/types/blog'

// Card 4481: one post at /blog/{slug}. The title is the page's only <h1>;
// the body's headings start at <h2> (BlogMarkdown turns a "# " into one).
// Drafts and future posts reach here only for admins, with a banner and
// noindex. The BlogPosting JSON-LD is printed by the root view.

defineOptions({ layout: AppLayout })

const props = defineProps<{
    post: BlogPostFull
    preview: boolean
    seo: BlogPostSeo
}>()

const page = usePage<{ auth: { user: { is_admin?: boolean } | null } }>()
const isAdmin = computed(() => !!page.props.auth?.user?.is_admin)
const ogTitle = computed(() => props.seo.title)
</script>

<template>
    <Head :title="seo.title">
        <meta name="description" :content="seo.description" />
        <meta v-if="seo.noindex" name="robots" content="noindex,nofollow" />
        <link rel="canonical" :href="seo.url" />
        <link rel="alternate" type="application/rss+xml" title="AniTrack Blog" :href="seo.feed" />
        <meta property="og:title" :content="ogTitle" />
        <meta property="og:description" :content="seo.description" />
        <meta property="og:url" :content="seo.url" />
        <meta property="og:type" content="article" />
        <meta v-if="seo.image" property="og:image" :content="seo.image" />
        <meta v-if="seo.published_time" property="article:published_time" :content="seo.published_time" />
        <meta v-if="seo.modified_time" property="article:modified_time" :content="seo.modified_time" />
        <meta name="twitter:card" :content="seo.image ? 'summary_large_image' : 'summary'" />
        <meta name="twitter:title" :content="ogTitle" />
        <meta name="twitter:description" :content="seo.description" />
        <meta v-if="seo.image" name="twitter:image" :content="seo.image" />
    </Head>

    <article class="mx-auto max-w-3xl space-y-6 py-4" data-test="blog-post">
        <div
            v-if="preview"
            class="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
            role="note"
            data-test="blog-preview-banner"
        >
            Preview: this post isn't published, so only admins can see it.
        </div>

        <nav class="text-sm" aria-label="Breadcrumb">
            <Link :href="route('blog.index')" class="text-gray-400 transition hover:text-gray-200">&larr; Blog</Link>
        </nav>

        <header class="space-y-3">
            <h1 class="text-3xl font-bold leading-tight sm:text-4xl">{{ post.title }}</h1>
            <p class="text-sm text-gray-500">
                <time v-if="post.published_at" :datetime="post.published_at">{{ post.published_label }}</time>
                <span v-if="post.author"> · {{ post.author }}</span>
                <template v-if="isAdmin">
                    · <Link :href="route('admin.blog.index')" class="text-gray-400 hover:text-gray-200">Manage posts</Link>
                </template>
            </p>
        </header>

        <img
            v-if="post.cover"
            :src="post.cover.url"
            alt=""
            :width="post.cover.width ?? undefined"
            :height="post.cover.height ?? undefined"
            decoding="async"
            fetchpriority="high"
            class="w-full rounded-xl border border-gray-800 object-cover"
            data-test="blog-cover"
        />

        <!-- body_html is rendered on the server with raw HTML stripped (App\Support\BlogMarkdown). -->
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="blog-prose" data-test="blog-body" v-html="post.body_html" />
    </article>
</template>
