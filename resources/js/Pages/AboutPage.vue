<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout })

const pillars = [
    {
        title: 'Track everything, effortlessly',
        body: 'Watching, completed, on hold, dropped, plan to watch. Score what you finish, log episodes as you go, and see your whole anime history in one clean list.',
    },
    {
        title: 'Discover your next favourite',
        body: 'Browse by season, mood, studio or genre, keep an eye on what is airing this week, and get picks tailored to what you already love.',
    },
    {
        title: 'Bring your list with you',
        body: 'Import your existing list from MyAnimeList or AniList in a couple of clicks. Export it any time. Your data is yours.',
    },
    {
        title: 'Fast, modern, focused',
        body: 'A dark, distraction-free interface that loads quickly, works on your phone, and gets out of your way.',
    },
]
</script>

<template>
    <Head title="About">
        <meta name="description" content="AniTrack is a modern anime tracker built to be the one place you keep your watchlist, discover new shows and follow the seasonal schedule." />
        <link rel="canonical" :href="route('about')" />
    </Head>

    <div class="mx-auto max-w-3xl space-y-12 py-4">
        <header class="space-y-4">
            <h1 class="text-3xl font-bold sm:text-4xl">About AniTrack</h1>
            <p class="text-lg leading-relaxed text-gray-300">
                AniTrack is built to be the place where you track all of your anime. One list, one schedule, one home for everything you are watching, have watched, and want to watch next.
            </p>
        </header>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">Why we built it</h2>
            <p class="leading-relaxed text-gray-400">
                Like a lot of anime fans, we kept our lists on MyAnimeList for years. And like a lot of anime fans, we grew frustrated with it: an interface that has barely changed in a decade, pages buried under ads, and a long list of features we kept wishing existed.
            </p>
            <p class="leading-relaxed text-gray-400">
                So we built the alternative we wanted. AniTrack is a modern anime tracker that helps you discover new shows and keep track of what you have watched, without the clutter. It is fast, it looks good, it works on your phone, and it is actively developed by people who use it every day.
            </p>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">What AniTrack does</h2>
            <div class="grid gap-4 sm:grid-cols-2">
                <div
                    v-for="pillar in pillars"
                    :key="pillar.title"
                    class="rounded-xl border border-gray-800 bg-gray-900/60 p-5"
                >
                    <h3 class="mb-2 font-semibold text-gray-100">{{ pillar.title }}</h3>
                    <p class="text-sm leading-relaxed text-gray-400">{{ pillar.body }}</p>
                </div>
            </div>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">Where the data comes from</h2>
            <p class="leading-relaxed text-gray-400">
                Anime titles, synopses, cover art, airing dates and community scores are sourced from
                <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" class="text-primary-400 transition hover:text-primary-300">AniList</a>,
                and kept in sync on a regular schedule. We write our own synopses for some shows and occasionally tidy up a title. Recommendations are generated from your own list and the AniList community graph.
                <Link :href="route('how-it-works')" class="text-primary-400 transition hover:text-primary-300">Read how it all works</Link>.
            </p>
        </section>

        <section class="space-y-4 rounded-xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 class="text-xl font-semibold text-gray-200">Get in touch</h2>
            <p class="leading-relaxed text-gray-400">
                Found a bug, have a feature idea, or just want to say hi? We read everything.
            </p>
            <Link
                :href="route('contact')"
                class="inline-block rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
            >
                Contact us
            </Link>
        </section>
    </div>
</template>
