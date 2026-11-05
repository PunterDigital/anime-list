<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSplitAttrs } from './splitAttrs'

// Card 4272: replaces PrimeVue's single-value Slider. The handle is the
// role="slider" element: arrows step, PageUp/PageDown move ten steps,
// Home/End jump to the ends; a click or drag on the track sets the value.
// `class`/`style` go on the track, other attributes (aria-label) on the handle.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
    min?: number
    max?: number
    step?: number
    disabled?: boolean
}>(), { min: 0, max: 100, step: 1, disabled: false })

const model = defineModel<number>({ default: 0 })
const { rootClass, rootStyle, controlAttrs } = useSplitAttrs()

const track = ref<HTMLElement | null>(null)
const dragging = ref(false)

const percent = computed(() => {
    const span = props.max - props.min
    if (span <= 0) return 0
    return ((Math.min(props.max, Math.max(props.min, model.value)) - props.min) / span) * 100
})

function setValue(value: number) {
    const stepped = Math.round((value - props.min) / props.step) * props.step + props.min
    const clamped = Math.min(props.max, Math.max(props.min, stepped))
    // Avoid 0.30000000000000004 for fractional steps.
    const rounded = Number(clamped.toFixed(10))
    if (rounded !== model.value) model.value = rounded
}

function valueAt(clientX: number): number {
    const rect = track.value!.getBoundingClientRect()
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0
    return props.min + Math.min(1, Math.max(0, ratio)) * (props.max - props.min)
}

function onPointerDown(event: PointerEvent) {
    if (props.disabled || event.button !== 0) return
    event.preventDefault()
    dragging.value = true
    track.value?.setPointerCapture(event.pointerId)
    setValue(valueAt(event.clientX))
    track.value?.querySelector<HTMLElement>('[role="slider"]')?.focus()
}

function onPointerMove(event: PointerEvent) {
    if (dragging.value) setValue(valueAt(event.clientX))
}

function onPointerUp(event: PointerEvent) {
    dragging.value = false
    if (track.value?.hasPointerCapture(event.pointerId)) track.value.releasePointerCapture(event.pointerId)
}

function onKeydown(event: KeyboardEvent) {
    if (props.disabled) return
    const big = props.step * 10
    const moves: Record<string, number> = {
        ArrowRight: model.value + props.step,
        ArrowUp: model.value + props.step,
        ArrowLeft: model.value - props.step,
        ArrowDown: model.value - props.step,
        PageUp: model.value + big,
        PageDown: model.value - big,
        Home: props.min,
        End: props.max,
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    setValue(moves[event.key]!)
}
</script>

<template>
    <div
        ref="track"
        data-ui="slider"
        class="relative h-[3px] touch-none rounded-md bg-control-track"
        :class="[disabled ? 'opacity-60' : 'cursor-pointer', rootClass]"
        :style="rootStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
    >
        <span data-ui="slider-range" class="absolute left-0 top-0 block h-full rounded-md bg-control-accent" :style="{ width: `${percent}%` }" />
        <span
            v-bind="controlAttrs"
            data-ui="slider-handle"
            role="slider"
            :tabindex="disabled ? -1 : 0"
            :aria-valuemin="min"
            :aria-valuemax="max"
            :aria-valuenow="model"
            aria-orientation="horizontal"
            :aria-disabled="disabled || undefined"
            class="group absolute top-1/2 -ml-2.5 -mt-2.5 flex size-5 items-center justify-center rounded-full bg-control-track outline-none transition-[background-color,color,border-color,outline-color,box-shadow] duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-control-accent"
            :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
            :style="{ left: `${percent}%` }"
            @keydown="onKeydown"
        >
            <span
                aria-hidden="true"
                class="size-4 rounded-full bg-control-field shadow-[0_0.5px_0_0_rgba(0,0,0,0.08),0_1px_1px_0_rgba(0,0,0,0.14)] transition-colors duration-200 group-hover:bg-control-overlay"
            />
        </span>
    </div>
</template>
