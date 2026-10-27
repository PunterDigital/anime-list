<script setup lang="ts">
import { computed } from 'vue'
import { useAnimeSearch } from '@/composables/useAnimeSearch'
import type { AnimeCard } from '@/types/anime'

const props = defineProps<{
    featuredAnime: AnimeCard[]
    totalAnime: number
}>()

const { query, results, isLoading } = useAnimeSearch()

const displayed = computed<AnimeCard[]>(() => {
    if (query.value.trim().length >= 2) {
        return results.value.slice(0, 12)
    }
    return props.featuredAnime
})

const showingSearch = computed(() => query.value.trim().length >= 2)

function displayTitle(anime: AnimeCard): string {
    return anime.title_english || anime.title_romaji
}

function animeUrl(anime: AnimeCard): string {
    if (anime.slug) {
        return route('anime.show', { anime: anime.slug })
    }
    if (anime.anilist_id) {
        return route('anime.show.anilist', { anilistId: anime.anilist_id })
    }
    return '#'
}

function progressLabel(anime: AnimeCard): string {
    if (anime.episodes) {
        return `${anime.episodes} ep`
    }
    if (anime.format) {
        return anime.format.replace(/_/g, ' ')
    }
    return ''
}

interface Feature {
    label: string
    title: string
    body: string
}

const features: Feature[] = [
    {
        label: '01 / Track',
        title: 'Never lose your place',
        body: 'One tap to mark an episode watched. Your progress syncs instantly across every device you sign in on, so picking up where you left off is friction-free.',
    },
    {
        label: '02 / Discover',
        title: 'Find your next favourite',
        body: 'Browse what is airing this season, what is trending right now, and what reviewers actually rate. Real-time countdowns tell you when the next episode drops.',
    },
    {
        label: '03 / Share',
        title: 'Compare lists with friends',
        body: 'Public profiles, shareable watchlists, and side-by-side comparisons. Find out who in your circle has the best taste — and who needs an intervention.',
    },
]

const animeStat = computed(() => {
    if (props.totalAnime >= 1000) {
        const thousands = Math.floor(props.totalAnime / 1000)
        return `${thousands}K+`
    }
    return `${props.totalAnime}+`
})

const stats = computed(() => [
    { value: animeStat.value, label: 'Anime in database' },
    { value: '100%', label: 'Free, forever' },
    { value: '0', label: 'Ads, ever' },
    { value: '<30s', label: 'To get set up' },
])
</script>

<template>
    <Head title="Track every anime you watch">
        <meta name="description" content="AniTrack is a free anime tracker. Build your watchlist, mark episodes watched, follow seasonal releases, and sync across devices. No ads, no paywall." />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" :href="route('welcome')" />
        <meta property="og:title" content="AniTrack — Track every anime you watch" />
        <meta property="og:description" content="Free anime tracker. No ads, no paywall, ever. Built by anime fans, for anime fans." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
    </Head>

    <div class="min-h-screen bg-gray-950 text-gray-100 dark">
        <!-- Minimal nav -->
        <nav class="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
            <div class="container mx-auto flex h-14 items-center justify-between px-4">
                <Link :href="route('welcome')" class="flex items-center gap-2 text-lg font-bold">
                    <span class="inline-block h-5 w-5 rounded-md bg-gradient-to-br from-primary-400 to-primary-700" />
                    <span class="text-primary-400">AniTrack</span>
                </Link>
                <Link :href="route('login')" class="text-sm text-gray-400 transition hover:text-gray-100">Sign in</Link>
            </div>
        </nav>

        <main>
            <!-- Hero -->
            <section class="relative overflow-hidden">
                <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent_70%)]" />
                <div class="container relative mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
                    <div class="mx-auto max-w-3xl text-center">
                        <span class="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-300">
                            <span class="h-1.5 w-1.5 rounded-full bg-primary-400" />
                            Free anime tracker. No paywall, ever.
                        </span>

                        <h1 class="mt-6 text-4xl font-bold leading-tight tracking-tight text-gray-50 sm:text-5xl md:text-6xl">
                            Track every anime you watch.
                            <span class="block bg-gradient-to-r from-primary-300 via-primary-400 to-fuchsia-400 bg-clip-text text-transparent">
                                All in one place.
                            </span>
                        </h1>

                        <p class="mx-auto mt-5 max-w-2xl text-base text-gray-400 sm:text-lg">
                            Build a watchlist, mark episodes watched, and keep up with seasonal releases.
                            Get notified when new episodes drop and pick up where you left off on any device.
                        </p>

                        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                :href="route('register')"
                                class="rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-950/50 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            >
                                Sign up free
                            </Link>
                            <Link
                                :href="route('login')"
                                class="rounded-lg border border-gray-700 bg-gray-900/60 px-6 py-3 font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
                            >
                                I already have an account
                            </Link>
                        </div>

                        <ul class="mx-auto mt-5 flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
                            <li v-for="claim in ['Free forever', 'No credit card', 'No ads, ever']" :key="claim" class="flex items-center gap-1.5">
                                <svg class="h-3.5 w-3.5 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                {{ claim }}
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Live anime explorer -->
            <section class="container mx-auto px-4 pb-16 sm:pb-24">
                <div class="mx-auto max-w-5xl">
                    <div class="mb-5 text-center">
                        <p class="text-xs font-semibold uppercase tracking-wider text-primary-400">Try it now</p>
                        <h2 class="mt-2 text-2xl font-bold text-gray-50 sm:text-3xl">
                            Search {{ animeStat }} anime in our database
                        </h2>
                        <p class="mt-2 text-sm text-gray-400">
                            Find a show, then sign up to add it to your list.
                        </p>
                    </div>

                    <div class="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
                        <div class="border-b border-gray-800 bg-gray-950/60 p-3 sm:p-4">
                            <div class="relative">
                                <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                                </svg>
                                <input
                                    v-model="query"
                                    type="search"
                                    placeholder="Search Frieren, Solo Leveling, anything..."
                                    class="w-full rounded-lg border border-gray-700 bg-gray-900 py-3 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div class="p-4 sm:p-6">
                            <div v-if="showingSearch && isLoading && displayed.length === 0" class="py-12 text-center text-sm text-gray-500">
                                Searching...
                            </div>
                            <div v-else-if="showingSearch && displayed.length === 0" class="py-12 text-center text-sm text-gray-500">
                                No anime matched "{{ query }}". Try another title.
                            </div>
                            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                                <Link
                                    v-for="anime in displayed"
                                    :key="anime.id ?? anime.anilist_id"
                                    :href="animeUrl(anime)"
                                    class="group block rounded-lg border border-gray-800 bg-gray-950/40 p-2 transition hover:border-primary-500/40 hover:bg-gray-900"
                                >
                                    <div class="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-800">
                                        <img
                                            v-if="anime.cover_image_medium"
                                            :src="anime.cover_image_medium"
                                            :alt="displayTitle(anime)"
                                            loading="lazy"
                                            class="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                        <span
                                            v-if="anime.average_score"
                                            class="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-primary-300 backdrop-blur"
                                        >
                                            {{ anime.average_score.toFixed(1) }}
                                        </span>
                                    </div>
                                    <p class="mt-2 line-clamp-1 px-1 text-xs font-medium text-gray-100">
                                        {{ displayTitle(anime) }}
                                    </p>
                                    <p class="mt-0.5 line-clamp-1 px-1 text-[11px] text-gray-500">
                                        {{ progressLabel(anime) }}
                                    </p>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <p class="mt-4 text-center text-xs text-gray-500">
                        Found something to watch?
                        <Link :href="route('register')" class="font-semibold text-primary-400 hover:text-primary-300">Create a free account</Link>
                        to start tracking.
                    </p>
                </div>
            </section>

            <!-- Features -->
            <section class="container mx-auto px-4 pb-16 sm:pb-24">
                <div class="mx-auto max-w-5xl rounded-2xl border border-gray-800 bg-gray-950">
                    <div class="grid grid-cols-1 divide-y divide-gray-800 md:grid-cols-3 md:divide-x md:divide-y-0">
                        <div v-for="feature in features" :key="feature.label" class="p-8 sm:p-10">
                            <p class="text-xs font-semibold uppercase tracking-wider text-primary-400">{{ feature.label }}</p>
                            <div class="mt-4 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-primary-400">
                                <svg v-if="feature.label.startsWith('01')" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                                <svg v-else-if="feature.label.startsWith('02')" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                                </svg>
                                <svg v-else class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.97 5.97 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                            </div>
                            <h3 class="mt-4 text-lg font-semibold text-gray-100">{{ feature.title }}</h3>
                            <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ feature.body }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- MAL import callout -->
            <section class="container mx-auto px-4 pb-16 sm:pb-24">
                <div class="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900">
                    <div class="grid grid-cols-1 items-center gap-8 p-8 sm:p-10 md:grid-cols-5">
                        <div class="md:col-span-3">
                            <p class="text-xs font-semibold uppercase tracking-wider text-primary-400">Switching from MyAnimeList?</p>
                            <h2 class="mt-3 text-2xl font-bold tracking-tight text-gray-50 sm:text-3xl">
                                Bring your watchlist with you in
                                <span class="bg-gradient-to-r from-primary-300 to-fuchsia-400 bg-clip-text text-transparent">under a minute.</span>
                            </h2>
                            <p class="mt-3 text-sm leading-relaxed text-gray-400 sm:text-base">
                                Export your list from MAL, drop the XML file into our importer,
                                and we will match every title, preserve your scores, status and
                                episode progress, and keep your dates intact. Years of tracking,
                                moved over in a couple of clicks.
                            </p>
                            <ul class="mt-5 grid grid-cols-1 gap-2 text-sm text-gray-300 sm:grid-cols-2">
                                <li v-for="bullet in ['Scores and statuses preserved', 'Episode progress carried over', 'Start dates and finish dates kept', 'Preview matches before committing']" :key="bullet" class="flex items-center gap-2">
                                    <svg class="h-4 w-4 flex-shrink-0 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                    {{ bullet }}
                                </li>
                            </ul>
                        </div>

                        <div class="md:col-span-2">
                            <div class="flex items-center justify-center gap-3 rounded-xl border border-gray-800 bg-gray-950/60 p-5">
                                <div class="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-xs font-bold tracking-wider text-gray-400">
                                    MAL
                                </div>
                                <svg class="h-5 w-5 flex-shrink-0 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                                <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold tracking-wider text-white">
                                    AT
                                </div>
                            </div>
                            <p class="mt-3 text-center text-xs text-gray-500">
                                <Link :href="route('register')" class="font-semibold text-primary-400 hover:text-primary-300">Sign up</Link>
                                then head to Import. Done in about a minute.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Free forever pitch -->
            <section class="container mx-auto px-4 pb-16 sm:pb-24">
                <div class="mx-auto max-w-3xl text-center">
                    <p class="text-xs font-semibold uppercase tracking-wider text-primary-400">Why we are different</p>
                    <h2 class="mt-3 text-3xl font-bold tracking-tight text-gray-50 sm:text-4xl">
                        Free forever isn't a
                        <span class="bg-gradient-to-r from-primary-300 to-fuchsia-400 bg-clip-text text-transparent">marketing line.</span>
                    </h2>
                    <p class="mt-5 text-base leading-relaxed text-gray-400 sm:text-lg">
                        AniTrack has no ads, no premium tier, and no plan to add either.
                        It is built by anime fans for anime fans, and run on a few friends'
                        spare evenings. The whole project exists because the older trackers
                        feel ancient and the newer ones want a subscription. We just wanted
                        a fast, modern place to keep our lists. So we made one, and we are
                        sharing it.
                    </p>
                </div>
            </section>

            <!-- Proof strip -->
            <section class="border-y border-gray-800 bg-gray-950">
                <div class="container mx-auto px-4 py-10">
                    <div class="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
                        <div v-for="stat in stats" :key="stat.label">
                            <p class="text-3xl font-bold text-gray-50 sm:text-4xl">{{ stat.value }}</p>
                            <p class="mt-1 text-xs uppercase tracking-wider text-gray-500">{{ stat.label }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Final CTA -->
            <section class="container mx-auto px-4 py-20 sm:py-28">
                <div class="mx-auto max-w-2xl text-center">
                    <h2 class="text-3xl font-bold tracking-tight text-gray-50 sm:text-5xl">
                        Start tracking.
                        <span class="bg-gradient-to-r from-primary-300 to-fuchsia-400 bg-clip-text text-transparent">It's free.</span>
                    </h2>

                    <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            :href="route('register')"
                            class="rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-950/50 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                        >
                            Create your account
                        </Link>
                    </div>

                    <p class="mt-4 text-sm text-gray-500">
                        Under thirty seconds. No card, no trial, no catch.
                    </p>
                </div>
            </section>
        </main>

        <!-- Minimal footer -->
        <footer class="border-t border-gray-800 bg-gray-950">
            <div class="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-gray-600 sm:flex-row">
                <p>&copy; {{ new Date().getFullYear() }} AniTrack</p>
                <ul class="flex items-center gap-5">
                    <li><Link :href="route('privacy')" class="transition hover:text-gray-300">Privacy</Link></li>
                    <li><Link :href="route('terms')" class="transition hover:text-gray-300">Terms</Link></li>
                    <li><a href="mailto:hello@anitrack.app" class="transition hover:text-gray-300">Contact</a></li>
                </ul>
            </div>
        </footer>
    </div>
</template>
