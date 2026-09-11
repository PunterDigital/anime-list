<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useFeature } from '@/composables/useFeature'

/**
 * Horizontal AdSense bar. Google has no 1200x90 unit, so this is a responsive
 * horizontal unit inside a 1200px-wide container with a 90px floor: it fills
 * the bar on desktop and shrinks to a smaller banner on narrow screens.
 */
const page = usePage<{ adsense: { client: string | null, slot: string | null } }>()
const adsEnabled = useFeature('ads')

const client = computed(() => page.props.adsense?.client ?? null)
const slot = computed(() => page.props.adsense?.slot ?? null)
const visible = computed(() => adsEnabled.value && !!client.value && !!slot.value)

// Forces a fresh <ins> element on every Inertia page change, because AdSense
// refuses to fill a slot it has already filled.
const insKey = ref(0)

function requestAd() {
    if (!visible.value || typeof window === 'undefined') {
        return
    }

    try {
        const w = window as Window & { adsbygoogle?: unknown[] }
        w.adsbygoogle = w.adsbygoogle || []
        w.adsbygoogle.push({})
    } catch {
        // An ad blocker or a failed loader script must not break the page.
    }
}

onMounted(() => requestAd())

watch(
    () => page.url,
    async () => {
        if (!visible.value) {
            return
        }

        insKey.value++
        await nextTick()
        requestAd()
    },
)
</script>

<template>
    <div v-if="visible" class="container mx-auto px-4">
        <div class="mx-auto w-full max-w-[1200px]">
            <ins
                :key="insKey"
                class="adsbygoogle block min-h-[90px] w-full"
                style="display: block"
                :data-ad-client="client"
                :data-ad-slot="slot"
                data-ad-format="horizontal"
                data-full-width-responsive="true"
            />
        </div>
    </div>
</template>
