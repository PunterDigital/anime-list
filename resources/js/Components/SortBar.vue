<script setup lang="ts">
import Select from 'primevue/select'

defineProps<{
    sort: string | undefined
    total: number
    viewMode: 'grid' | 'list'
}>()

defineEmits<{
    'update:sort': [value: string | undefined]
    'update:viewMode': [value: 'grid' | 'list']
}>()

const sortOptions = [
    { id: '-popularity', name: 'Popularity' },
    { id: '-average_score', name: 'Score' },
    { id: '-trending', name: 'Trending' },
    { id: '-favourites', name: 'Favourites' },
    { id: 'title_romaji', name: 'Title (A-Z)' },
    { id: '-title_romaji', name: 'Title (Z-A)' },
    { id: '-aired_from', name: 'Newest' },
    { id: 'aired_from', name: 'Oldest' },
]
</script>

<template>
    <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-gray-400">
            {{ total.toLocaleString() }} results
        </p>
        <div class="flex items-center gap-3">
            <Select
                :model-value="sort || '-popularity'"
                :options="sortOptions"
                option-label="name"
                option-value="id"
                class="w-44"
                @update:model-value="$emit('update:sort', $event)"
            />
            <div class="flex rounded-lg border border-gray-700">
                <button
                    class="px-2.5 py-1.5 text-sm transition"
                    :class="viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'"
                    title="Grid view"
                    @click="$emit('update:viewMode', 'grid')"
                >
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z" /></svg>
                </button>
                <button
                    class="px-2.5 py-1.5 text-sm transition"
                    :class="viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'"
                    title="List view"
                    @click="$emit('update:viewMode', 'list')"
                >
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" /></svg>
                </button>
            </div>
        </div>
    </div>
</template>
