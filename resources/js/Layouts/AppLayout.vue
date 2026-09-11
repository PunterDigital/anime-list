<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import AppNavbar from '@/Components/AppNavbar.vue'
import AppFooter from '@/Components/AppFooter.vue'
import AdBanner from '@/Components/AdBanner.vue'
import Toast from 'primevue/toast'
import { useFlashToast } from '@/composables/useFlashToast'

const page = usePage<{ auth: { user: import('@/types').User | null } }>()
const user = computed(() => page.props.auth.user)
const isAuthenticated = computed(() => !!user.value)

useFlashToast()
</script>

<template>
    <div class="min-h-screen bg-gray-950 text-gray-100 dark">
        <AppNavbar :user="user" :is-authenticated="isAuthenticated" />
        <main class="container mx-auto px-4 py-6">
            <slot />
        </main>
        <AdBanner />
        <AppFooter />
        <Toast position="top-right" />
    </div>
</template>
