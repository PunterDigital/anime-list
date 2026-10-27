<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import type { ScheduleSlot, ScheduleAnime } from '@/types/schedule'
import { useCountdown } from '@/composables/useCountdown'
import ScoreBadge from '@/Components/ScoreBadge.vue'

const props = defineProps<{
    utcDate: string
    slots: ScheduleSlot[]
    isToday: boolean
}>()

const page = usePage<{ auth: { user: import('@/types').User | null } }>()
const timezone = computed(() => page.props.auth?.user?.timezone)

const { formatCountdown, formatLocalTime, formatLocalDate } = useCountdown()

const dayLabel = computed(() => {
    if (!props.slots.length) {
        return new Date(props.utcDate + 'T12:00:00Z').toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: timezone.value,
        })
    }
    return formatLocalDate(props.slots[0].airs_at, timezone.value)
})

type ValidSlot = ScheduleSlot & { anime: ScheduleAnime }
const validSlots = computed(() => props.slots.filter((s): s is ValidSlot => s.anime !== null))

function displayTitle(slot: ValidSlot): string {
    return slot.anime.title_english || slot.anime.title_romaji || 'Unknown'
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div
            class="rounded-lg px-3 py-2 text-center text-sm font-semibold"
            :class="isToday
                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/40'
                : 'bg-gray-900 text-gray-400'"
        >
            {{ dayLabel }}
            <span v-if="isToday" class="ml-1 text-xs">(Today)</span>
        </div>

        <div v-if="validSlots.length" class="space-y-2">
            <Link
                v-for="slot in validSlots"
                :key="slot.id"
                :href="slot.anime.slug ? route('anime.show', { anime: slot.anime.slug }) : '#'"
                class="group flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 p-2 transition hover:border-gray-700 hover:bg-gray-900"
            >
                <div class="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-gray-800">
                    <img
                        v-if="slot.anime.cover_image_medium"
                        :src="slot.anime.cover_image_medium"
                        :alt="displayTitle(slot)"
                        class="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>
                <div class="min-w-0 flex-1">
                    <p class="line-clamp-2 text-xs font-medium text-gray-200 group-hover:text-primary-400 transition">
                        {{ displayTitle(slot) }}
                    </p>
                    <p class="mt-0.5 text-[10px] text-gray-500">
                        EP {{ slot.episode }} &middot; {{ formatLocalTime(slot.airs_at, timezone) }}
                    </p>
                    <p class="text-[10px] font-medium text-primary-400">
                        {{ formatCountdown(slot.airs_at) }}
                    </p>
                </div>
                <ScoreBadge :score="slot.anime.average_score" size="sm" class="shrink-0" />
            </Link>
        </div>

        <div v-else class="rounded-lg border border-gray-800/50 py-6 text-center text-xs text-gray-600">
            No episodes
        </div>
    </div>
</template>
