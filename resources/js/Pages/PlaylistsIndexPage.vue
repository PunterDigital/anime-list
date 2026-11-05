<script setup lang="ts">
import AppLayout from '@/Layouts/AppLayout.vue'
import type { PlaylistCard } from '@/types'
import AppButton from '@/Components/ui/AppButton.vue'

defineOptions({ layout: AppLayout })

defineProps<{
    playlists: PlaylistCard[]
}>()
</script>

<template>
    <Head title="My Playlists" />
    <div>
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">My Playlists</h1>
            <Link :href="route('playlists.create')">
                <AppButton label="Create Playlist" size="small" />
            </Link>
        </div>

        <div v-if="playlists.length === 0" class="text-center py-16 text-gray-500">
            <p class="text-lg mb-2">No playlists yet</p>
            <p class="text-sm">Create a watch order playlist to help others discover anime in the right order.</p>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
                v-for="playlist in playlists"
                :key="playlist.id"
                :href="route('playlists.edit', { playlist: playlist.slug })"
                class="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition group"
            >
                <!-- Cover thumbnails -->
                <div class="flex gap-1 mb-3 h-20 overflow-hidden rounded-lg">
                    <template v-if="playlist.cover_images.length > 0">
                        <img
                            v-for="(src, i) in playlist.cover_images"
                            :key="i"
                            :src="src"
                            :alt="`Cover ${i + 1}`"
                            class="h-full object-cover flex-1 min-w-0"
                        />
                    </template>
                    <div v-else class="w-full bg-gray-800 flex items-center justify-center text-gray-600 text-sm">
                        No anime added
                    </div>
                </div>

                <h2 class="font-semibold text-gray-100 group-hover:text-primary-400 transition truncate">
                    {{ playlist.title }}
                </h2>
                <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{{ playlist.item_count }} anime</span>
                    <span>&middot;</span>
                    <span :class="playlist.is_public ? 'text-green-500' : 'text-gray-500'">
                        {{ playlist.is_public ? 'Public' : 'Private' }}
                    </span>
                </div>
            </Link>
        </div>
    </div>
</template>
