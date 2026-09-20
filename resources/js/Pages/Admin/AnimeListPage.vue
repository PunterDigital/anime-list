<script setup lang="ts">
import { ref, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'
import PaginationBar from '@/Components/PaginationBar.vue'
import type { PaginatedResponse } from '@/types/api'
import type { AdminAnimeListItem, AdminThinContentSummary } from '@/types/admin'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    anime: PaginatedResponse<AdminAnimeListItem>
    filters: {
        search: string | null
        rewritten_only: boolean
        thin_only: boolean
    }
    thin_content: AdminThinContentSummary
}>()

const search = ref(props.filters.search ?? '')
const rewrittenOnly = ref(props.filters.rewritten_only)
const thinOnly = ref(props.filters.thin_only)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function pushFilters() {
    router.get(
        route('admin.anime.index'),
        {
            search: search.value || undefined,
            rewritten_only: rewrittenOnly.value ? 1 : undefined,
            thin_only: thinOnly.value ? 1 : undefined,
        },
        { preserveState: true, preserveScroll: true },
    )
}

watch(search, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(pushFilters, 300)
})

watch(rewrittenOnly, () => pushFilters())
watch(thinOnly, () => pushFilters())

function formatDate(iso: string | null): string | null {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
</script>

<template>
    <Head title="Anime Descriptions" />

    <div class="mx-auto max-w-6xl space-y-6">
        <AdminNav />

        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold">Anime Descriptions</h1>
                <p class="mt-1 text-sm text-gray-400">
                    Rewrite synopses for SEO. Rewritten descriptions are preserved across AniList syncs.
                </p>
            </div>
            <span class="text-xs text-gray-500">{{ anime.meta.total.toLocaleString() }} total</span>
        </div>

        <div
            v-if="thin_content.total > 0"
            class="flex flex-col gap-3 rounded-lg border border-amber-700/50 bg-amber-900/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
            <span class="text-amber-300">
                <strong>{{ thin_content.total.toLocaleString() }}</strong>
                {{ thin_content.total === 1 ? 'page has' : 'pages have' }} fewer than {{ thin_content.min_words }} words of synopsis and
                {{ thin_content.total === 1 ? 'is' : 'are' }} flagged for review.
            </span>
            <button
                v-if="!thinOnly"
                type="button"
                class="flex-shrink-0 rounded bg-amber-600/20 px-2.5 py-1 text-xs text-amber-300 transition hover:bg-amber-600/30"
                @click="thinOnly = true"
            >
                Show flagged pages
            </button>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
                v-model="search"
                type="text"
                placeholder="Search by title or slug..."
                class="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <label class="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                    v-model="rewrittenOnly"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                />
                Rewritten only
            </label>
            <label class="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                    v-model="thinOnly"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"
                />
                Needs review (&lt; {{ thin_content.min_words }} words)
            </label>
        </div>

        <div class="overflow-hidden rounded-xl border border-gray-800">
            <table class="w-full">
                <thead class="border-b border-gray-800 bg-gray-900">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Anime</th>
                        <th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Synopsis</th>
                        <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Words</th>
                        <th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 lg:table-cell">Rewritten</th>
                        <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-800">
                    <tr
                        v-for="item in anime.data"
                        :key="item.id"
                        class="bg-gray-950 transition hover:bg-gray-900"
                    >
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <img
                                    v-if="item.cover_image_medium"
                                    :src="item.cover_image_medium"
                                    :alt="item.title"
                                    class="h-14 w-10 flex-shrink-0 rounded object-cover"
                                />
                                <div v-else class="h-14 w-10 flex-shrink-0 rounded bg-gray-800" />
                                <div class="min-w-0">
                                    <div class="truncate font-medium text-gray-200">
                                        {{ item.title }}
                                    </div>
                                    <div v-if="item.title_secondary" class="truncate text-xs text-gray-500">
                                        {{ item.title_secondary }}
                                    </div>
                                    <div class="mt-0.5 text-[11px] uppercase tracking-wide text-gray-600">
                                        {{ [item.format, item.season_year].filter(Boolean).join(' · ') }}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td class="hidden px-4 py-3 text-sm text-gray-400 md:table-cell">
                            <span v-if="item.synopsis_excerpt">{{ item.synopsis_excerpt }}</span>
                            <span v-else class="italic text-gray-600">No description</span>
                        </td>
                        <td class="px-4 py-3 text-xs">
                            <div class="flex flex-col items-start gap-1">
                                <span
                                    class="tabular-nums"
                                    :class="item.is_thin ? 'font-medium text-amber-300' : 'text-gray-400'"
                                >
                                    {{ item.synopsis_word_count.toLocaleString() }}
                                </span>
                                <span
                                    v-if="item.is_thin"
                                    class="rounded bg-amber-600/20 px-2 py-0.5 text-[11px] font-medium text-amber-300"
                                    :title="`Fewer than ${thin_content.min_words} words. Add more content to this page.`"
                                >
                                    Needs review
                                </span>
                            </div>
                        </td>
                        <td class="hidden px-4 py-3 text-xs lg:table-cell">
                            <span
                                v-if="item.synopsis_rewritten_at"
                                class="rounded bg-primary-600/20 px-2 py-0.5 text-primary-400"
                            >
                                {{ formatDate(item.synopsis_rewritten_at) }}
                            </span>
                            <span v-else class="text-gray-600">—</span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <Link
                                :href="route('admin.anime.edit', { anime: item.id })"
                                class="rounded bg-primary-600/20 px-2.5 py-1 text-xs text-primary-400 transition hover:bg-primary-600/30"
                            >
                                Edit
                            </Link>
                        </td>
                    </tr>
                    <tr v-if="anime.data.length === 0">
                        <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">
                            {{ thinOnly ? 'No anime are flagged for review.' : 'No anime match your search.' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <PaginationBar
            :current-page="anime.meta.current_page"
            :last-page="anime.meta.last_page"
            :total="anime.meta.total"
        />
    </div>
</template>
