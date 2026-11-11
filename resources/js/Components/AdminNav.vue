<script setup lang="ts">
import { usePage } from '@inertiajs/vue3'
import { computed } from 'vue'

const page = usePage()
const currentUrl = computed(() => page.url)

const links = [
    { label: 'Dashboard', route: 'admin.dashboard' },
    { label: 'Users', route: 'admin.users' },
    { label: 'Roles', route: 'admin.roles' },
    { label: 'Anime', route: 'admin.anime.index' },
    { label: 'Blog', route: 'admin.blog.index' },
    { label: 'Jobs', route: 'admin.jobs' },
    { label: 'Feature Flags', route: 'admin.features' },
]

function isActive(routeName: string): boolean {
    return currentUrl.value.startsWith(route(routeName))
}
</script>

<template>
    <nav class="flex items-center gap-1 mb-6 border-b border-gray-800 pb-3">
        <Link
            v-for="link in links"
            :key="link.route"
            :href="route(link.route)"
            class="rounded-lg px-3 py-1.5 text-sm transition"
            :class="isActive(link.route)
                ? 'bg-gray-800 text-gray-100 font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'"
        >
            {{ link.label }}
        </Link>
    </nav>
</template>
