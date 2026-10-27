<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'
import ScoreBadge from '@/Components/ScoreBadge.vue'
import type { AnimeCard } from '@/types/anime'

defineOptions({ layout: AppLayout })

defineProps<{
    anime: AnimeCard[]
    metric: 'rated' | 'popular'
}>()

function displayTitle(anime: AnimeCard): string {
    return anime.title_english || anime.title_romaji
}

function formatLabel(format: string | null): string {
    if (!format) return ''
    return format.replace(/_/g, ' ')
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
</script>

<template>
    <Head :title="metric === 'rated' ? 'Top Rated Anime' : 'Most Popular Anime'">
        <meta name="description" :content="metric === 'rated' ? 'The highest rated anime of all time.' : 'The most popular anime of all time.'" />
        <link rel="canonical" :href="metric === 'rated' ? route('top.rated') : route('top.popular')" />
        <meta property="og:title" :content="metric === 'rated' ? 'Top 100 Rated Anime — AniTrack' : 'Top 100 Most Popular Anime — AniTrack'" />
        <meta property="og:description" :content="metric === 'rated' ? 'The highest rated anime of all time.' : 'The most popular anime of all time.'" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
    </Head>

    <div class="mx-auto max-w-5xl space-y-6">
        <h1 class="text-3xl font-bold text-gray-100 text-center">Top 100 Anime</h1>

        <!-- Tabs -->
        <div class="flex justify-center gap-1 rounded-lg bg-gray-900 p-1">
            <Link
                :href="route('top.rated')"
                class="rounded-md px-6 py-2 text-sm font-medium transition"
                :class="metric === 'rated'
                    ? 'bg-gray-700 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200'"
            >
                Top Rated
            </Link>
            <Link
                :href="route('top.popular')"
                class="rounded-md px-6 py-2 text-sm font-medium transition"
                :class="metric === 'popular'
                    ? 'bg-gray-700 text-gray-100'
                    : 'text-gray-400 hover:text-gray-200'"
            >
                Most Popular
            </Link>
        </div>

        <!-- Ranked List -->
        <div class="space-y-2">
            <Link
                v-for="(item, index) in anime"
                :key="item.id ?? item.anilist_id"
                :href="animeUrl(item)"
                class="flex items-center gap-4 rounded-lg border border-gray-800 bg-gray-900 p-3 transition hover:border-gray-700 hover:bg-gray-800/80"
            >
                <!-- Rank -->
                <div class="w-10 shrink-0 text-center text-lg font-bold" :class="index < 3 ? 'text-primary-400' : 'text-gray-500'">
                    {{ index + 1 }}
                </div>

                <!-- Cover -->
                <div class="h-16 w-11 shrink-0 overflow-hidden rounded bg-gray-800">
                    <img
                        v-if="item.cover_image_medium || item.cover_image_large"
                        :src="(item.cover_image_medium || item.cover_image_large) ?? undefined"
                        :alt="displayTitle(item)"
                        class="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>

                <!-- Info -->
                <div class="min-w-0 flex-1">
                    <h3 class="truncate font-medium text-gray-200">{{ displayTitle(item) }}</h3>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span v-if="item.format">{{ formatLabel(item.format) }}</span>
                        <span v-if="item.episodes">{{ item.episodes }} ep</span>
                        <span v-if="item.status" class="hidden sm:inline">{{ item.status.replace(/_/g, ' ') }}</span>
                    </div>
                </div>

                <!-- Score & Popularity -->
                <div class="flex shrink-0 items-center gap-4">
                    <div v-if="metric === 'rated'" class="text-right">
                        <ScoreBadge :score="item.bayesian_score ?? item.average_score" size="md" />
                    </div>
                    <div v-if="metric === 'popular'" class="text-right">
                        <span class="text-sm font-semibold text-gray-300">{{ item.popularity?.toLocaleString() }}</span>
                        <div class="text-[10px] text-gray-500">popularity</div>
                    </div>
                    <!-- Secondary metric -->
                    <div class="hidden text-right sm:block">
                        <template v-if="metric === 'rated'">
                            <span class="text-xs text-gray-500">{{ item.popularity?.toLocaleString() }} pop</span>
                        </template>
                        <template v-else>
                            <ScoreBadge :score="item.bayesian_score ?? item.average_score" size="sm" />
                        </template>
                    </div>
                </div>
            </Link>
        </div>
    </div>
</template>
