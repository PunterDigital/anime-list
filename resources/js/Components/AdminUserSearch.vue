<script setup lang="ts">
import { ref, watch } from 'vue'
import { http } from '@/lib/http'
import UserAvatar from '@/Components/UserAvatar.vue'
import { useDebounce } from '@/composables/useDebounce'

interface SearchUser {
    id: number
    name: string
    username: string
    avatar_url: string | null
}

const props = withDefaults(defineProps<{
    placeholder?: string
    excludeIds?: number[]
}>(), {
    placeholder: 'Search by username or name',
    excludeIds: () => [],
})

const emit = defineEmits<{
    (e: 'select', user: SearchUser): void
}>()

const query = ref('')
const debouncedQuery = useDebounce(query, 200)
const results = ref<SearchUser[]>([])
const loading = ref(false)
const open = ref(false)
const activeIndex = ref(-1)

watch(debouncedQuery, async (value) => {
    const term = value.trim()
    if (term === '') {
        results.value = []
        loading.value = false
        return
    }

    loading.value = true
    try {
        const { data } = await http.get<{ data: SearchUser[] }>(route('admin.users.search'), {
            params: { q: term },
        })
        results.value = data.data.filter(u => !props.excludeIds.includes(u.id))
        activeIndex.value = results.value.length > 0 ? 0 : -1
    } catch {
        results.value = []
    } finally {
        loading.value = false
    }
})

function handleSelect(user: SearchUser) {
    emit('select', user)
    query.value = ''
    results.value = []
    open.value = false
    activeIndex.value = -1
}

function onFocus() {
    open.value = true
}

function onBlur() {
    setTimeout(() => { open.value = false }, 120)
}

function onKeyDown(e: KeyboardEvent) {
    if (!open.value || results.value.length === 0) return

    if (e.key === 'ArrowDown') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % results.value.length
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        activeIndex.value = activeIndex.value <= 0
            ? results.value.length - 1
            : activeIndex.value - 1
    } else if (e.key === 'Enter') {
        e.preventDefault()
        const user = results.value[activeIndex.value]
        if (user) handleSelect(user)
    } else if (e.key === 'Escape') {
        open.value = false
    }
}

defineExpose({ clear: () => { query.value = '' } })
</script>

<template>
    <div class="relative">
        <input
            v-model="query"
            type="text"
            :placeholder="placeholder"
            class="w-full rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-gray-300"
            @focus="onFocus"
            @blur="onBlur"
            @keydown="onKeyDown"
        />

        <div
            v-if="open && query.trim().length > 0"
            class="absolute left-0 right-0 top-full mt-1 z-20 max-h-72 overflow-y-auto rounded border border-gray-700 bg-gray-900 shadow-lg"
        >
            <div v-if="loading" class="px-3 py-2 text-xs text-gray-500">
                Searching…
            </div>
            <div v-else-if="results.length === 0" class="px-3 py-2 text-xs text-gray-500">
                No users found
            </div>
            <ul v-else class="divide-y divide-gray-800">
                <li
                    v-for="(user, i) in results"
                    :key="user.id"
                    class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition"
                    :class="i === activeIndex ? 'bg-gray-800' : 'hover:bg-gray-800/60'"
                    @mousedown.prevent="handleSelect(user)"
                    @mouseenter="activeIndex = i"
                >
                    <UserAvatar :name="user.name" :avatar-url="user.avatar_url" size="sm" />
                    <div class="min-w-0 flex-1">
                        <div class="text-gray-200 truncate">{{ user.name }}</div>
                        <div class="text-xs text-gray-500 truncate">&#64;{{ user.username }}</div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
