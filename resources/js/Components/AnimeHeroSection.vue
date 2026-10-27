<script setup lang="ts">
import type { AnimeCard } from '@/types/anime'
import ScoreBadge from './ScoreBadge.vue'

defineProps<{
    anime: AnimeCard[]
    title: string
    seeAllRoute?: string
}>()

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
</script>

<template>
    <section v-if="anime.length">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-100">{{ title }}</h2>
            <Link
                v-if="seeAllRoute"
                :href="seeAllRoute"
                class="text-sm text-primary-400 transition hover:text-primary-300"
            >
                See All &rarr;
            </Link>
        </div>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            <Link
                v-for="item in anime"
                :key="item.id ?? item.anilist_id"
                :href="animeUrl(item)"
                class="group"
            >
                <div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800">
                    <img
                        v-if="item.cover_image_large || item.cover_image_medium"
                        :src="(item.cover_image_large || item.cover_image_medium) ?? undefined"
                        :alt="displayTitle(item)"
                        class="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                    />
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <ScoreBadge :score="item.average_score" size="sm" />
                    </div>
                </div>
                <h3 class="mt-1.5 line-clamp-2 text-sm font-medium text-gray-200 group-hover:text-primary-400 transition">
                    {{ displayTitle(item) }}
                </h3>
            </Link>
        </div>
    </section>
</template>
