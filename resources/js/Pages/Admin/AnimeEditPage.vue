<script setup lang="ts">
import { ref, computed } from 'vue'
import { router, useForm, usePage } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'
import type { AdminAnimeEdit } from '@/types/admin'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    anime: AdminAnimeEdit
    min_words: number
}>()

const form = useForm({
    synopsis: props.anime.synopsis ?? '',
})

const confirmingReset = ref(false)
const page = usePage()
const flashMessage = computed(() => (page.props.flash as { message?: string } | undefined)?.message ?? null)

function submit() {
    form.patch(route('admin.anime.update', { anime: props.anime.id }), {
        preserveScroll: true,
    })
}

function resetToSynced() {
    router.delete(route('admin.anime.reset', { anime: props.anime.id }), {
        preserveScroll: true,
        onSuccess: () => { confirmingReset.value = false },
    })
}

function formatDateTime(iso: string | null): string | null {
    if (!iso) return null
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

const characterCount = computed(() => form.synopsis.length)

/**
 * Mirrors Anime::countSynopsisWords() on the backend: drop HTML tags and
 * line breaks, then count whitespace-separated words.
 */
function countWords(text: string): number {
    const plain = text
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]*>/g, '')
        .trim()

    if (plain === '') return 0

    return plain.split(/\s+/).filter(Boolean).length
}

const wordCount = computed(() => countWords(form.synopsis))
const isThin = computed(() => wordCount.value < props.min_words)
const wordsNeeded = computed(() => Math.max(0, props.min_words - wordCount.value))
</script>

<template>
    <Head :title="`Edit: ${anime.title_english ?? anime.title_romaji}`" />

    <div class="mx-auto max-w-4xl space-y-6">
        <AdminNav />

        <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
                <Link
                    :href="route('admin.anime.index')"
                    class="text-sm text-gray-400 transition hover:text-gray-200"
                >
                    &larr; All anime
                </Link>
                <h1 class="mt-2 truncate text-2xl font-bold">
                    {{ anime.title_english ?? anime.title_romaji }}
                </h1>
                <p v-if="anime.title_english && anime.title_romaji !== anime.title_english" class="text-sm text-gray-500">
                    {{ anime.title_romaji }}
                </p>
                <p class="mt-1 text-xs uppercase tracking-wide text-gray-600">
                    {{ [anime.format, anime.season, anime.season_year].filter(Boolean).join(' · ') }}
                </p>
            </div>
            <img
                v-if="anime.cover_image_medium"
                :src="anime.cover_image_medium"
                :alt="anime.title_romaji"
                class="h-32 w-24 flex-shrink-0 rounded object-cover"
            />
        </div>

        <div
            v-if="flashMessage"
            class="rounded-lg border border-green-700/50 bg-green-900/20 px-4 py-2 text-sm text-green-400"
        >
            {{ flashMessage }}
        </div>

        <div
            v-if="isThin"
            class="rounded-lg border border-amber-700/50 bg-amber-900/10 px-4 py-3 text-sm text-amber-300"
        >
            <strong>Flagged for review:</strong>
            this page has {{ wordCount.toLocaleString() }} {{ wordCount === 1 ? 'word' : 'words' }} of synopsis.
            Add at least {{ wordsNeeded.toLocaleString() }} more to reach the {{ min_words }}-word minimum.
            Pages under the minimum are not indexed by search engines.
        </div>

        <div
            v-if="anime.synopsis_rewritten_at"
            class="rounded-lg border border-primary-600/40 bg-primary-900/10 px-4 py-3 text-sm"
        >
            <div class="flex items-center justify-between gap-4">
                <span class="text-primary-300">
                    This description was rewritten on {{ formatDateTime(anime.synopsis_rewritten_at) }}. AniList syncs will not overwrite it.
                </span>
                <template v-if="confirmingReset">
                    <div class="flex items-center gap-2">
                        <button
                            class="rounded bg-red-600 px-2.5 py-1 text-xs text-white transition hover:bg-red-700"
                            @click="resetToSynced"
                        >
                            Confirm revert
                        </button>
                        <button
                            class="rounded px-2.5 py-1 text-xs text-gray-400 transition hover:text-gray-200"
                            @click="confirmingReset = false"
                        >
                            Cancel
                        </button>
                    </div>
                </template>
                <button
                    v-else
                    class="flex-shrink-0 rounded bg-gray-800 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-gray-700"
                    @click="confirmingReset = true"
                >
                    Revert to AniList
                </button>
            </div>
        </div>

        <form class="space-y-4" @submit.prevent="submit">
            <div>
                <label class="mb-1 flex items-center justify-between text-sm font-medium text-gray-300">
                    <span>Synopsis</span>
                    <span class="text-xs font-normal text-gray-500">
                        <span :class="isThin ? 'text-amber-300' : 'text-green-400'">
                            {{ wordCount.toLocaleString() }} / {{ min_words }} words
                        </span>
                        · {{ characterCount.toLocaleString() }} chars
                    </span>
                </label>
                <textarea
                    v-model="form.synopsis"
                    rows="16"
                    class="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 font-mono text-sm text-gray-200 placeholder-gray-500 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    placeholder="Write a unique, SEO-friendly description..."
                />
                <p v-if="form.errors.synopsis" class="mt-1 text-sm text-red-400">{{ form.errors.synopsis }}</p>
                <p class="mt-1 text-xs text-gray-500">
                    HTML tags like &lt;br&gt;, &lt;p&gt;, &lt;i&gt;, &lt;b&gt;, &lt;em&gt;, &lt;strong&gt; will render on the public page.
                </p>
            </div>

            <div class="flex items-center justify-end gap-2">
                <Link
                    :href="route('admin.anime.index')"
                    class="rounded-lg px-4 py-2 text-sm text-gray-400 transition hover:text-gray-200"
                >
                    Cancel
                </Link>
                <a
                    :href="route('anime.show', { anime: anime.slug })"
                    target="_blank"
                    rel="noopener"
                    class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-800"
                >
                    View public page
                </a>
                <button
                    type="submit"
                    :disabled="form.processing"
                    class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
                >
                    {{ form.processing ? 'Saving…' : 'Save description' }}
                </button>
            </div>
        </form>
    </div>
</template>
