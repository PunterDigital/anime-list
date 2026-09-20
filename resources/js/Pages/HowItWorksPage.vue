<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout })

const syncSchedule = [
    { what: 'Currently airing shows', when: 'Every 6 hours' },
    { what: 'Weekly airing schedule', when: 'Every hour' },
    { what: 'Upcoming (not yet released) shows', when: 'Daily' },
    { what: 'Everything else that changed on AniList', when: 'Weekly' },
    { what: 'Finished shows that were edited on AniList', when: 'Monthly' },
    { what: 'Community score recalculation', when: 'Twice daily' },
    { what: 'Personal "Picked for you" recommendations', when: 'Nightly' },
]

const signals = [
    {
        title: 'Genre and studio taste',
        body: 'Every show on your list nudges a genre and studio profile. High scores push hard, average scores push a little, and dropped or on-hold shows push the other way. Plan-to-watch entries do not count as taste, but they do tell us what you are curious about.',
    },
    {
        title: 'Shows like your favourites',
        body: 'Your highest-rated completed shows act as anchors. We look up what the AniList community recommends alongside those anchors and add the results up, so a show that is recommended next to several of your favourites rises to the top.',
    },
    {
        title: 'A gentle quality prior',
        body: 'Candidates get a small boost from their community score so that a well-liked show edges out a poorly-received one with the same genre match, but never so much that the top 100 simply takes over.',
    },
]
</script>

<template>
    <Head title="How It Works">
        <meta name="description" content="Where AniTrack gets its anime data, how often it is refreshed, and how personal recommendations are generated." />
        <link rel="canonical" :href="route('how-it-works')" />
    </Head>

    <div class="mx-auto max-w-3xl space-y-12 py-4">
        <header class="space-y-4">
            <h1 class="text-3xl font-bold sm:text-4xl">How AniTrack works</h1>
            <p class="text-lg leading-relaxed text-gray-300">
                A plain-language look at where our data comes from, how we keep it fresh, and how we decide what to recommend to you.
            </p>
        </header>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">Where the data comes from</h2>
            <p class="leading-relaxed text-gray-400">
                AniTrack does not maintain its own anime encyclopaedia. Titles, synopses, cover art, formats, episode counts, air dates, studios, genres, trailers, streaming links and community scores all come from the
                <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" class="text-primary-400 transition hover:text-primary-300">AniList</a>
                public GraphQL API. AniList is a community-maintained database, and we are grateful to everyone who keeps it accurate.
            </p>
            <p class="leading-relaxed text-gray-400">
                We store a copy of that data on our own servers so pages load quickly and the site keeps working if AniList is briefly unavailable. We also keep each show's MyAnimeList ID alongside it, which is what makes importing and exporting your MAL list possible.
            </p>
            <p class="leading-relaxed text-gray-400">
                We do not scrape websites. Everything is fetched through AniList's official API, well inside its published rate limits.
            </p>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">How often it is refreshed</h2>
            <p class="leading-relaxed text-gray-400">
                Not all anime data changes at the same speed. A show airing this season needs checking often; a show that finished in 2009 almost never changes. Our sync schedule reflects that:
            </p>
            <div class="overflow-hidden rounded-xl border border-gray-800">
                <table class="w-full text-sm">
                    <thead class="bg-gray-900 text-left text-gray-300">
                        <tr>
                            <th class="px-4 py-3 font-semibold">What</th>
                            <th class="px-4 py-3 font-semibold">How often</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800 text-gray-400">
                        <tr v-for="row in syncSchedule" :key="row.what">
                            <td class="px-4 py-3">{{ row.what }}</td>
                            <td class="px-4 py-3 whitespace-nowrap">{{ row.when }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="leading-relaxed text-gray-400">
                On top of the scheduled syncs, a nightly job works through any show whose data has gone stale. Once a long-finished show has been refreshed it is retired from that sweep, so we spend our API budget on the shows that are actually changing.
            </p>
            <p class="leading-relaxed text-gray-400">
                If you spot something wrong, the fix usually belongs upstream: correct it on AniList and it will flow through to AniTrack on the next sync. If it still looks wrong after a few days, <Link :href="route('contact')" class="text-primary-400 transition hover:text-primary-300">let us know</Link>.
            </p>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">How scores and rankings work</h2>
            <p class="leading-relaxed text-gray-400">
                The score you see on a show is AniList's community average. For our "Top Anime" and "Picked for you" rankings we do not use that raw average directly, because a show scored 95 by twelve people is not really better than a show scored 88 by two hundred thousand.
            </p>
            <p class="leading-relaxed text-gray-400">
                Instead we use a weighted (Bayesian) score. Each show's average is pulled towards the site-wide mean, and the more people who have rated it, the less it is pulled. Obscure shows with a handful of votes settle near the middle; widely-watched shows keep their true score. This is recalculated twice a day.
            </p>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">How recommendations are made</h2>
            <p class="leading-relaxed text-gray-400">
                "Picked for you" is built from your own list. Nothing about your viewing habits is shared with anyone, and the whole thing runs on our servers each night. It combines three signals:
            </p>
            <div class="space-y-3">
                <div
                    v-for="signal in signals"
                    :key="signal.title"
                    class="rounded-xl border border-gray-800 bg-gray-900/60 p-5"
                >
                    <h3 class="mb-2 font-semibold text-gray-100">{{ signal.title }}</h3>
                    <p class="text-sm leading-relaxed text-gray-400">{{ signal.body }}</p>
                </div>
            </div>
            <p class="leading-relaxed text-gray-400">
                The signals are added together, then a few rules tidy the result. Anything already on your list is removed, so you only ever see new suggestions. Adult titles are never recommended. Very popular shows get a slight penalty so the list is not just the same top ten everyone has already seen. Finally we cap how many picks can come from a single studio, so one prolific studio cannot fill the whole list.
            </p>
            <p class="leading-relaxed text-gray-400">
                If your list is new or small, there is not enough signal to work from yet. In that case we fall back to well-rated shows in the genres of whatever you have marked plan to watch, or simply the best-rated shows overall until you have rated a few more. The more you score, the better it gets.
            </p>
        </section>

        <section class="space-y-4">
            <h2 class="text-xl font-semibold text-gray-200">Browsing by mood</h2>
            <p class="leading-relaxed text-gray-400">
                The mood shelves on the home page are not personalised. Each mood is a hand-picked mix of genres to include, genres to boost and genres to leave out, applied to well-rated shows and ranked by their weighted score. They are the same for everyone, which makes them a good place to start when you do not have a list yet.
            </p>
        </section>

        <section class="space-y-4 rounded-xl border border-gray-800 bg-gray-900/60 p-6">
            <h2 class="text-xl font-semibold text-gray-200">Questions?</h2>
            <p class="leading-relaxed text-gray-400">
                We are happy to go into more detail about any of this, or to hear how the recommendations are working for you.
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
