<script setup lang="ts">
import { useSplitAttrs } from './splitAttrs'

// Card 4272: replaces PrimeVue's ToggleSwitch. A native checkbox with
// role="switch" does the keyboard (Space) and screen-reader part; `class`
// goes on the outer box, every other attribute (aria-label, id, disabled)
// on the checkbox.
defineOptions({ inheritAttrs: false })

const model = defineModel<boolean>({ default: false })
const { rootClass, rootStyle, controlAttrs } = useSplitAttrs()
</script>

<template>
    <span class="group relative inline-block h-6 w-10 shrink-0 align-middle" :class="rootClass" :style="rootStyle">
        <input
            v-bind="controlAttrs"
            v-model="model"
            type="checkbox"
            role="switch"
            :aria-checked="model"
            class="peer absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-[30px] p-0 opacity-0 disabled:cursor-default"
        />
        <span
            aria-hidden="true"
            class="absolute inset-0 rounded-[30px] border border-transparent bg-control-track shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] transition-[background-color,color,border-color,outline-color,box-shadow] duration-200 group-hover:bg-control-track-hover peer-checked:bg-control-accent group-hover:peer-checked:bg-control-accent-hover peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-control-accent peer-disabled:opacity-60"
        />
        <span
            aria-hidden="true"
            class="pointer-events-none absolute left-1 top-1/2 -mt-2 size-4 rounded-full bg-control-muted transition-all duration-200 group-hover:bg-control-knob-hover peer-checked:left-5 peer-checked:bg-control-on-accent group-hover:peer-checked:bg-control-on-accent"
        />
    </span>
</template>
