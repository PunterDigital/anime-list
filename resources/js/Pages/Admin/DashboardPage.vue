<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'
import type { AdminStats, SyncStatuses } from '@/types/admin'

defineOptions({ layout: AppLayout })

interface RecentUser {
    id: number
    name: string
    username: string
    email: string
    avatar_url: string | null
    is_admin: boolean
    created_at: string
}

const props = defineProps<{
    stats: AdminStats
    recentUsers: RecentUser[]
    syncStatuses: SyncStatuses
}>()

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

function syncStatusColor(status: string): string {
    if (status === 'completed') return 'text-green-400'
    if (status === 'running') return 'text-yellow-400'
    if (status === 'failed') return 'text-red-400'
    return 'text-gray-500'
}
</script>

<template>
    <Head title="Admin Dashboard" />

    <div class="mx-auto max-w-6xl space-y-8">
        <AdminNav />
        <h1 class="text-2xl font-bold">Dashboard</h1>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ stats.total_users.toLocaleString() }}</div>
                <div class="mt-1 text-xs text-gray-400">Total Users</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ stats.new_users_this_month }}</div>
                <div class="mt-1 text-xs text-gray-400">New This Month</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ stats.total_anime.toLocaleString() }}</div>
                <div class="mt-1 text-xs text-gray-400">Anime in DB</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ stats.total_list_entries.toLocaleString() }}</div>
                <div class="mt-1 text-xs text-gray-400">List Entries</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ stats.total_episodes_watched.toLocaleString() }}</div>
                <div class="mt-1 text-xs text-gray-400">Episodes Watched</div>
            </div>
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div class="text-2xl font-bold text-primary-400">{{ stats.active_users_today }}</div>
                <div class="mt-1 text-xs text-gray-400">Active Today</div>
            </div>
        </div>

        <!-- Content Review -->
        <div
            v-if="stats.thin_content_anime > 0"
            class="flex flex-col gap-3 rounded-xl border border-amber-700/50 bg-amber-900/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <div class="text-sm font-medium text-amber-300">
                    {{ stats.thin_content_anime.toLocaleString() }} anime
                    {{ stats.thin_content_anime === 1 ? 'page needs' : 'pages need' }} content review
                </div>
                <div class="mt-0.5 text-xs text-amber-300/70">
                    Fewer than {{ stats.thin_content_min_words }} words of synopsis. These pages are not indexed until they are expanded.
                </div>
            </div>
            <Link
                :href="route('admin.anime.index', { thin_only: 1 })"
                class="flex-shrink-0 rounded bg-amber-600/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-600/30"
            >
                Review flagged pages
            </Link>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
            <!-- Sync Status -->
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h2 class="mb-4 text-lg font-semibold">Sync Status</h2>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-400">Releasing Anime</span>
                        <span class="text-sm font-medium capitalize" :class="syncStatusColor(syncStatuses.releasing)">
                            {{ syncStatuses.releasing }}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-400">Incremental Sync</span>
                        <span class="text-sm font-medium capitalize" :class="syncStatusColor(syncStatuses.incremental)">
                            {{ syncStatuses.incremental }}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-400">Airing Schedule</span>
                        <span class="text-sm font-medium capitalize" :class="syncStatusColor(syncStatuses.schedule)">
                            {{ syncStatuses.schedule }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Recent Users -->
            <div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h2 class="mb-4 text-lg font-semibold">Recent Users</h2>
                <div class="space-y-3">
                    <div
                        v-for="user in recentUsers"
                        :key="user.id"
                        class="flex items-center justify-between"
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-medium text-gray-300">
                                {{ user.name.charAt(0).toUpperCase() }}
                            </div>
                            <div>
                                <div class="text-sm font-medium text-gray-200">
                                    {{ user.name }}
                                    <span v-if="user.is_admin" class="ml-1 rounded bg-primary-600/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-400">
                                        ADMIN
                                    </span>
                                </div>
                                <div class="text-xs text-gray-500">{{ user.email }}</div>
                            </div>
                        </div>
                        <div class="text-xs text-gray-500">{{ formatDate(user.created_at) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
