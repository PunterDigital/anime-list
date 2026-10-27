<script setup lang="ts">
import type { ListEntryResource, ListStatus } from '@/types'
import { LIST_STATUS_LABELS } from '@/types'
import Select from 'primevue/select'

defineProps<{
    entries: ListEntryResource[]
    readonly?: boolean
}>()

const emit = defineEmits<{
    update: [id: number, patch: Record<string, unknown>]
    delete: [id: number]
    edit: [entry: ListEntryResource]
}>()

const statusOptions = Object.entries(LIST_STATUS_LABELS).map(([value, label]) => ({ value, label }))

function displayTitle(entry: ListEntryResource): string {
    return entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown'
}

function handleStatusChange(entry: ListEntryResource, status: ListStatus) {
    emit('update', entry.id, { status })
}

function handleScoreChange(entry: ListEntryResource, event: Event) {
    const input = event.target as HTMLInputElement
    const displayScore = parseFloat(input.value)
    if (isNaN(displayScore) || displayScore < 0 || displayScore > 10) return
    const score = Math.round(displayScore * 10)
    emit('update', entry.id, { score })
}

function canIncrementProgress(entry: ListEntryResource): boolean {
    const total = entry.anime?.episodes
    return total == null || entry.progress < total
}

function incrementProgress(entry: ListEntryResource) {
    if (!canIncrementProgress(entry)) return
    emit('update', entry.id, { progress: entry.progress + 1 })
}
</script>

<template>
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="border-b border-gray-800 text-left text-gray-400">
                    <th class="w-12 py-3 pr-2" />
                    <th class="py-3 pr-4">Title</th>
                    <th class="w-40 py-3 pr-4">Status</th>
                    <th class="w-20 py-3 pr-4">Score</th>
                    <th class="w-32 py-3 pr-4">Progress</th>
                    <th class="w-20 py-3 pr-4">Type</th>
                    <th class="w-24 py-3">Updated</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="entry in entries"
                    :key="entry.id"
                    class="border-b border-gray-800/50 hover:bg-gray-900/50 transition"
                >
                    <td class="py-2 pr-2">
                        <img
                            v-if="entry.anime?.cover_image_medium"
                            :src="entry.anime.cover_image_medium"
                            :alt="displayTitle(entry)"
                            class="h-10 w-7 rounded object-cover"
                            loading="lazy"
                        />
                    </td>
                    <td class="py-2 pr-4">
                        <Link
                            v-if="entry.anime"
                            :href="entry.anime?.slug ? route('anime.show', { anime: entry.anime.slug }) : '#'"
                            class="text-gray-200 hover:text-primary-400 transition"
                        >
                            {{ displayTitle(entry) }}
                        </Link>
                    </td>
                    <td class="py-2 pr-4">
                        <Select
                            v-if="!readonly"
                            :model-value="entry.status"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            class="w-full text-xs"
                            @update:model-value="(v: ListStatus) => handleStatusChange(entry, v)"
                        />
                        <span v-else class="text-gray-300 text-xs">{{ LIST_STATUS_LABELS[entry.status] }}</span>
                    </td>
                    <td class="py-2 pr-4">
                        <input
                            v-if="!readonly"
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            :value="entry.display_score ?? ''"
                            class="w-16 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-center text-gray-200 text-xs"
                            @change="handleScoreChange(entry, $event)"
                        />
                        <span v-else class="text-gray-300 text-xs">{{ entry.display_score ?? '-' }}</span>
                    </td>
                    <td class="py-2 pr-4">
                        <div class="flex items-center gap-1">
                            <span class="text-gray-300">{{ entry.progress }}</span>
                            <span class="text-gray-500">/</span>
                            <span class="text-gray-500">{{ entry.anime?.episodes ?? '?' }}</span>
                            <button
                                v-if="!readonly"
                                class="ml-1 rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300 hover:bg-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-700"
                                :disabled="!canIncrementProgress(entry)"
                                :title="canIncrementProgress(entry) ? 'Add one episode' : 'Already at total episode count'"
                                @click="incrementProgress(entry)"
                            >
                                +
                            </button>
                        </div>
                    </td>
                    <td class="py-2 pr-4 text-gray-400">
                        {{ entry.anime?.format?.replace(/_/g, ' ') ?? '-' }}
                    </td>
                    <td class="py-2 text-gray-500 text-xs">
                        {{ new Date(entry.updated_at).toLocaleDateString() }}
                    </td>
                </tr>
            </tbody>
        </table>
        <p v-if="entries.length === 0" class="py-8 text-center text-gray-500">
            No entries found.
        </p>
    </div>
</template>
