<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useListMutations } from '@/composables/useListMutations'
import type { AnimeCard, ListEntryResource, ListStatus } from '@/types'
import { LIST_STATUS_LABELS } from '@/types'
import AppDialog from '@/Components/ui/AppDialog.vue'
import AppSelect from '@/Components/ui/AppSelect.vue'
import AppSlider from '@/Components/ui/AppSlider.vue'
import AppInputText from '@/Components/ui/AppInputText.vue'
import AppTextarea from '@/Components/ui/AppTextarea.vue'
import AppButton from '@/Components/ui/AppButton.vue'

const props = defineProps<{
    anime: AnimeCard
    entry: ListEntryResource | null
}>()

const emit = defineEmits<{
    close: []
    saved: [entry: ListEntryResource]
    deleted: []
}>()

const visible = ref(true)

const statusOptions = Object.entries(LIST_STATUS_LABELS).map(([value, label]) => ({ value, label }))

const status = ref<ListStatus>(props.entry?.status ?? 'plan_to_watch')
const displayScore = ref<number>(props.entry?.display_score ?? 0)
const progress = ref<number>(props.entry?.progress ?? 0)
const startedAt = ref<string>(props.entry?.started_at ?? '')
const completedAt = ref<string>(props.entry?.completed_at ?? '')
const notes = ref<string>(props.entry?.notes ?? '')
const showNotes = ref(!!props.entry?.notes)

const toast = useToast()
const { storeMutation, updateMutation, destroyMutation } = useListMutations()

const saving = computed(() => storeMutation.isPending.value || updateMutation.isPending.value)

function save() {
    const score = displayScore.value > 0 ? displayScore.value : null
    const payload = {
        status: status.value,
        score,
        progress: progress.value,
        started_at: startedAt.value || null,
        completed_at: completedAt.value || null,
        notes: notes.value || null,
    }

    const onError = () => {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save. Please try again.',
            life: 4000,
        })
    }

    if (props.entry) {
        updateMutation.mutate(
            { id: props.entry.id, ...payload },
            { onSuccess: (data) => emit('saved', data), onError },
        )
    } else {
        storeMutation.mutate(
            { anime_id: props.anime.id!, ...payload },
            { onSuccess: (data) => emit('saved', data), onError },
        )
    }
}

function remove() {
    if (!props.entry) return
    destroyMutation.mutate(props.entry.id, {
        onSuccess: () => emit('deleted'),
        onError: () => {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to remove. Please try again.',
                life: 4000,
            })
        },
    })
}

function close() {
    visible.value = false
    emit('close')
}

const displayTitle = computed(() => props.anime.title_english || props.anime.title_romaji)
</script>

<template>
    <AppDialog
        :visible="visible"
        :header="entry ? 'Edit Entry' : 'Add to List'"
        class="w-full max-w-lg"
        @update:visible="(v) => { if (!v) close() }"
    >
        <div class="space-y-4">
            <p class="text-sm text-gray-400">{{ displayTitle }}</p>

            <div>
                <label class="block text-sm text-gray-400 mb-1">Status</label>
                <AppSelect
                    v-model="status"
                    aria-label="Status"
                    :options="statusOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                />
            </div>

            <div>
                <label class="block text-sm text-gray-400 mb-1">
                    Score: {{ displayScore > 0 ? displayScore : '-' }}
                </label>
                <AppSlider
                    v-model="displayScore"
                    aria-label="Score"
                    :min="0"
                    :max="10"
                    :step="1"
                    class="w-full"
                />
            </div>

            <div>
                <label class="block text-sm text-gray-400 mb-1">
                    Progress
                </label>
                <div class="flex items-center gap-2">
                    <input
                        v-model.number="progress"
                        type="number"
                        min="0"
                        class="w-20 rounded border border-gray-700 bg-gray-800 px-2 py-1.5 text-gray-200 text-sm"
                    />
                    <span class="text-gray-500">/ {{ anime.episodes ?? '?' }}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Start Date</label>
                    <AppInputText
                        v-model="startedAt"
                        type="date"
                        class="w-full"
                    />
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Finish Date</label>
                    <AppInputText
                        v-model="completedAt"
                        type="date"
                        class="w-full"
                    />
                </div>
            </div>

            <div>
                <button
                    v-if="!showNotes"
                    class="text-sm text-gray-500 hover:text-gray-300 transition"
                    @click="showNotes = true"
                >
                    + Add Notes
                </button>
                <div v-else>
                    <label class="block text-sm text-gray-400 mb-1">Notes</label>
                    <AppTextarea v-model="notes" rows="2" class="w-full" />
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center justify-between w-full">
                <AppButton
                    v-if="entry"
                    label="Remove"
                    severity="danger"
                    text
                    size="small"
                    @click="remove"
                />
                <span v-else />
                <div class="flex gap-2">
                    <AppButton label="Cancel" severity="secondary" text @click="close" />
                    <AppButton label="Save" :loading="saving" @click="save" />
                </div>
            </div>
        </template>
    </AppDialog>
</template>
