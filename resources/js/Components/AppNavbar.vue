<script setup lang="ts">
import { ref } from 'vue'
import { router } from '@inertiajs/vue3'
import type { User } from '@/types'
import UserAvatar from '@/Components/UserAvatar.vue'
import { useFeature } from '@/composables/useFeature'

defineProps<{
    user: User | null
    isAuthenticated: boolean
}>()

const showPlaylists = useFeature('playlists')
const showDropdown = ref(false)

function closeDropdown() {
    setTimeout(() => { showDropdown.value = false }, 150)
}

function handleLogout() {
    router.post(route('logout'))
}
</script>

<template>
    <nav class="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div class="container mx-auto px-4 flex items-center justify-between h-16">
            <div class="flex items-center gap-6">
                <Link :href="route('home')" class="text-xl font-bold text-primary-400">AniTrack</Link>
                <div class="hidden md:flex items-center gap-4">
                    <Link :href="route('seasonal')" class="text-gray-400 hover:text-gray-100 transition">Seasonal</Link>
                    <Link :href="route('schedule')" class="text-gray-400 hover:text-gray-100 transition">Schedule</Link>
                    <Link :href="route('top.rated')" class="text-gray-400 hover:text-gray-100 transition">Top</Link>
                    <Link :href="route('anime.index')" class="text-gray-400 hover:text-gray-100 transition">Browse</Link>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <template v-if="isAuthenticated && user">
                    <Link :href="route('list')" class="text-gray-400 hover:text-gray-100 transition">My List</Link>
                    <Link v-if="showPlaylists" :href="route('playlists.index')" class="text-gray-400 hover:text-gray-100 transition">Playlists</Link>
                    <div class="relative">
                        <button
                            class="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition"
                            @click="showDropdown = !showDropdown"
                            @blur="closeDropdown"
                        >
                            <UserAvatar :name="user.name" :avatar-url="user.avatar_url" size="sm" />
                            <span class="hidden sm:inline">{{ user.name }}</span>
                        </button>
                        <div
                            v-if="showDropdown"
                            class="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1"
                        >
                            <Link
                                :href="route('profile.show', { user: user.username })"
                                class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100"
                            >
                                Profile
                            </Link>
                            <Link
                                :href="route('settings')"
                                class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-gray-100"
                            >
                                Settings
                            </Link>
                            <!-- A full page load (card 5710): admin route names are only in
                                 the route list of a page loaded as an admin. -->
                            <a
                                v-if="user.is_admin"
                                href="/admin"
                                class="block px-4 py-2 text-sm text-primary-400 hover:bg-gray-800 hover:text-primary-300"
                            >
                                Admin
                            </a>
                            <hr class="border-gray-700 my-1" />
                            <button
                                class="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                                @click="handleLogout"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <Link :href="route('login')" class="text-gray-400 hover:text-gray-100 transition">Login</Link>
                    <Link :href="route('register')" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition text-sm">Sign Up</Link>
                </template>
            </div>
        </div>
    </nav>
</template>
