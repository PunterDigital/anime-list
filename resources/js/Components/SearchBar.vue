<script setup lang="ts">
import type { AnimeCard } from '@/types/anime'
import { useAnimeSearch } from '@/composables/useAnimeSearch'
import { ref } from 'vue'

const { query, results, total, isLoading } = useAnimeSearch()

const isOpen = ref(false)

function onFocus() {
    isOpen.value = true
}

function onBlur() {
    // Delay to allow click on results
    setTimeout(() => { isOpen.value = false }, 200)
}

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
    <div class="relative">
        <input
            v-model="query"
            type="text"
            placeholder="Search anime..."
            class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            @focus="onFocus"
            @blur="onBlur"
        />

        <!-- Dropdown results -->
        <div
            v-if="isOpen && query.length >= 2"
            class="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-xl"
        >
            <div v-if="isLoading" class="p-4 text-center text-sm text-gray-500">
                Searching...
            </div>
            <div v-else-if="results.length === 0" class="p-4 text-center text-sm text-gray-500">
                No results found
            </div>
            <template v-else>
                <Link
                    v-for="anime in results"
                    :key="anime.id ?? anime.anilist_id"
                    :href="animeUrl(anime)"
                    class="flex items-center gap-3 px-4 py-2.5 transition hover:bg-gray-800"
                >
                    <img
                        v-if="anime.cover_image_medium"
                        :src="anime.cover_image_medium"
                        :alt="displayTitle(anime)"
                        class="h-12 w-8 rounded object-cover"
                    />
                    <div v-else class="h-12 w-8 rounded bg-gray-800" />
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm text-gray-200">{{ displayTitle(anime) }}</p>
                        <p class="text-xs text-gray-500">
                            <span v-if="anime.format">{{ anime.format.replace(/_/g, ' ') }}</span>
                            <span v-if="anime.season_year"> &middot; {{ anime.season_year }}</span>
                        </p>
                    </div>
                    <span v-if="anime.average_score" class="text-xs text-gray-400">
                        {{ anime.average_score.toFixed(1) }}
                    </span>
                </Link>
                <Link
                    v-if="total > 5"
                    :href="route('anime.index') + '?filter%5Bsearch%5D=' + encodeURIComponent(query)"
                    class="block border-t border-gray-800 px-4 py-2.5 text-center text-sm text-primary-400 transition hover:bg-gray-800"
                >
                    View all {{ total }} results
                </Link>
            </template>
        </div>
    </div>
</template>
