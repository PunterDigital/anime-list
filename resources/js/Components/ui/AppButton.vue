<script setup lang="ts">
import { computed } from 'vue'

// Card 4272: replaces PrimeVue's Button with the props AniTrack used.
const props = withDefaults(defineProps<{
    label?: string
    severity?: 'primary' | 'secondary' | 'danger'
    text?: boolean
    outlined?: boolean
    size?: 'small'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
}>(), {
    label: undefined,
    severity: 'primary',
    text: false,
    outlined: false,
    size: undefined,
    loading: false,
    disabled: false,
    type: 'button',
})

const variants = {
    primary: {
        solid: 'border-control-accent bg-control-accent text-control-on-accent enabled:hover:border-control-accent-hover enabled:hover:bg-control-accent-hover enabled:active:border-control-accent-active enabled:active:bg-control-accent-active',
        text: 'border-transparent bg-transparent text-control-accent enabled:hover:bg-control-accent/4 enabled:active:bg-control-accent/16',
        outlined: 'border-control-accent bg-transparent text-control-accent enabled:hover:bg-control-accent/4 enabled:active:bg-control-accent/16',
    },
    secondary: {
        solid: 'border-control-secondary bg-control-secondary text-control-secondary-text enabled:hover:border-control-secondary-hover enabled:hover:bg-control-secondary-hover enabled:hover:text-control-secondary-text-hover enabled:active:border-control-secondary-active enabled:active:bg-control-secondary-active',
        text: 'border-transparent bg-transparent text-control-muted enabled:hover:bg-control-secondary enabled:active:bg-control-secondary-hover',
        outlined: 'border-control-border bg-transparent text-control-muted enabled:hover:bg-control-secondary enabled:active:bg-control-secondary-hover',
    },
    danger: {
        solid: 'border-control-danger bg-control-danger text-control-on-accent enabled:hover:opacity-90',
        text: 'border-transparent bg-transparent text-control-danger enabled:hover:bg-control-danger/4 enabled:active:bg-control-danger/16',
        outlined: 'border-control-danger-border bg-transparent text-control-danger enabled:hover:bg-control-danger/4 enabled:active:bg-control-danger/16',
    },
} as const

const classes = computed(() => [
    'relative inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-md border align-bottom font-normal leading-normal',
    'transition-[background-color,color,border-color,outline-color,box-shadow] duration-200',
    'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-control-accent',
    'disabled:cursor-default disabled:opacity-60',
    props.size === 'small' ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-base',
    variants[props.severity][props.text ? 'text' : props.outlined ? 'outlined' : 'solid'],
])
</script>

<template>
    <button :type="type" :class="classes" :disabled="disabled || loading" :aria-busy="loading || undefined">
        <svg
            v-if="loading"
            class="size-4 shrink-0 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <span class="font-medium"><slot>{{ label }}</slot></span>
    </button>
</template>
