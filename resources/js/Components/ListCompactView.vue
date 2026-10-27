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
}>()

const statusOptions = Object.entries(LIST_STATUS_LABELS).map(([value, label]) => ({ value, label }))

function displayTitle(entry: ListEntryResource): string {
    return entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown'
}

function handleStatusChange(entry: ListEntryResource, status: ListStatus) {
    emit('update', entry.id, { status })
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
    <div class="divide-y divide-gray-800/50">
        <div
            v-for="entry in entries"
            :key="entry.id"
            class="flex items-center gap-3 py-1.5 hover:bg-gray-900/30 transition text-xs"
        >
            <Link
                v-if="entry.anime"
                :href="entry.anime?.slug ? route('anime.show', { anime: entry.anime.slug }) : '#'"
                class="flex-1 min-w-0 text-gray-200 hover:text-primary-400 transition truncate"
            >
                {{ displayTitle(entry) }}
            </Link>
            <Select
                v-if="!readonly"
                :model-value="entry.status"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                class="w-32 text-xs"
                @update:model-value="(v: ListStatus) => handleStatusChange(entry, v)"
            />
            <span v-else class="w-32 text-gray-300 text-xs">{{ LIST_STATUS_LABELS[entry.status] }}</span>
            <span class="w-12 text-center text-gray-400">
                {{ entry.display_score ?? '-' }}
            </span>
            <div class="flex items-center gap-1 w-20">
                <span class="text-gray-300">{{ entry.progress }}</span>
                <span class="text-gray-600">/{{ entry.anime?.episodes ?? '?' }}</span>
                <button
                    v-if="!readonly"
                    class="rounded bg-gray-700 px-1 text-gray-300 hover:bg-gray-600 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-700"
                    :disabled="!canIncrementProgress(entry)"
                    :title="canIncrementProgress(entry) ? 'Add one episode' : 'Already at total episode count'"
                    @click="incrementProgress(entry)"
                >
                    +
                </button>
            </div>
            <span class="w-16 text-gray-500">
                {{ entry.anime?.format?.replace(/_/g, ' ') ?? '-' }}
            </span>
        </div>
    </div>
    <p v-if="entries.length === 0" class="py-8 text-center text-gray-500">
        No entries found.
    </p>
</template>
