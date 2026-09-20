<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Cloudflare Turnstile captcha. Emits the response token through v-model as
 * soon as the challenge passes, and an empty string when it expires or
 * errors so the parent form knows to block submission.
 */
const props = defineProps<{
    siteKey: string
    modelValue: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', token: string): void
}>()

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit'

const container = ref<HTMLElement | null>(null)
const widgetId = ref<string | null>(null)
const loadFailed = ref(false)

let loadPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
    if (window.turnstile) return Promise.resolve()
    if (loadPromise) return loadPromise

    loadPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
        window.onTurnstileLoad = () => resolve()

        if (existing) {
            existing.addEventListener('error', () => reject(new Error('turnstile failed to load')))
            return
        }

        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        script.defer = true
        script.addEventListener('error', () => reject(new Error('turnstile failed to load')))
        document.head.appendChild(script)
    })

    return loadPromise
}

function render() {
    if (!container.value || !window.turnstile) return

    widgetId.value = window.turnstile.render(container.value, {
        sitekey: props.siteKey,
        theme: 'dark',
        size: 'flexible',
        callback: (token) => emit('update:modelValue', token),
        'expired-callback': () => emit('update:modelValue', ''),
        'error-callback': () => emit('update:modelValue', ''),
    })
}

/** Ask for a fresh token — Turnstile tokens are single-use. */
function reset() {
    emit('update:modelValue', '')
    if (widgetId.value && window.turnstile) {
        window.turnstile.reset(widgetId.value)
    }
}

defineExpose({ reset })

onMounted(async () => {
    try {
        await loadScript()
        render()
    } catch {
        loadFailed.value = true
    }
})

onBeforeUnmount(() => {
    if (widgetId.value && window.turnstile) {
        window.turnstile.remove(widgetId.value)
    }
})
</script>

<template>
    <div>
        <div ref="container" class="min-h-[65px]" />
        <p v-if="loadFailed" class="text-sm text-red-400">
            The captcha could not be loaded. Check your ad blocker, or sign in to send a message without it.
        </p>
    </div>
</template>
