<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import AdminNav from '@/Components/AdminNav.vue'
import AdminUserSearch from '@/Components/AdminUserSearch.vue'
import UserAvatar from '@/Components/UserAvatar.vue'
import { http } from '@/lib/http'

defineOptions({ layout: AppLayout })

interface RoleUser {
    id: number
    name: string
    username: string
    avatar_url: string | null
}

interface Role {
    id: number
    slug: string
    name: string
    description: string | null
    users: RoleUser[]
}

defineProps<{
    roles: Role[]
}>()

async function assignUser(roleSlug: string, user: RoleUser) {
    await http.post(route('admin.roles.assign', { role: roleSlug }), {
        username: user.username,
    })
    router.visit(route('admin.roles'), { preserveScroll: true })
}

async function removeUser(roleSlug: string, userId: number) {
    await http.delete(route('admin.roles.remove', { role: roleSlug, user: userId }))
    router.visit(route('admin.roles'), { preserveScroll: true })
}
</script>

<template>
    <Head title="Roles" />
    <div class="mx-auto max-w-6xl">
        <AdminNav />
        <h1 class="text-2xl font-bold mb-2">Roles</h1>
        <p class="text-sm text-gray-500 mb-6">
            Assign users to roles. Features are gated by role name.
        </p>

        <div v-if="roles.length === 0" class="text-center py-12 text-gray-500">
            No roles defined.
        </div>

        <div v-else class="space-y-4">
            <div
                v-for="role in roles"
                :key="role.id"
                class="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h2 class="font-semibold text-gray-100">{{ role.name }}</h2>
                        <span class="text-xs font-mono text-gray-500">{{ role.slug }}</span>
                        <p v-if="role.description" class="text-xs text-gray-400 mt-1">
                            {{ role.description }}
                        </p>
                    </div>
                </div>

                <div class="border-t border-gray-800 pt-3 space-y-3">
                    <div>
                        <div class="text-xs text-gray-500 mb-1">Assign a user</div>
                        <AdminUserSearch
                            :exclude-ids="role.users.map(u => u.id)"
                            placeholder="Search by username or name"
                            @select="(user) => assignUser(role.slug, user)"
                        />
                    </div>

                    <div>
                        <div class="text-xs text-gray-500 mb-2">Assigned users</div>
                        <div v-if="role.users.length > 0" class="flex flex-wrap gap-2">
                            <div
                                v-for="user in role.users"
                                :key="user.id"
                                class="flex items-center gap-2 rounded-full bg-gray-800 pl-1.5 pr-1.5 py-1 text-xs"
                            >
                                <UserAvatar :name="user.name" :avatar-url="user.avatar_url" size="sm" />
                                <div class="leading-tight pr-1">
                                    <div class="text-gray-200">{{ user.name }}</div>
                                    <div class="text-[10px] text-gray-500">&#64;{{ user.username }}</div>
                                </div>
                                <button
                                    class="text-gray-500 hover:text-red-400 transition rounded-full p-0.5"
                                    :aria-label="`Remove ${user.username}`"
                                    @click="removeUser(role.slug, user.id)"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                        <p v-else class="text-xs text-gray-600">No users assigned</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
