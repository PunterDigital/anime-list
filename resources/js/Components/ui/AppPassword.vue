<script setup lang="ts">
import { ref } from 'vue'
import { fieldClasses } from './fieldClasses'
import { useSplitAttrs } from './splitAttrs'

// Card 4272: replaces PrimeVue's Password (AniTrack used it with
// :feedback="false" and toggle-mask only). The show/hide control is a real
// button with a label, where PrimeVue's eye icon could only be clicked.
// `class` goes on the wrapper, every other attribute on the input.
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
    invalid?: boolean
    toggleMask?: boolean
    inputClass?: string
}>(), {
    invalid: false,
    toggleMask: false,
    inputClass: undefined,
})

const model = defineModel<string | null | undefined>()
const visible = ref(false)
const { rootClass, rootStyle, controlAttrs } = useSplitAttrs()
</script>

<template>
    <div class="relative inline-flex" :class="rootClass" :style="rootStyle">
        <input
            v-bind="controlAttrs"
            v-model="model"
            :type="visible ? 'text' : 'password'"
            :class="[fieldClasses(invalid), 'block', toggleMask ? 'pr-10' : '', inputClass]"
            :aria-invalid="invalid || undefined"
        />
        <button
            v-if="toggleMask"
            type="button"
            class="absolute right-3 top-1/2 -mt-2 flex size-4 cursor-pointer items-center justify-center rounded-sm text-control-muted focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-control-accent"
            :aria-label="visible ? 'Hide password' : 'Show password'"
            :aria-pressed="visible"
            @click="visible = !visible"
        >
            <svg v-if="!visible" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
            <svg v-else class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 3l18 18" />
                <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6C3.8 8.5 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 5.4-1.4" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </svg>
        </button>
    </div>
</template>
