<script setup lang="ts">
import type { ListEntryResource } from '@/types'
import { LIST_STATUS_LABELS } from '@/types'
import { statusDotClass } from '@/composables/useLibraryTheme'

defineProps<{
    entries: ListEntryResource[]
}>()

const emit = defineEmits<{
    edit: [entry: ListEntryResource]
}>()

function displayTitle(entry: ListEntryResource): string {
    return entry.anime?.title_english || entry.anime?.title_romaji || 'Unknown'
}

function progressPercent(entry: ListEntryResource): number {
    const total = entry.anime?.episodes
    if (!total) return 0
    return Math.min(100, Math.max(0, (entry.progress / total) * 100))
}

function daysAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime()
    const days = Math.round(ms / 86400000)
    if (days <= 0) return 'today'
    if (days === 1) return '1d ago'
    if (days < 30) return `${days}d ago`
    const months = Math.round(days / 30)
    if (months < 12) return `${months}mo ago`
    return `${Math.round(months / 12)}y ago`
}

function formatLabel(entry: ListEntryResource): string {
    return entry.anime?.format?.replace(/_/g, ' ') ?? '—'
}
</script>

<template>
    <div class="overflow-hidden rounded-lg border border-gray-800 bg-gray-900/50">
        <div class="grid grid-cols-[36px_minmax(0,2.4fr)_minmax(0,1fr)_60px_minmax(0,1fr)_70px_minmax(0,0.9fr)_32px] items-center gap-3 border-b border-gray-800 px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-gray-500">
            <div>#</div>
            <div>Title</div>
            <div>Status</div>
            <div>Score</div>
            <div>Progress</div>
            <div>Type</div>
            <div>Updated</div>
            <div />
        </div>

        <div
            v-for="(e, i) in entries"
            :key="e.id"
            class="grid grid-cols-[36px_minmax(0,2.4fr)_minmax(0,1fr)_60px_minmax(0,1fr)_70px_minmax(0,0.9fr)_32px] items-center gap-3 px-3 py-2.5 text-sm transition hover:bg-gray-900"
            :class="i > 0 ? 'border-t border-gray-800' : ''"
        >
            <div class="font-mono text-[11px] text-gray-500">{{ String(i + 1).padStart(2, '0') }}</div>

            <Link
                v-if="e.anime"
                :href="e.anime.slug ? route('anime.show', { anime: e.anime.slug }) : '#'"
                class="group flex min-w-0 items-center gap-2.5"
            >
                <div class="h-[42px] w-[30px] flex-none overflow-hidden rounded bg-gray-800">
                    <img
                        v-if="e.anime.cover_image_medium || e.anime.cover_image_large"
                        :src="(e.anime.cover_image_medium || e.anime.cover_image_large)!"
                        :alt="displayTitle(e)"
                        loading="lazy"
                        class="h-full w-full object-cover"
                    />
                </div>
                <div class="min-w-0 flex-1">
                    <div class="truncate font-medium text-gray-100 transition group-hover:text-primary-400">
                        {{ displayTitle(e) }}
                    </div>
                    <div class="truncate text-[11px] text-gray-500">{{ e.anime.title_romaji }}</div>
                </div>
            </Link>

            <div class="inline-flex items-center gap-1.5 text-xs text-gray-300">
                <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(e.status)" />
                {{ LIST_STATUS_LABELS[e.status] }}
            </div>

            <div class="font-mono text-xs" :class="e.display_score ? 'text-gray-100' : 'text-gray-600'">
                {{ e.display_score ? `★ ${e.display_score}` : '—' }}
            </div>

            <div>
                <div class="mb-1 flex justify-between font-mono text-[11px] text-gray-500">
                    <span>{{ e.progress }}</span>
                    <span>{{ e.anime?.episodes ?? '?' }}</span>
                </div>
                <div class="h-[2px] overflow-hidden rounded-full bg-gray-800">
                    <div class="h-full bg-primary-400" :style="{ width: `${progressPercent(e)}%` }" />
                </div>
            </div>

            <div class="text-xs text-gray-500">{{ formatLabel(e) }}</div>

            <div class="font-mono text-[11px] text-gray-500">{{ daysAgo(e.updated_at) }}</div>

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
