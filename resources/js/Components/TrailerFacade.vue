<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { Trailer } from '@/lib/trailer'

// Card 5704: the trailer is the anime page's first tab, so an <iframe> there
// loaded YouTube's player (~1 MB of JS, seconds of main-thread work on phones)
// on every visit. This shows the thumbnail and a play button, and swaps in the
// player (autoplaying) only when it's pressed. Server and browser render the
// same facade, so SSR hydration agrees.
const props = defineProps<{
    trailer: Trailer
    title: string
}>()

const playing = ref(false)
const player = ref<HTMLIFrameElement | null>(null)

async function play() {
    playing.value = true
    await nextTick()
    player.value?.focus()
}
</script>

<template>
    <div class="relative aspect-video overflow-hidden rounded-xl border border-gray-800 bg-gray-900" data-ui="trailer">
        <iframe
            v-if="playing"
            ref="player"
            :src="props.trailer.embedUrl"
            :title="`${props.title} trailer`"
            class="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowfullscreen
            data-ui="trailer-player"
        />
        <button
            v-else
            type="button"
            class="group absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-400"
            :aria-label="`Play the ${props.title} trailer`"
            data-ui="trailer-play"
            @click="play"
        >
            <img
                v-if="props.trailer.thumbnailUrl"
                :src="props.trailer.thumbnailUrl"
                alt=""
                width="480"
                height="360"
                loading="lazy"
                decoding="async"
                class="absolute inset-0 h-full w-full object-cover"
            />
            <span class="relative flex size-16 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition group-hover:scale-105 group-hover:bg-red-600 group-focus-visible:bg-red-600">
                <svg viewBox="0 0 24 24" class="ml-1 size-8" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l10.6-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z" />
                </svg>
            </span>
        </button>
    </div>
</template>
