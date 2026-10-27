<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePage, router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import LibraryCardsView from '@/Components/LibraryCardsView.vue'
import LibraryRowsView from '@/Components/LibraryRowsView.vue'
import LibraryDataTable from '@/Components/LibraryDataTable.vue'
import ListEntryModal from '@/Components/ListEntryModal.vue'
import { useListMutations } from '@/composables/useListMutations'
import { statusDotClass } from '@/composables/useLibraryTheme'
import type { ListEntryResource, ListStatus, ListViewMode } from '@/types'
import { LIST_STATUS_LABELS } from '@/types'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    entries: ListEntryResource[]
    counts: Record<string, number>
}>()

const VALID_STATUSES = ['all', 'watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped'] as const

function readStatusFromUrl(): ListStatus | 'all' {
    if (typeof window === 'undefined') return 'all'
    const param = new URLSearchParams(window.location.search).get('status')
    return (VALID_STATUSES as readonly string[]).includes(param ?? '')
        ? (param as ListStatus | 'all')
        : 'all'
}

const activeStatus = ref<ListStatus | 'all'>(readStatusFromUrl())
const viewMode = ref<ListViewMode>('card')
const sortField = ref<string>('-updated_at')
const filterText = ref('')
const selectedGenres = ref<string[]>([])

function changeStatus(status: ListStatus | 'all') {
    activeStatus.value = status
    const url = new URL(window.location.href)
    if (status === 'all') {
        url.searchParams.delete('status')
    } else {
        url.searchParams.set('status', status)
    }
    window.history.replaceState(window.history.state, '', url.toString())
}

onMounted(() => {
    activeStatus.value = readStatusFromUrl()
    const saved = localStorage.getItem('list_view') as ListViewMode | null
    if (saved && ['table', 'card', 'compact'].includes(saved)) {
        viewMode.value = saved
    }
})

function setViewMode(mode: ListViewMode) {
    viewMode.value = mode
    localStorage.setItem('list_view', mode)
}

const statusFiltered = computed(() =>
    activeStatus.value === 'all'
        ? props.entries
        : props.entries.filter(e => e.status === activeStatus.value),
)

const filteredEntries = computed(() => {
    let entries = statusFiltered.value

    if (filterText.value.trim()) {
        const t = filterText.value.trim().toLowerCase()
        entries = entries.filter(e => {
            const en = e.anime?.title_english?.toLowerCase() ?? ''
            const ro = e.anime?.title_romaji?.toLowerCase() ?? ''
            return en.includes(t) || ro.includes(t)
        })
    }

    if (selectedGenres.value.length) {
        entries = entries.filter(e => {
            const names = (e.anime?.genres ?? []).map(g => g.name)
            return selectedGenres.value.every(g => names.includes(g))
        })
    }

    const [dir, field] = sortField.value.startsWith('-')
        ? ['desc', sortField.value.slice(1)] as const
        : ['asc', sortField.value] as const

    return [...entries].sort((a, b) => {
        let aVal: string | number = 0
        let bVal: string | number = 0

        if (field === 'updated_at') {
            aVal = new Date(a.updated_at).getTime()
            bVal = new Date(b.updated_at).getTime()
        } else if (field === 'score') {
            aVal = a.score ?? -1
            bVal = b.score ?? -1
        } else if (field === 'title') {
            aVal = (a.anime?.title_english || a.anime?.title_romaji || '').toLowerCase()
            bVal = (b.anime?.title_english || b.anime?.title_romaji || '').toLowerCase()
        } else if (field === 'progress') {
            const aTot = a.anime?.episodes || 1
            const bTot = b.anime?.episodes || 1
            aVal = a.progress / aTot
            bVal = b.progress / bTot
        }

        if (aVal < bVal) return dir === 'asc' ? -1 : 1
        if (aVal > bVal) return dir === 'asc' ? 1 : -1
        return 0
    })
})

const totalCount = computed(() => Object.values(props.counts).reduce((n, c) => n + c, 0))

const stats = computed(() => {
    const watching = props.counts?.watching ?? 0
    const completed = props.counts?.completed ?? 0

    const scored = props.entries.filter(e => e.display_score != null && e.display_score > 0)
    const avg = scored.length
        ? scored.reduce((n, e) => n + (e.display_score as number), 0) / scored.length
        : 0

    const totalEp = props.entries.reduce((n, e) => n + e.progress, 0)
    const days = Math.round((totalEp * 24) / 60 / 24 * 10) / 10

    return { watching, completed, avg, totalEp, days }
})

const tabs = computed(() => {
    const base: { key: ListStatus | 'all'; label: string; count: number }[] = [
        { key: 'all', label: 'All', count: totalCount.value },
    ]
    const statuses: ListStatus[] = ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped']
    statuses.forEach(s => base.push({ key: s, label: LIST_STATUS_LABELS[s], count: props.counts?.[s] ?? 0 }))
    return base
})

const allGenres = computed(() => {
    const s = new Set<string>()
    props.entries.forEach(e => (e.anime?.genres ?? []).forEach(g => s.add(g.name)))
    return [...s].sort()
})

function toggleGenre(g: string) {
    selectedGenres.value = selectedGenres.value.includes(g)
        ? selectedGenres.value.filter(x => x !== g)
        : [...selectedGenres.value, g]
}

const page = usePage<{ auth: { user: import('@/types').User } }>()
const user = computed(() => page.props.auth.user)
const username = computed(() => user.value?.username ?? 'you')

const publicUrl = computed(() => {
    if (!user.value?.list_is_public || !user.value?.username) return null
    return `${window.location.origin}/user/${user.value.username}/list`
})

const listIsPublic = ref(user.value?.list_is_public ?? false)

function togglePublic() {
    router.patch(route('settings.profile'), {
        list_is_public: listIsPublic.value,
    }, { preserveState: true, preserveScroll: true })
}

const copied = ref(false)
function copyUrl() {
    if (!publicUrl.value) return
    navigator.clipboard.writeText(publicUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
}

const { updateMutation } = useListMutations()

function reloadProps() {
    router.reload({ only: ['entries', 'counts'] })
}

function handleProgress(entry: ListEntryResource, delta: number) {
    const total = entry.anime?.episodes
    const next = Math.max(0, total != null ? Math.min(total, entry.progress + delta) : entry.progress + delta)
    if (next === entry.progress) return
    updateMutation.mutate({ id: entry.id, progress: next }, { onSuccess: reloadProps })
}

const editingEntry = ref<ListEntryResource | null>(null)
const showEditModal = ref(false)

function openEdit(entry: ListEntryResource) {
    editingEntry.value = entry
    showEditModal.value = true
}

const sortOptions = [
    { label: 'Recently updated', value: '-updated_at' },
    { label: 'My score', value: '-score' },
    { label: 'Title A–Z', value: 'title' },
    { label: 'Progress', value: '-progress' },
]
</script>

<template>
    <Head title="Library" />
    <div class="space-y-6">
        <!-- Hero -->
        <div>
            <div class="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
                Library · @{{ username }}
            </div>
            <h1 class="text-3xl font-bold tracking-tight text-gray-100 sm:text-4xl">
                Your collection
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-gray-400">
                {{ totalCount }} titles · {{ stats.totalEp.toLocaleString() }} episodes watched · {{ stats.days }} days of your life.
            </p>
        </div>

        <!-- Top actions -->
        <div class="flex flex-wrap items-center gap-3 border-b border-gray-800 pb-5">
            <div class="flex items-center gap-2">
                <ToggleSwitch v-model="listIsPublic" @update:model-value="togglePublic" />
                <span class="text-sm text-gray-400">Public</span>
            </div>
            <button
                v-if="publicUrl"
                class="flex items-center gap-1.5 rounded-lg border bg-gray-800 px-3 py-1.5 text-sm transition"
                :class="copied
                    ? 'border-green-500/50 text-green-400'
                    : 'border-gray-700 text-gray-300 hover:border-gray-600'"
                @click="copyUrl"
            >
                <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                {{ copied ? 'Copied!' : 'Share' }}
            </button>
            <a :href="route('list.export')" class="text-sm text-gray-400 transition hover:text-gray-200">Export XML</a>
            <Link :href="route('import')" class="text-sm text-gray-400 transition hover:text-gray-200">Import</Link>
        </div>

        <!-- Stats grid -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Watching</p>
                <p class="text-2xl font-bold text-primary-400">{{ stats.watching }}</p>
                <p class="mt-1 text-[11px] text-gray-500">currently</p>
            </div>
            <div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Completed</p>
                <p class="text-2xl font-bold text-gray-100">{{ stats.completed }}</p>
                <p class="mt-1 text-[11px] text-gray-500">all time</p>
            </div>
            <div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Avg score</p>
                <p class="text-2xl font-bold text-gray-100">{{ stats.avg ? stats.avg.toFixed(1) : '—' }}</p>
                <p class="mt-1 text-[11px] text-gray-500">on scored entries</p>
            </div>
            <div class="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <p class="mb-2 font-mono text-[11px] uppercase tracking-wider text-gray-500">Time spent</p>
                <p class="text-2xl font-bold text-gray-100">{{ stats.days }}d</p>
                <p class="mt-1 text-[11px] text-gray-500">{{ stats.totalEp }} episodes</p>
            </div>
        </div>

        <!-- Status tabs -->
        <div class="flex items-center gap-1 overflow-x-auto border-b border-gray-800">
            <button
                v-for="t in tabs"
                :key="t.key"
                class="-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition"
                :class="activeStatus === t.key
                    ? 'border-primary-400 font-medium text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'"
                @click="changeStatus(t.key)"
            >
                <span
                    v-if="t.key !== 'all'"
                    class="h-1.5 w-1.5 rounded-full"
                    :class="statusDotClass(t.key as ListStatus)"
                />
                {{ t.label }}
                <span class="font-mono text-[11px] text-gray-500">{{ t.count }}</span>
            </button>
        </div>

        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-2">
            <div class="flex min-w-[220px] max-w-[340px] flex-1 items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-gray-400 focus-within:border-gray-600">
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
                <input
                    v-model="filterText"
                    type="text"
                    placeholder="Filter your list…"
                    class="flex-1 border-0 bg-transparent text-sm text-gray-100 outline-none placeholder:text-gray-500"
                />
            </div>

            <select
                v-model="sortField"
                class="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-300"
            >
                <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>

            <div class="flex-1" />

            <div class="flex overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
                <button
                    v-for="[key, label] in ([['card', 'Grid'], ['compact', 'Rows'], ['table', 'Table']] as [ListViewMode, string][])"
                    :key="key"
                    class="flex items-center justify-center px-2.5 py-1.5 transition"
                    :class="[
                        viewMode === key ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300',
                        key !== 'table' ? 'border-r border-gray-700' : '',
                    ]"
                    :title="label"
                    @click="setViewMode(key)"
                >
                    <svg v-if="key === 'card'" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                        <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zm-8 8h6v6H3v-6zm8 0h6v6h-6v-6z" />
                    </svg>
                    <svg v-else-if="key === 'compact'" viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                        <path d="M3 4h14v3H3V4zm0 5h14v3H3V9zm0 5h14v3H3v-3z" />
                    </svg>
                    <svg v-else viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5">
                        <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2zm0 4h14v2H3v-2z" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Genre chips -->
        <div v-if="allGenres.length > 0" class="flex flex-wrap gap-1.5">
            <button
                v-for="g in allGenres.slice(0, 14)"
                :key="g"
                class="rounded-full border px-3 py-1 text-xs transition"
                :class="selectedGenres.includes(g)
                    ? 'border-primary-400 bg-primary-400/10 text-primary-300'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'"
                @click="toggleGenre(g)"
            >
                {{ g }}
            </button>
            <button
                v-if="selectedGenres.length"
                class="rounded-full border border-dashed border-gray-700 px-3 py-1 text-xs text-gray-500 hover:text-gray-300"
                @click="selectedGenres = []"
            >
                Clear
            </button>
        </div>

        <!-- Main content -->
        <div
            v-if="filteredEntries.length === 0"
            class="rounded-xl border border-dashed border-gray-700 bg-gray-900/30 px-6 py-16 text-center"
        >
            <p class="text-lg font-medium text-gray-200">Nothing here yet</p>
            <p class="mt-1 text-sm text-gray-500">
                <template v-if="filterText || selectedGenres.length">No entries match your filters.</template>
                <template v-else>Start by searching for an anime or importing from MAL.</template>
            </p>
        </div>

        <LibraryCardsView
            v-else-if="viewMode === 'card'"
            :entries="filteredEntries"
            @edit="openEdit"
            @progress="handleProgress"
        />
        <LibraryRowsView
            v-else-if="viewMode === 'compact'"
            :entries="filteredEntries"
            @edit="openEdit"
            @progress="handleProgress"
        />
        <LibraryDataTable
            v-else
            :entries="filteredEntries"
            @edit="openEdit"
        />

        <ListEntryModal
            v-if="showEditModal && editingEntry?.anime"
            :anime="editingEntry.anime"
            :entry="editingEntry"
            @close="showEditModal = false"
            @saved="() => { showEditModal = false; reloadProps() }"
            @deleted="() => { showEditModal = false; reloadProps() }"
        />
    </div>
</template>
