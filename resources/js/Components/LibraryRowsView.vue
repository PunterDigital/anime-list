<script setup lang="ts">
import type { ListEntryResource } from '@/types'
import { LIST_STATUS_LABELS } from '@/types'
import { statusDotClass } from '@/composables/useLibraryTheme'

defineProps<{
    entries: ListEntryResource[]
}>()

const emit = defineEmits<{
    edit: [entry: ListEntryResource]
    progress: [entry: ListEntryResource, delta: number]
}>()

function displayTitle(entry: ListEntryResource): string {
    return entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown'
}

function canIncrement(entry: ListEntryResource): boolean {
    const total = entry.anime?.episodes
    return total == null || entry.progress < total
}

function progressPercent(entry: ListEntryResource): number {
    const total = entry.anime?.episodes
    if (!total) return 0
    return Math.min(100, Math.max(0, (entry.progress / total) * 100))
}

function seasonLabel(entry: ListEntryResource): string {
    const year = entry.anime?.season_year
    const season = entry.anime?.season
    if (!year && !season) return '—'
    const s = season ? season.charAt(0) + season.slice(1).toLowerCase() : ''
    return [year, s].filter(Boolean).join(' ')
}

function genrePair(entry: ListEntryResource): string {
    return (entry.anime?.genres ?? []).slice(0, 2).map(g => g.name).join(' / ')
}
</script>

<template>
    <div class="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50">
        <div
            v-for="(e, i) in entries"
            :key="e.id"
            class="flex items-center gap-3 px-3 py-2.5 transition hover:bg-gray-900"
            :class="i > 0 ? 'border-t border-gray-800' : ''"
        >
            <Link
                v-if="e.anime"
                :href="e.anime.slug ? route('anime.show', { anime: e.anime.slug }) : '#'"
                class="h-[52px] w-9 flex-none overflow-hidden rounded bg-gray-800"
            >
                <img
                    v-if="e.anime.cover_image_medium || e.anime.cover_image_large"
                    :src="(e.anime.cover_image_medium || e.anime.cover_image_large)!"
                    :alt="displayTitle(e)"
                    loading="lazy"
                    class="h-full w-full object-cover"
                />
            </Link>

            <div class="min-w-0 flex-1">
                <Link
                    v-if="e.anime"
                    :href="e.anime.slug ? route('anime.show', { anime: e.anime.slug }) : '#'"
                    class="block truncate text-sm font-medium text-gray-100 transition hover:text-primary-400"
                >
                    {{ displayTitle(e) }}
                </Link>
                <div class="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    <span class="inline-flex items-center gap-1.5">
                        <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(e.status)" />
                        {{ LIST_STATUS_LABELS[e.status] }}
                    </span>
                    <span class="text-gray-700">·</span>
                    <span>{{ seasonLabel(e) }}</span>
                    <template v-if="genrePair(e)">
                        <span class="text-gray-700">·</span>
                        <span>{{ genrePair(e) }}</span>
                    </template>
                </div>
            </div>

            <div class="hidden w-44 flex-none sm:block">
                <div class="mb-1 flex justify-between font-mono text-[11px] text-gray-500">
                    <span>EP {{ e.progress }}</span>
                    <span>{{ e.anime?.episodes ?? '?' }}</span>
                </div>
                <div class="h-[3px] overflow-hidden rounded-full bg-gray-800">
                    <div class="h-full bg-primary-400" :style="{ width: `${progressPercent(e)}%` }" />
                </div>
            </div>

            <div
                class="w-12 flex-none text-right font-mono text-xs"
                :class="e.display_score ? 'text-gray-200' : 'text-gray-600'"
            >
                {{ e.display_score ? `★ ${e.display_score}` : '—' }}
            </div>

            <button
                class="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 font-mono text-[11px] text-gray-300 transition hover:border-primary-400 hover:text-primary-400 disabled:cursor-default disabled:text-gray-500 disabled:hover:border-gray-700 disabled:hover:text-gray-500"
                :disabled="!canIncrement(e)"
                title="Add one episode"
                @click="emit('progress', e, 1)"
            >
                +1
            </button>

            <button class="p-1 text-gray-500 transition hover:text-gray-200" title="Edit entry" @click="emit('edit', e)">
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                    <circle cx="4" cy="10" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="16" cy="10" r="1.5" />
                </svg>
            </button>
        </div>
        <p v-if="entries.length === 0" class="px-4 py-8 text-center text-sm text-gray-500">
            No entries found.
        </p>
    </div>
</template>
