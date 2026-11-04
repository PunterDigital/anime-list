<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout })

// Card 4198: a title an admin marked NSFW, opened while signed out.
defineProps<{
    slug: string
}>()
</script>

<template>
    <Head title="Sign in to view">
        <meta name="robots" content="noindex,nofollow" />
    </Head>

    <div class="mx-auto max-w-xl px-4 py-24 text-center" data-testid="nsfw-gate">
        <h1 class="text-2xl font-semibold text-white">
            This title is marked NSFW
        </h1>
        <p class="mt-3 text-gray-400">
            This title is marked NSFW. Sign in to view it.
        </p>
        <div class="mt-8 flex justify-center gap-3">
            <Link
                :href="route('login', { redirect: route('anime.show', slug, false) })"
                class="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-500"
            >
                Sign in
            </Link>
            <Link
                :href="route('home')"
                class="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-gray-500 hover:text-white"
            >
                Go to the home page
            </Link>
        </div>
    </div>
</template>
