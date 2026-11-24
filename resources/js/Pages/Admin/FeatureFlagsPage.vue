<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'
import AdminUserSearch from '@/Components/AdminUserSearch.vue'
import { http } from '@/lib/http'

defineOptions({ layout: AppLayout })

interface FeatureUser {
    user_id: number
    username: string
    name: string
    active: boolean
}

interface FeatureFlag {
    name: string
    status: 'everyone' | 'nobody' | 'default' | 'specific'
    users: FeatureUser[]
}

defineProps<{
    features: FeatureFlag[]
}>()

async function setStatus(feature: string, status: 'everyone' | 'nobody' | 'default') {
    await http.patch(route('admin.features.update', { feature }), { status })
    router.visit(route('admin.features'), { preserveScroll: true })
}

async function addUser(feature: string, username: string) {
    await http.post(route('admin.features.activate-user', { feature }), { username })
    router.visit(route('admin.features'), { preserveScroll: true })
}

async function removeUser(feature: string, userId: number) {
    await http.delete(route('admin.features.deactivate-user', { feature, user: userId }))
    router.visit(route('admin.features'), { preserveScroll: true })
}

const statusLabels: Record<string, string> = {
    everyone: 'Everyone',
    nobody: 'Nobody',
    default: 'Default (Off)',
    specific: 'Specific Users',
}

const statusColors: Record<string, string> = {
    everyone: 'text-green-400',
    nobody: 'text-red-400',
    default: 'text-gray-500',
    specific: 'text-yellow-400',
}
</script>

<template>
    <Head title="Feature Flags" />
    <div class="mx-auto max-w-6xl">
        <AdminNav />
        <h1 class="text-2xl font-bold mb-6">Feature Flags</h1>

        <div v-if="features.length === 0" class="text-center py-12 text-gray-500">
            No feature flags defined.
        </div>

        <div v-else class="space-y-4">
            <div
                v-for="feature in features"
                :key="feature.name"
                class="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h2 class="font-semibold text-gray-100 font-mono">{{ feature.name }}</h2>
                        <span class="text-xs" :class="statusColors[feature.status]">
                            {{ statusLabels[feature.status] }}
                        </span>
                    </div>
                    <div class="flex gap-1">
                        <button
                            class="rounded px-3 py-1.5 text-xs transition border"
                            :class="feature.status === 'everyone'
                                ? 'border-green-500 bg-green-600/20 text-green-400'
                                : 'border-gray-700 text-gray-400 hover:text-gray-200'"
                            @click="setStatus(feature.name, 'everyone')"
                        >
                            Everyone
                        </button>
                        <button
                            class="rounded px-3 py-1.5 text-xs transition border"
                            :class="feature.status === 'nobody'
                                ? 'border-red-500 bg-red-600/20 text-red-400'
                                : 'border-gray-700 text-gray-400 hover:text-gray-200'"
                            @click="setStatus(feature.name, 'nobody')"
                        >
                            Nobody
                        </button>
                        <button
                            class="rounded px-3 py-1.5 text-xs transition border"
                            :class="feature.status === 'default'
                                ? 'border-gray-500 bg-gray-600/20 text-gray-300'
                                : 'border-gray-700 text-gray-400 hover:text-gray-200'"
                            @click="setStatus(feature.name, 'default')"
                        >
                            Default
                        </button>
                    </div>
                </div>

                <!-- Per-user overrides -->
                <div class="border-t border-gray-800 pt-3 space-y-3">
                    <div>
                        <div class="text-xs text-gray-500 mb-1">Add a user override</div>
                        <AdminUserSearch
                            :exclude-ids="feature.users.map(u => u.user_id)"
                            placeholder="Search by username or name"
                            @select="(user) => addUser(feature.name, user.username)"
                        />
                    </div>

                    <div>
                        <div class="text-xs text-gray-500 mb-2">User overrides</div>
                        <div v-if="feature.users.length > 0" class="flex flex-wrap gap-2">
                            <div
                                v-for="user in feature.users"
                                :key="user.user_id"
                                class="flex items-center gap-1.5 rounded-full bg-gray-800 pl-3 pr-1.5 py-1 text-xs"
                            >
                                <span class="text-gray-300">{{ user.username }}</span>
                                <button
                                    class="text-gray-500 hover:text-red-400 transition rounded-full p-0.5"
                                    :aria-label="`Remove ${user.username}`"
                                    @click="removeUser(feature.name, user.user_id)"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                        <p v-else class="text-xs text-gray-600">No user-specific overrides</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
