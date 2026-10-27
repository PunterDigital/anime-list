<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'
import AnimeCard from '@/Components/AnimeCard.vue'
import SeasonSelector from '@/Components/SeasonSelector.vue'
import type { SeasonalGroup, AnimeSeason, AdjacentSeasons } from '@/types/anime'

defineOptions({ layout: AppLayout })

defineProps<{
    groups: SeasonalGroup[]
    year: number
    season: AnimeSeason
    adjacentSeasons: AdjacentSeasons
}>()

function seasonLabel(season: string): string {
    return season.charAt(0) + season.slice(1).toLowerCase()
}

function formatLabel(format: string): string {
    if (format === 'OTHER') return 'Other'
    return format.replace(/_/g, ' ')
}
</script>

<template>
    <Head :title="`${seasonLabel(season)} ${year} Anime`">
        <meta name="description" :content="`Browse all anime airing in ${seasonLabel(season)} ${year}.`" />
        <link rel="canonical" :href="route('seasonal')" />
        <meta property="og:title" :content="`${seasonLabel(season)} ${year} Anime — AniTrack`" />
        <meta property="og:description" :content="`Browse all anime airing in ${seasonLabel(season)} ${year}.`" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
    </Head>

    <div class="space-y-8">
        <div class="flex flex-col items-center gap-4">
            <h1 class="text-3xl font-bold text-gray-100">Seasonal Anime</h1>
            <SeasonSelector
                :year="year"
                :season="season"
                :adjacent-seasons="adjacentSeasons"
            />
        </div>

        <div v-if="groups.length" class="space-y-10">
            <section v-for="group in groups" :key="group.format">
                <h2 class="mb-4 text-xl font-semibold text-gray-200">
                    {{ formatLabel(group.format) }}
                    <span class="ml-2 text-sm font-normal text-gray-500">({{ group.anime.length }})</span>
                </h2>
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    <AnimeCard
                        v-for="anime in group.anime"
                        :key="anime.id ?? anime.anilist_id"
                        :anime="anime"
                        view-mode="grid"
                    />
                </div>
            </section>
        </div>

        <div v-else class="py-16 text-center">
            <p class="text-gray-500">No anime found for this season.</p>
        </div>
    </div>
</template>
