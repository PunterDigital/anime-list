<script setup lang="ts">
import { computed } from 'vue'
import AppLayout from '@/Layouts/AppLayout.vue'
import UserAvatar from '@/Components/UserAvatar.vue'
import type { UserProfile } from '@/types'
import { LIST_STATUS_LABELS } from '@/types'
import type { ListStatus } from '@/types'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    profile: UserProfile
    stats_hidden: boolean
    stats: Record<string, number>
    avg_score: number | null
    episodes_watched: number
}>()

const memberSince = computed(() => {
    return new Date(props.profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
})

const statuses: ListStatus[] = ['watching', 'completed', 'plan_to_watch', 'on_hold', 'dropped']

const totalEntries = computed(() => {
    return Object.values(props.stats).reduce((sum, count) => sum + count, 0)
})
</script>

<template>
    <Head :title="profile.name">
        <meta name="description" :content="profile.bio || `${profile.name}'s anime profile on AniTrack.`" />
        <link rel="canonical" :href="route('profile.show', { user: profile.username })" />
        <meta property="og:title" :content="`${profile.name}'s Profile — AniTrack`" />
        <meta property="og:description" :content="profile.bio || `Check out ${profile.name}'s anime profile on AniTrack.`" />
        <meta v-if="profile.avatar_url" property="og:image" :content="profile.avatar_url" />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary" />
    </Head>
    <div class="max-w-4xl mx-auto">
        <!-- Profile Header -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
            <div class="flex items-center gap-6">
                <UserAvatar :name="profile.name" :avatar-url="profile.avatar_url" size="lg" />
                <div>
                    <h1 class="text-2xl font-bold">{{ profile.name }}</h1>
                    <p class="text-gray-400 text-sm mt-1">Member since {{ memberSince }}</p>
                    <p v-if="profile.timezone" class="text-gray-500 text-xs mt-1">{{ profile.timezone }}</p>
                </div>
            </div>
            <p v-if="profile.bio" class="text-gray-300 mt-4 whitespace-pre-line">{{ profile.bio }}</p>
            <Link
                v-if="profile.list_is_public"
                :href="route('profile.list', { user: profile.username })"
                class="text-primary-400 hover:text-primary-300 text-sm mt-3 inline-block"
            >
                View Anime List &rarr;
            </Link>
        </div>

        <!-- Stats -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 class="text-lg font-semibold mb-4">Anime Stats</h2>
            <p v-if="stats_hidden" class="text-gray-500" data-test="profile-stats-hidden">
                {{ profile.name }}'s list is private.
            </p>
            <div v-else-if="totalEntries > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <div
                    v-for="status in statuses"
                    :key="status"
                    class="bg-gray-800 rounded-lg p-4 text-center"
                >
                    <div class="text-2xl font-bold text-primary-400">
                        {{ stats[status] ?? 0 }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">
                        {{ LIST_STATUS_LABELS[status] }}
                    </div>
                </div>
            </div>
            <p v-else class="text-gray-500">No anime in list yet.</p>

            <!-- Summary stats -->
            <div v-if="!stats_hidden && totalEntries > 0" class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-gray-200">{{ totalEntries }}</div>
                    <div class="text-xs text-gray-400 mt-1">Total Entries</div>
                </div>
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-gray-200">{{ episodes_watched.toLocaleString() }}</div>
                    <div class="text-xs text-gray-400 mt-1">Episodes Watched</div>
                </div>
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <div class="text-2xl font-bold text-gray-200">{{ avg_score?.toFixed(1) ?? '-' }}</div>
                    <div class="text-xs text-gray-400 mt-1">Mean Score</div>
                </div>
            </div>
        </div>
    </div>
</template>
