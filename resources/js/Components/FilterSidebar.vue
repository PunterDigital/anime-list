<script setup lang="ts">
import AppSelect from '@/Components/ui/AppSelect.vue'
import type { BrowseFilters, FilterOption } from '@/types/anime'

const props = defineProps<{
    filters: BrowseFilters
    genres: FilterOption[]
    studios: FilterOption[]
}>()

const emit = defineEmits<{
    'update:filters': [filters: BrowseFilters]
    apply: []
    clear: []
}>()

const formatOptions = [
    { id: 'TV', name: 'TV' },
    { id: 'TV_SHORT', name: 'TV Short' },
    { id: 'MOVIE', name: 'Movie' },
    { id: 'OVA', name: 'OVA' },
    { id: 'ONA', name: 'ONA' },
    { id: 'SPECIAL', name: 'Special' },
    { id: 'MUSIC', name: 'Music' },
]

const statusOptions = [
    { id: 'RELEASING', name: 'Airing' },
    { id: 'FINISHED', name: 'Finished' },
    { id: 'NOT_YET_RELEASED', name: 'Not Yet Aired' },
    { id: 'CANCELLED', name: 'Cancelled' },
    { id: 'HIATUS', name: 'Hiatus' },
]

const seasonOptions = [
    { id: 'WINTER', name: 'Winter' },
    { id: 'SPRING', name: 'Spring' },
    { id: 'SUMMER', name: 'Summer' },
    { id: 'FALL', name: 'Fall' },
]

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: currentYear - 1939 }, (_, i) => ({
    id: currentYear + 1 - i,
    name: String(currentYear + 1 - i),
}))

function updateFilter(key: keyof BrowseFilters, value: unknown) {
    emit('update:filters', { ...props.filters, [key]: value || undefined })
    emit('apply')
}
</script>

<template>
    <div class="space-y-4">
        <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Format</label>
            <AppSelect
                aria-label="Format"
                :model-value="filters.format"
                :options="formatOptions"
                option-label="name"
                option-value="id"
                placeholder="Any"
                show-clear
                class="w-full"
                @update:model-value="updateFilter('format', $event)"
            />
        </div>

        <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Status</label>
            <AppSelect
                aria-label="Status"
                :model-value="filters.status"
                :options="statusOptions"
                option-label="name"
                option-value="id"
                placeholder="Any"
                show-clear
                class="w-full"
                @update:model-value="updateFilter('status', $event)"
            />
        </div>

        <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Season</label>
            <AppSelect
                aria-label="Season"
                :model-value="filters.season"
                :options="seasonOptions"
                option-label="name"
                option-value="id"
                placeholder="Any"
                show-clear
                class="w-full"
                @update:model-value="updateFilter('season', $event)"
            />
        </div>

        <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Year</label>
            <AppSelect
                aria-label="Year"
                :model-value="filters.season_year"
                :options="yearOptions"
                option-label="name"
                option-value="id"
                placeholder="Any"
                show-clear
                class="w-full"
                @update:model-value="updateFilter('season_year', $event)"
            />
        </div>

        <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Genre</label>
            <AppSelect
                aria-label="Genre"
                :model-value="filters.genre"
                :options="genres"
                option-label="name"
                option-value="name"
                placeholder="Any"
                show-clear
                filter
                class="w-full"
                @update:model-value="updateFilter('genre', $event)"
            />
        </div>

        <div>
            <label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-400">Studio</label>
            <AppSelect
                aria-label="Studio"
                :model-value="filters.studio"
                :options="studios"
                option-label="name"
                option-value="id"
                placeholder="Any"
                show-clear
                filter
                class="w-full"
                @update:model-value="updateFilter('studio', $event)"
            />
        </div>

        <button
            class="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
            @click="$emit('clear')"
        >
            Clear Filters
        </button>
    </div>
</template>
