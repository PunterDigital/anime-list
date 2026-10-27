<script setup lang="ts">
import type { SeasonEntry } from '@/types/anime'
import ScoreBadge from './ScoreBadge.vue'

defineProps<{
    seasons: SeasonEntry[]
}>()

function displayTitle(entry: SeasonEntry): string {
    return entry.title_english || entry.title_romaji
}
</script>

<template>
    <div v-if="seasons.length > 1" class="space-y-3">
        <h3 class="text-lg font-semibold text-gray-100">
            Seasons <span class="text-sm font-normal text-gray-500">({{ seasons.length }})</span>
        </h3>
        <div class="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
            <Link
                v-for="(season, index) in seasons"
                :key="season.id"
                :href="season.slug ? route('anime.show', { anime: season.slug }) : '#'"
                class="group w-36 flex-shrink-0"
                :class="{ 'pointer-events-none': season.is_current }"
            >
                <div
                    class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800"
                    :class="season.is_current
                        ? 'ring-2 ring-primary-500'
                        : 'group-hover:ring-1 group-hover:ring-gray-600'"
                >
                    <img
                        v-if="season.cover_image_large || season.cover_image_medium"
                        :src="(season.cover_image_large || season.cover_image_medium) ?? undefined"
                        :alt="displayTitle(season)"
                        class="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                    />
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div class="flex items-center justify-between">
                            <span class="rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-gray-200">
                                S{{ index + 1 }}
                            </span>
                            <ScoreBadge :score="season.average_score" size="sm" />
                        </div>
                    </div>
                    <div v-if="season.episodes" class="absolute top-1.5 right-1.5">
                        <span class="rounded bg-gray-900/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                            {{ season.episodes }} ep
                        </span>
                    </div>
                    <div v-if="season.is_current" class="absolute top-1.5 left-1.5">
                        <span class="rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            Current
                        </span>
                    </div>
                </div>
                <p
                    class="mt-1.5 line-clamp-2 text-xs font-medium transition"
                    :class="season.is_current ? 'text-primary-400' : 'text-gray-300 group-hover:text-primary-400'"
                >
                    {{ displayTitle(season) }}
                </p>
            </Link>
        </div>
    </div>
</template>
