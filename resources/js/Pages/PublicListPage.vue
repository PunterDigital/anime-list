<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/Layouts/AppLayout.vue'
import ListStatusTabs from '@/Components/ListStatusTabs.vue'
import ListTableView from '@/Components/ListTableView.vue'
import ListCardView from '@/Components/ListCardView.vue'
import ListCompactView from '@/Components/ListCompactView.vue'
import AppButton from '@/Components/ui/AppButton.vue'
import { useRenderLimit } from '@/composables/useRenderLimit'
import type { ListEntryResource, ListStatus, ListViewMode, UserProfile } from '@/types'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    profile: UserProfile
    is_public: boolean
    entries: ListEntryResource[]
    counts: Record<string, number>
}>()

const activeStatus = ref<ListStatus | 'all'>('all')
const viewMode = ref<ListViewMode>('table')

onMounted(() => {
    const saved = localStorage.getItem('list_view') as ListViewMode | null
    if (saved && ['table', 'card', 'compact'].includes(saved)) {
        viewMode.value = saved
    }
})
const sortField = ref<string>('-updated_at')

function setViewMode(mode: ListViewMode) {
    viewMode.value = mode
    localStorage.setItem('list_view', mode)
}

const filteredEntries = computed(() => {
    let entries = props.entries
    if (activeStatus.value !== 'all') {
        entries = entries.filter(e => e.status === activeStatus.value)
    }

    const [dir, field] = sortField.value.startsWith('-')
        ? ['desc', sortField.value.slice(1)] as const
        : ['asc', sortField.value] as const

    return [...entries].sort((a, b) => {
        let aVal: string | number | null = null
        let bVal: string | number | null = null

        if (field === 'updated_at') {
            aVal = a.updated_at
            bVal = b.updated_at
        } else if (field === 'score') {
            aVal = a.score ?? -1
            bVal = b.score ?? -1
        } else if (field === 'title') {
            aVal = (a.anime?.title_english || a.anime?.title_romaji || '').toLowerCase()
            bVal = (b.anime?.title_english || b.anime?.title_romaji || '').toLowerCase()
        } else if (field === 'progress') {
            aVal = a.progress
            bVal = b.progress
        }

        if (aVal === null || bVal === null) return 0
        if (aVal < bVal) return dir === 'asc' ? -1 : 1
        if (aVal > bVal) return dir === 'asc' ? 1 : -1
        return 0
    })
})

// Card 5718: draw a slice of a long list; the tabs and sorting still see all of it.
const { visible: visibleEntries, remaining, showMore } = useRenderLimit(filteredEntries, [activeStatus, sortField])

const sortOptions = [
    { label: 'Last Updated', value: '-updated_at' },
    { label: 'Score', value: '-score' },
    { label: 'Title', value: 'title' },
    { label: 'Progress', value: '-progress' },
]
</script>

<template>
    <Head :title="`${profile.name}'s Anime List`">
        <meta name="description" :content="`Browse ${profile.name}'s anime list on AniTrack.`" />
        <link rel="canonical" :href="route('profile.list', { user: profile.username })" />
        <meta property="og:title" :content="`${profile.name}'s Anime List — AniTrack`" />
        <meta property="og:description" :content="`Browse ${profile.name}'s anime list on AniTrack.`" />
        <meta v-if="profile.avatar_url" property="og:image" :content="profile.avatar_url" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
    </Head>
    <div class="space-y-4">
        <!-- Private list message -->
        <div v-if="!is_public" class="max-w-4xl mx-auto text-center py-16">
            <h1 class="text-2xl font-bold mb-2">{{ profile.name }}'s Anime List</h1>
            <p class="text-gray-400">This list is private.</p>
            <Link
                :href="route('profile.show', { user: profile.username })"
                class="text-primary-400 hover:text-primary-300 text-sm mt-4 inline-block"
            >
                View profile
            </Link>
        </div>

        <!-- Public list -->
        <template v-else>
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold">
                    <Link
                        :href="route('profile.show', { user: profile.username })"
                        class="hover:text-primary-400 transition"
                    >
                        {{ profile.name }}
                    </Link>'s Anime List
                </h1>
            </div>

            <ListStatusTabs
                :active-status="activeStatus"
                :counts="counts"
                @change="activeStatus = $event"
            />

            <div class="flex items-center justify-between">
                <select
                    v-model="sortField"
                    class="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-300"
                >
                    <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
                <div class="flex items-center gap-1">
                    <button
                        v-for="mode in (['table', 'card', 'compact'] as ListViewMode[])"
                        :key="mode"
                        class="rounded px-2 py-1 text-xs transition"
                        :class="viewMode === mode ? 'bg-gray-700 text-gray-200' : 'text-gray-500 hover:text-gray-300'"
                        @click="setViewMode(mode)"
                    >
                        {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
                    </button>
                </div>
            </div>

            <ListTableView v-if="viewMode === 'table'" :entries="visibleEntries" readonly />
            <ListCardView v-else-if="viewMode === 'card'" :entries="visibleEntries" readonly />
            <ListCompactView v-else :entries="visibleEntries" readonly />
            <div v-if="remaining > 0" class="mt-6 flex justify-center" data-test="list-show-more">
                <AppButton :label="`Show more (${remaining} left)`" severity="secondary" outlined @click="showMore" />
            </div>
        </template>
    </div>
</template>
