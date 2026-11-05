<script setup lang="ts">
import { computed } from 'vue'

// Card 4272: replaces PrimeVue's ProgressBar (determinate with a % label,
// or indeterminate).
const props = withDefaults(defineProps<{
    value?: number
    mode?: 'determinate' | 'indeterminate'
    showValue?: boolean
}>(), {
    value: 0,
    mode: 'determinate',
    showValue: true,
})

const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
</script>

<template>
    <div
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="mode === 'determinate' ? clamped : undefined"
        class="relative h-5 overflow-hidden rounded-md bg-control-track"
    >
        <div
            v-if="mode === 'determinate'"
            class="absolute inset-y-0 left-0 flex items-center justify-center overflow-hidden bg-control-accent transition-[width] duration-1000 ease-in-out"
            :style="{ width: `${clamped}%` }"
        >
            <span v-if="showValue && clamped > 0" class="text-xs font-semibold leading-5 text-control-on-accent">{{ clamped }}%</span>
        </div>
        <template v-else>
            <div class="app-progress-bar-long absolute inset-y-0 bg-control-accent" />
            <div class="app-progress-bar-short absolute inset-y-0 bg-control-accent" />
        </template>
    </div>
</template>

<style scoped>
/* The same two-bar motion PrimeVue's indeterminate bar uses. */
.app-progress-bar-long {
    animation: app-progress-long 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
}

.app-progress-bar-short {
    animation: app-progress-short 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
}

@keyframes app-progress-long {
    0% { left: -35%; right: 100%; }
    60% { left: 100%; right: -90%; }
    100% { left: 100%; right: -90%; }
}

@keyframes app-progress-short {
    0% { left: -200%; right: 100%; }
    60% { left: 107%; right: -8%; }
    100% { left: 107%; right: -8%; }
}

@media (prefers-reduced-motion: reduce) {
    .app-progress-bar-long {
        animation: none;
        left: 0;
        right: 0;
        opacity: 0.6;
    }

    .app-progress-bar-short {
        display: none;
    }
}
</style>
