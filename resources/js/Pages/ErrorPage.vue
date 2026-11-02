<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AnimeCard from '@/Components/AnimeCard.vue'
import type { AnimeCard as AnimeCardType } from '@/types/anime'

defineOptions({ layout: false })

const props = defineProps<{
    status: number
    // Set (with the props below) when the `error-pages` flag is on and the
    // status renders inside the site layout: 403, 404, 419 and 451.
    layout?: boolean
    suggestedSearch?: string | null
    alternatives?: AnimeCardType[]
}>()

const titles: Record<number, string> = {
    403: 'Forbidden',
    404: 'Not Found',
    419: 'Session Expired',
    451: 'Unavailable',
    500: 'Server Error',
    503: 'Service Unavailable',
}

const descriptions: Record<number, string> = {
    403: 'You don\'t have permission to access this page.',
    404: 'The page you\'re looking for doesn\'t exist.',
    419: 'Your session has expired. Please refresh the page and try again.',
    451: 'This page has been removed and is no longer available.',
    500: 'Something went wrong on our end. Please try again later.',
    503: 'We\'re currently undergoing maintenance. Please check back soon.',
}

const headings: Record<number, string> = {
    403: 'You can\'t open this page',
    404: 'We couldn\'t find that page',
    419: 'Your session timed out',
    451: 'This anime page is no longer available',
}

const nextSteps: Record<number, string> = {
    403: 'Your account doesn\'t have access to it. If you think it should, sign in with the right account.',
    404: 'The link may be wrong, or the page may have moved. Search for what you were looking for, or start from one of the pages below.',
    419: 'We couldn\'t finish what you were doing because the page was open for too long. Reload the page and try again.',
    451: 'It was removed from AniTrack. Here are some other anime you might like instead.',
}

const page = usePage<{ auth: { user: unknown | null } }>()
const signedIn = computed(() => !!page.props.auth?.user)
const alternatives = computed(() => props.alternatives ?? [])

function goBack() {
    if (window.history.length > 1) {
        window.history.back()
    } else {
        window.location.href = route('home')
    }
}

function reload() {
    window.location.reload()
}
</script>

<template>
    <Head :title="`${status} - ${titles[status] ?? 'Error'}`" />

    <AppLayout v-if="layout">
        <section class="mx-auto max-w-3xl py-10 text-center" data-test="error-page">
            <p class="text-sm font-semibold uppercase tracking-wider text-primary-400">Error {{ status }}</p>
            <h1 class="mt-2 text-3xl font-bold text-gray-100 sm:text-4xl">{{ headings[status] ?? titles[status] }}</h1>
            <p class="mt-4 text-gray-400">{{ nextSteps[status] ?? descriptions[status] }}</p>

            <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                    v-if="status === 419"
                    type="button"
                    class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
                    @click="reload"
                >
                    Reload the page
                </button>
                <button
                    type="button"
                    class="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500"
                    @click="goBack"
                >
                    Go back
                </button>
                <Link
                    :href="route('home')"
                    :class="status === 419
                        ? 'rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500'
                        : 'rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700'"
                >
                    Home
                </Link>
                <Link
                    v-if="status === 403 && !signedIn"
                    :href="route('login')"
                    class="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500"
                >
                    Log in
                </Link>
            </div>

            <form :action="route('search')" method="get" class="mx-auto mt-8 flex max-w-md gap-2" role="search">
                <label for="error-search" class="sr-only">Search anime</label>
                <input
                    id="error-search"
                    name="q"
                    type="search"
                    :value="suggestedSearch ?? ''"
                    placeholder="Search for an anime..."
                    class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <button
                    type="submit"
                    class="rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-gray-700"
                >
                    Search
                </button>
            </form>
            <p v-if="suggestedSearch" class="mt-3 text-sm text-gray-500" data-test="suggested-search">
                Looking for an anime? We filled in "{{ suggestedSearch }}" from the link.
            </p>

            <nav class="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" aria-label="Popular pages">
                <Link :href="route('anime.index')" class="text-gray-400 transition hover:text-gray-100">Browse anime</Link>
                <Link :href="route('top.rated')" class="text-gray-400 transition hover:text-gray-100">Top rated</Link>
                <Link :href="route('seasonal')" class="text-gray-400 transition hover:text-gray-100">This season</Link>
                <Link :href="route('schedule')" class="text-gray-400 transition hover:text-gray-100">Airing schedule</Link>
            </nav>
        </section>

        <section v-if="alternatives.length" class="pb-10" data-test="error-alternatives">
            <h2 class="mb-4 text-xl font-semibold text-gray-100">You might like</h2>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                <AnimeCard
                    v-for="anime in alternatives"
                    :key="anime.id ?? anime.anilist_id"
                    :anime="anime"
                    view-mode="grid"
                />
            </div>
        </section>
    </AppLayout>

    <div v-else class="flex min-h-screen items-center justify-center bg-gray-950 text-center dark">
        <div>
            <h1 class="text-6xl font-bold text-gray-700">{{ status }}</h1>
            <p class="text-xl font-medium text-gray-400 mt-2">{{ titles[status] ?? 'Error' }}</p>
            <p class="text-gray-500 mt-4">{{ descriptions[status] ?? 'An unexpected error occurred.' }}</p>
            <a href="/" class="text-primary-400 hover:text-primary-300 mt-6 inline-block transition">
                Go Home
            </a>
        </div>
    </div>
</template>
