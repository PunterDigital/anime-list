<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import type { PlaylistResource } from '@/types'
import Button from 'primevue/button'

defineOptions({ layout: AppLayout })

defineProps<{
    playlist: PlaylistResource
    isOwner: boolean
}>()

function displayTitle(anime: { title_english: string | null; title_romaji: string }): string {
    return anime.title_english || anime.title_romaji
}

</script>

<template>
    <Head :title="playlist.title" />
    <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-bold">{{ playlist.title }}</h1>
                    <p class="text-sm text-gray-500 mt-1">
                        by
                        <Link :href="route('profile.show', { user: playlist.user.username })" class="text-primary-400 hover:text-primary-300">
                            {{ playlist.user.username }}
                        </Link>
                        &middot; {{ playlist.item_count }} anime
                    </p>
                </div>
                <Link v-if="isOwner" :href="route('playlists.edit', { playlist: playlist.slug })">
                    <Button label="Edit" size="small" severity="secondary" />
                </Link>
            </div>
            <p v-if="playlist.description" class="text-gray-400 text-sm mt-3">{{ playlist.description }}</p>
        </div>

        <!-- Items list -->
        <div class="space-y-2">
            <div
                v-for="item in playlist.items"
                :key="item.id"
                class="flex gap-3 bg-gray-900 border rounded-lg p-3"
                :class="item.is_optional ? 'border-gray-800/50 border-dashed' : 'border-gray-800'"
            >
                <!-- Position number -->
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-400">
                    {{ item.position }}
                </div>

                <!-- Cover -->
                <component
                    :is="item.anime.slug ? Link : 'div'"
                    v-bind="item.anime.slug ? { href: route('anime.show', { anime: item.anime.slug }) } : {}"
                    class="flex-shrink-0"
                >
                    <img
                        v-if="item.anime.cover_image_medium"
                        :src="item.anime.cover_image_medium"
                        :alt="displayTitle(item.anime)"
                        class="w-12 h-16 object-cover rounded"
                    />
                </component>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <component
                            :is="item.anime.slug ? Link : 'span'"
                            v-bind="item.anime.slug ? { href: route('anime.show', { anime: item.anime.slug }) } : {}"
                            class="font-medium text-gray-100 truncate"
                            :class="item.anime.slug ? 'hover:text-primary-400 transition' : ''"
                        >
                            {{ displayTitle(item.anime) }}
                        </component>
                        <span v-if="item.is_optional" class="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                            Optional
                        </span>
                    </div>
                    <div class="text-xs text-gray-500 mt-0.5">
                        {{ item.anime.format }} &middot; {{ item.anime.episodes ? `${item.anime.episodes} eps` : 'Ongoing' }}
                    </div>
                    <p v-if="item.note" class="text-sm text-gray-400 mt-1">{{ item.note }}</p>
                </div>
            </div>
        </div>

        <div v-if="playlist.items.length === 0" class="text-center py-12 text-gray-500">
            This playlist is empty.
        </div>
    </div>
</template>
