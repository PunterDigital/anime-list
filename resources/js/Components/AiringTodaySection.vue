<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import type { ScheduleSlot, ScheduleAnime } from '@/types/schedule'
import { useCountdown } from '@/composables/useCountdown'
import ScoreBadge from '@/Components/ScoreBadge.vue'

const props = defineProps<{
    slots: ScheduleSlot[]
}>()

const page = usePage<{ auth: { user: import('@/types').User | null } }>()
const timezone = computed(() => page.props.auth?.user?.timezone)
const { formatCountdown, formatLocalTime } = useCountdown()

type ValidSlot = ScheduleSlot & { anime: ScheduleAnime }
const validSlots = computed(() => props.slots.filter((s): s is ValidSlot => s.anime !== null))

function displayTitle(slot: ValidSlot): string {
    return slot.anime.title_english || slot.anime.title_romaji || 'Unknown'
}
</script>

<template>
    <section v-if="validSlots.length">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-100">Airing Today from Your List</h2>
            <Link :href="route('schedule')" class="text-sm text-primary-400 hover:text-primary-300 transition">
                Full Schedule &rarr;
            </Link>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
                v-for="slot in validSlots"
                :key="slot.id"
                :href="slot.anime.slug ? route('anime.show', { anime: slot.anime.slug }) : '#'"
                class="group flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/50 p-3 transition hover:border-gray-700"
            >
                <div class="h-16 w-11 shrink-0 overflow-hidden rounded-md bg-gray-800">
                    <img
                        v-if="slot.anime.cover_image_medium"
                        :src="slot.anime.cover_image_medium"
                        :alt="displayTitle(slot)"
                        class="h-full w-full object-cover"
                        loading="lazy"
                    />
                </div>
                <div class="min-w-0 flex-1">
                    <p class="line-clamp-1 text-sm font-medium text-gray-200 group-hover:text-primary-400 transition">
                        {{ displayTitle(slot) }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-500">
                        Episode {{ slot.episode }} &middot; {{ formatLocalTime(slot.airs_at, timezone) }}
                    </p>
                    <p class="text-xs font-semibold text-primary-400">
                        {{ formatCountdown(slot.airs_at) }}
                    </p>
                </div>
                <ScoreBadge :score="slot.anime.average_score" size="sm" />
            </Link>
        </div>
    </section>
</template>
