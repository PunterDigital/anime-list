<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import type { AnimeCard, ListEntryResource } from '@/types'
import { LIST_STATUS_LABELS } from '@/types'
import ListEntryModal from '@/Components/ListEntryModal.vue'
import AppButton from '@/Components/ui/AppButton.vue'

const props = defineProps<{
    anime: AnimeCard
    initialEntry: ListEntryResource | null
}>()

const toast = useToast()
const showModal = ref(false)
const currentEntry = ref<ListEntryResource | null>(props.initialEntry)

function onSaved(entry: ListEntryResource) {
    showModal.value = false
    const isNew = !currentEntry.value
    currentEntry.value = entry
    toast.add({
        severity: 'success',
        summary: isNew ? 'Added to List' : 'List Updated',
        detail: `${props.anime.title_english || props.anime.title_romaji} — ${LIST_STATUS_LABELS[entry.status]}`,
        life: 3000,
    })
}

function onDeleted() {
    showModal.value = false
    currentEntry.value = null
    toast.add({
        severity: 'info',
        summary: 'Removed from List',
        detail: props.anime.title_english || props.anime.title_romaji,
        life: 3000,
    })
}
</script>

<template>
    <div>
        <AppButton
            v-if="!currentEntry"
            label="Add to List"
            size="small"
            @click="showModal = true"
        />
        <button
            v-else
            class="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-200 transition hover:bg-gray-700"
            @click="showModal = true"
        >
            <span>{{ LIST_STATUS_LABELS[currentEntry.status] }}</span>
            <svg class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
        </button>

        <ListEntryModal
            v-if="showModal"
            :anime="anime"
            :entry="currentEntry"
            @close="showModal = false"
            @saved="onSaved"
            @deleted="onDeleted"
        />
    </div>
</template>
