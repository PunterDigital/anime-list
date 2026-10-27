<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/Layouts/AppLayout.vue'
import AnimeCard from '@/Components/AnimeCard.vue'
import FilterSidebar from '@/Components/FilterSidebar.vue'
import SortBar from '@/Components/SortBar.vue'
import PaginationBar from '@/Components/PaginationBar.vue'
import { useBrowseFilters } from '@/composables/useBrowseFilters'
import type { AnimeCard as AnimeCardType, FilterOption } from '@/types/anime'
import type { PaginatedResponse } from '@/types/api'

defineOptions({ layout: AppLayout })

defineProps<{
    anime: PaginatedResponse<AnimeCardType>
    genres: FilterOption[]
    studios: FilterOption[]
}>()

const { filters, applyFilters, clearFilters } = useBrowseFilters()

const viewMode = ref<'grid' | 'list'>(
    (typeof window !== 'undefined' && localStorage.getItem('browse_view') as 'grid' | 'list') || 'grid'
)

function setViewMode(mode: 'grid' | 'list') {
    viewMode.value = mode
    if (typeof window !== 'undefined') {
        localStorage.setItem('browse_view', mode)
    }
}

function updateSort(sort: string | undefined) {
    filters.sort = sort
    applyFilters()
}

function updateFilters(newFilters: typeof filters) {
    Object.assign(filters, newFilters)
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
    if (searchDebounce) {
        clearTimeout(searchDebounce)
    }
    searchDebounce = setTimeout(() => {
        applyFilters()
    }, 400)
}

function onSearchSubmit() {
    if (searchDebounce) {
        clearTimeout(searchDebounce)
        searchDebounce = null
    }
    applyFilters()
}

const showMobileFilters = ref(false)
</script>

<template>
    <Head title="Browse &amp; Search Anime">
        <meta name="description" content="Browse, search and discover anime by title, genre, format, season, and more on AniTrack." />
        <link rel="canonical" :href="route('anime.index')" />
    </Head>

    <div class="mb-6">
        <form @submit.prevent="onSearchSubmit">
            <div class="relative">
                <input
                    v-model="filters.search"
                    type="search"
                    placeholder="Search by title..."
                    class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    @input="onSearchInput"
                />
            </div>
        </form>
    </div>

    <div class="flex gap-6">
        <!-- Filter Sidebar (desktop) -->
        <aside class="hidden w-56 shrink-0 lg:block">
            <div class="sticky top-20">
                <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Filters</h2>
                <FilterSidebar
                    :filters="filters"
                    :genres="genres"
                    :studios="studios"
                    @update:filters="updateFilters"
                    @apply="applyFilters"
                    @clear="clearFilters"
                />
            </div>
        </aside>

        <!-- Main content -->
        <div class="min-w-0 flex-1">
            <!-- Mobile filter toggle -->
            <button
                class="mb-4 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 lg:hidden"
                @click="showMobileFilters = !showMobileFilters"
            >
                Filters
            </button>

            <!-- Mobile filters -->
            <div v-if="showMobileFilters" class="mb-4 rounded-lg border border-gray-800 p-4 lg:hidden">
                <FilterSidebar
                    :filters="filters"
                    :genres="genres"
                    :studios="studios"
                    @update:filters="updateFilters"
                    @apply="applyFilters"
                    @clear="clearFilters"
                />
            </div>

            <SortBar
                :sort="filters.sort"
                :total="anime.meta.total"
                :view-mode="viewMode"
                @update:sort="updateSort"
                @update:view-mode="setViewMode"
            />

            <div class="mt-4">
                <div
                    v-if="anime.data.length"
                    :class="viewMode === 'grid'
                        ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                        : 'space-y-3'"
                >
                    <AnimeCard
                        v-for="item in anime.data"
                        :key="item.id ?? item.anilist_id"
                        :anime="item"
                        :view-mode="viewMode"
                    />
                </div>
                <div v-else class="py-16 text-center">
                    <p class="text-gray-500">No anime found matching your filters.</p>
                    <button
                        class="mt-2 text-sm text-primary-400 hover:text-primary-300"
                        @click="clearFilters"
                    >
                        Clear all filters
                    </button>
                </div>
            </div>

            <div class="mt-8">
                <PaginationBar
                    :current-page="anime.meta.current_page"
                    :last-page="anime.meta.last_page"
                    :total="anime.meta.total"
                />
            </div>
        </div>
    </div>
</template>
