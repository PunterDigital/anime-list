<script setup lang="ts">
import { ref, computed } from 'vue'
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import type { PlaylistResource, PlaylistItem, AnimeCard } from '@/types'
import { usePlaylistMutations } from '@/composables/usePlaylistMutations'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import axios from 'axios'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    playlist: PlaylistResource | null
}>()

const isNew = computed(() => !props.playlist)

const title = ref(props.playlist?.title ?? '')
const description = ref(props.playlist?.description ?? '')
const isPublic = ref(props.playlist?.is_public ?? true)
const items = ref<PlaylistItem[]>(props.playlist?.items ?? [])

const saving = ref(false)
const searchQuery = ref('')
const searchResults = ref<AnimeCard[]>([])
const searching = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const { storeMutation, updateMutation, destroyMutation, addItemMutation, updateItemMutation, removeItemMutation, reorderMutation } = usePlaylistMutations()

// Search
function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout)
    if (!searchQuery.value.trim()) {
        searchResults.value = []
        return
    }
    searchTimeout = setTimeout(async () => {
        searching.value = true
        try {
            const { data } = await axios.get<{ data: AnimeCard[] }>(route('api.search'), {
                params: { q: searchQuery.value },
            })
            searchResults.value = data.data.filter(
                anime => !items.value.some(i => i.anime.id === anime.id)
            )
        } catch {
            searchResults.value = []
        } finally {
            searching.value = false
        }
    }, 300)
}

function displayTitle(anime: { title_english: string | null; title_romaji: string }): string {
    return anime.title_english || anime.title_romaji
}

// Save playlist metadata
async function savePlaylist() {
    saving.value = true
    try {
        if (isNew.value) {
            const playlist = await storeMutation.mutateAsync({
                title: title.value,
                description: description.value || null,
                is_public: isPublic.value,
            })
            router.visit(route('playlists.edit', { playlist: playlist.slug }))
        } else {
            await updateMutation.mutateAsync({
                id: props.playlist!.id,
                title: title.value,
                description: description.value || null,
                is_public: isPublic.value,
            })
        }
    } finally {
        saving.value = false
    }
}

// Add anime
async function addAnime(anime: AnimeCard) {
    if (!props.playlist) return
    try {
        const item = await addItemMutation.mutateAsync({
            playlistId: props.playlist.id,
            anime_id: anime.id!,
        })
        items.value.push(item)
        searchQuery.value = ''
        searchResults.value = []
    } catch { /* handled by mutation */ }
}

// Remove item
async function removeItem(item: PlaylistItem) {
    if (!props.playlist) return
    try {
        await removeItemMutation.mutateAsync({
            playlistId: props.playlist.id,
            itemId: item.id,
        })
        items.value = items.value.filter(i => i.id !== item.id)
    } catch { /* handled by mutation */ }
}

// Update item note/optional
async function updateItem(item: PlaylistItem, patch: { note?: string | null; is_optional?: boolean }) {
    if (!props.playlist) return
    try {
        await updateItemMutation.mutateAsync({
            playlistId: props.playlist.id,
            itemId: item.id,
            ...patch,
        })
        const idx = items.value.findIndex(i => i.id === item.id)
        if (idx !== -1) Object.assign(items.value[idx], patch)
    } catch { /* handled by mutation */ }
}

// Move item up/down
async function moveItem(index: number, direction: 'up' | 'down') {
    if (!props.playlist) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.value.length) return

    const temp = items.value[index]
    items.value[index] = items.value[newIndex]
    items.value[newIndex] = temp

    // Update positions
    items.value.forEach((item, i) => { item.position = i + 1 })

    await reorderMutation.mutateAsync({
        playlistId: props.playlist.id,
        itemIds: items.value.map(i => i.id),
    })
}

// Delete playlist
async function deletePlaylist() {
    if (!props.playlist || !confirm('Delete this playlist?')) return
    await destroyMutation.mutateAsync(props.playlist.id)
    router.visit(route('playlists.index'))
}
</script>

<template>
    <Head :title="isNew ? 'Create Playlist' : `Edit: ${playlist!.title}`" />
    <div class="max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">{{ isNew ? 'Create Playlist' : 'Edit Playlist' }}</h1>
            <div v-if="!isNew" class="flex gap-2">
                <Link :href="route('playlist.show', { playlist: playlist!.slug })">
                    <Button label="View" size="small" severity="secondary" text />
                </Link>
                <Button label="Delete" size="small" severity="danger" text @click="deletePlaylist" />
            </div>
        </div>

        <!-- Metadata form -->
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 mb-6">
            <div>
                <label class="block text-sm text-gray-400 mb-1">Title</label>
                <InputText v-model="title" class="w-full" placeholder="e.g. Gundam Watch Order" />
            </div>
            <div>
                <label class="block text-sm text-gray-400 mb-1">Description</label>
                <Textarea v-model="description" class="w-full" rows="3" placeholder="Describe this watch order..." />
            </div>
            <div class="flex items-center gap-3">
                <ToggleSwitch v-model="isPublic" />
                <label class="text-sm text-gray-300 cursor-pointer" @click="isPublic = !isPublic">Public</label>
            </div>
            <Button
                :label="isNew ? 'Create Playlist' : 'Save Changes'"
                :loading="saving"
                :disabled="!title.trim()"
                @click="savePlaylist"
            />
        </div>

        <!-- Items section (only after playlist is created) -->
        <template v-if="!isNew">
            <!-- Add anime search -->
            <div class="mb-4">
                <label class="block text-sm text-gray-400 mb-1">Add anime</label>
                <InputText
                    v-model="searchQuery"
                    class="w-full"
                    placeholder="Search for anime to add..."
                    @input="onSearchInput"
                />
                <div v-if="searchResults.length > 0" class="mt-1 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <button
                        v-for="anime in searchResults"
                        :key="anime.id!"
                        class="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-800 text-left transition"
                        @click="addAnime(anime)"
                    >
                        <img
                            v-if="anime.cover_image_medium"
                            :src="anime.cover_image_medium"
                            :alt="displayTitle(anime)"
                            class="w-8 h-11 object-cover rounded"
                        />
                        <div class="flex-1 min-w-0">
                            <div class="text-sm text-gray-100 truncate">{{ displayTitle(anime) }}</div>
                            <div class="text-xs text-gray-500">{{ anime.format }} &middot; {{ anime.episodes ? `${anime.episodes} eps` : 'Ongoing' }}</div>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Items list -->
            <div class="space-y-2">
                <div
                    v-for="(item, index) in items"
                    :key="item.id"
                    class="bg-gray-900 border border-gray-800 rounded-lg p-3"
                >
                    <div class="flex items-center gap-3">
                        <!-- Reorder buttons -->
                        <div class="flex flex-col gap-0.5">
                            <button
                                class="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs"
                                :disabled="index === 0"
                                @click="moveItem(index, 'up')"
                            >
                                &#9650;
                            </button>
                            <button
                                class="text-gray-500 hover:text-gray-300 disabled:opacity-30 text-xs"
                                :disabled="index === items.length - 1"
                                @click="moveItem(index, 'down')"
                            >
                                &#9660;
                            </button>
                        </div>

                        <!-- Position -->
                        <span class="text-sm text-gray-500 w-6 text-center">{{ index + 1 }}</span>

                        <!-- Cover -->
                        <img
                            v-if="item.anime.cover_image_medium"
                            :src="item.anime.cover_image_medium"
                            :alt="displayTitle(item.anime)"
                            class="w-10 h-14 object-cover rounded flex-shrink-0"
                        />

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-medium text-gray-100 truncate">{{ displayTitle(item.anime) }}</div>
                            <div class="text-xs text-gray-500">{{ item.anime.format }} &middot; {{ item.anime.episodes ? `${item.anime.episodes} eps` : 'Ongoing' }}</div>
                        </div>

                        <!-- Optional toggle -->
                        <label class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer flex-shrink-0">
                            <input
                                type="checkbox"
                                :checked="item.is_optional"
                                class="rounded border-gray-600"
                                @change="updateItem(item, { is_optional: !item.is_optional })"
                            />
                            Optional
                        </label>

                        <!-- Remove -->
                        <button class="text-gray-500 hover:text-red-400 transition text-sm flex-shrink-0" @click="removeItem(item)">
                            &times;
                        </button>
                    </div>

                    <!-- Note -->
                    <div class="mt-2 ml-14">
                        <input
                            :value="item.note ?? ''"
                            type="text"
                            class="w-full bg-transparent border-0 border-b border-gray-800 text-sm text-gray-400 placeholder-gray-600 focus:border-primary-500 focus:ring-0 px-0 py-1"
                            placeholder="Add a note (e.g. 'Watch after Season 1 episode 12')..."
                            @blur="($event.target as HTMLInputElement).value !== (item.note ?? '') && updateItem(item, { note: ($event.target as HTMLInputElement).value || null })"
                        />
                    </div>
                </div>
            </div>

            <div v-if="items.length === 0" class="text-center py-8 text-gray-500 text-sm">
                Search above to add anime to this playlist.
            </div>
        </template>
    </div>
</template>
