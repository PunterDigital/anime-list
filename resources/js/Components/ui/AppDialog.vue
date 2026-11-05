<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

// Card 4272: replaces PrimeVue's modal Dialog. role="dialog" + aria-modal,
// titled by its header; Escape and the close button close it, Tab stays
// inside, the page behind doesn't scroll, and focus goes back to whatever
// opened it. `class` goes on the panel (as with PrimeVue).
defineOptions({ inheritAttrs: false })

defineProps<{ header?: string }>()
const visible = defineModel<boolean>('visible', { default: false })

const titleId = useId()
const panel = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const mounted = ref(false)
let opener: HTMLElement | null = null

function close() {
    visible.value = false
}

function focusables(): HTMLElement[] {
    return [...(panel.value?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [])].filter((el) => el.offsetParent !== null || el === document.activeElement)
}

function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
    }
    if (event.key !== 'Tab') return
    const items = focusables()
    if (items.length === 0) return
    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
    }
}

let locked = false

async function opened() {
    if (locked) return
    locked = true
    opener = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeButton.value?.focus()
}

// Also runs on unmount: pages often remove the dialog (v-if) in the same
// tick it closes, before a watcher would see `visible` turn false.
function closed() {
    if (!locked) return
    locked = false
    document.body.style.overflow = ''
    opener?.focus?.()
    opener = null
}

watch(visible, (open) => (open ? opened() : closed()), { flush: 'post' })

onMounted(() => {
    mounted.value = true
    // Shown from the start (rendered with v-if): the teleport fills in on the next tick.
    if (visible.value) opened()
})
onBeforeUnmount(closed)

</script>

<template>
    <Teleport v-if="mounted" to="body">
        <Transition
            enter-active-class="transition-colors duration-150"
            leave-active-class="transition-colors duration-150"
            enter-from-class="bg-transparent"
            leave-to-class="bg-transparent"
        >
            <div
                v-if="visible"
                data-ui="dialog-mask"
                class="fixed inset-0 z-[1101] flex items-center justify-center bg-black/60"
            >
                <Transition
                    appear
                    enter-active-class="transition-[opacity,transform] duration-150 ease-[cubic-bezier(0,0,0.2,1)]"
                    leave-active-class="transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    enter-from-class="scale-[0.7] opacity-0"
                    leave-to-class="scale-[0.7] opacity-0"
                >
                    <div
                        v-bind="$attrs"
                        ref="panel"
                        data-ui="dialog"
                        role="dialog"
                        aria-modal="true"
                        :aria-labelledby="header ? titleId : undefined"
                        class="flex max-h-[90%] flex-col rounded-xl border border-control-track bg-control-overlay text-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]"
                        @keydown="onKeydown"
                    >
                        <div data-ui="dialog-header" class="flex shrink-0 items-center justify-between p-5">
                            <span :id="titleId" data-ui="dialog-title" class="text-xl font-semibold leading-[30px]">{{ header }}</span>
                            <button
                                ref="closeButton"
                                type="button"
                                aria-label="Close"
                                data-ui="dialog-close"
                                class="relative flex size-10 cursor-pointer items-center justify-center rounded-full border border-transparent text-control-muted transition-[background-color,color,outline-color] duration-200 hover:bg-control-secondary focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-control-ring"
                                @click="close"
                            >
                                <svg viewBox="0 0 14 14" fill="currentColor" class="size-4" aria-hidden="true">
                                    <path d="M8.01186 7.00933L12.27 2.75116C12.341 2.68501 12.398 2.60524 12.4375 2.51661C12.4769 2.42798 12.4982 2.3323 12.4999 2.23529C12.5016 2.13827 12.4838 2.0419 12.4474 1.95194C12.4111 1.86197 12.357 1.78024 12.2884 1.71163C12.2198 1.64302 12.138 1.58893 12.0481 1.55259C11.9581 1.51625 11.8617 1.4984 11.7647 1.50011C11.6677 1.50182 11.572 1.52306 11.4834 1.56255C11.3948 1.60204 11.315 1.65898 11.2488 1.72997L6.99067 5.98814L2.7325 1.72997C2.59553 1.60234 2.41437 1.53286 2.22718 1.53616C2.03999 1.53946 1.8614 1.61529 1.72901 1.74767C1.59663 1.88006 1.5208 2.05865 1.5175 2.24584C1.5142 2.43303 1.58368 2.61419 1.71131 2.75116L5.96948 7.00933L1.71131 11.2675C1.576 11.403 1.5 11.5866 1.5 11.7781C1.5 11.9696 1.576 12.1532 1.71131 12.2887C1.84679 12.424 2.03043 12.5 2.2219 12.5C2.41338 12.5 2.59702 12.424 2.7325 12.2887L6.99067 8.03052L11.2488 12.2887C11.3843 12.424 11.568 12.5 11.7594 12.5C11.9509 12.5 12.1346 12.424 12.27 12.2887C12.4053 12.1532 12.4813 11.9696 12.4813 11.7781C12.4813 11.5866 12.4053 11.403 12.27 11.2675L8.01186 7.00933Z" />
                                </svg>
                            </button>
                        </div>
                        <div data-ui="dialog-content" class="overflow-y-auto px-5 pb-5">
                            <slot />
                        </div>
                        <div v-if="$slots.footer" data-ui="dialog-footer" class="flex shrink-0 justify-end gap-2 px-5 pb-5">
                            <slot name="footer" />
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
