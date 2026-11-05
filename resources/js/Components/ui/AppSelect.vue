<script setup lang="ts" generic="T extends object">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useSplitAttrs } from './splitAttrs'

// Card 4272: replaces PrimeVue's Select with the props AniTrack used. The
// trigger is a combobox (WAI-ARIA "select-only combobox"): Enter, Space or
// ArrowDown opens it, the arrows/Home/End move, Enter picks, Escape and Tab
// close it, Delete/Backspace clear it when `showClear` is on. The list goes
// to <body> so table and card containers with overflow don't clip it.
// `class`/`style` go on the outer box, other attributes on the combobox.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
    options: T[]
    optionLabel: string
    optionValue: string
    placeholder?: string
    showClear?: boolean
    filter?: boolean
    invalid?: boolean
    disabled?: boolean
}>(), {
    placeholder: undefined,
    showClear: false,
    filter: false,
    invalid: false,
    disabled: false,
})

// PrimeVue typed the value as any; the pages pass typed handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const model = defineModel<any>()
const { rootClass, rootStyle, controlAttrs } = useSplitAttrs()

const id = useId()
const listId = `${id}-list`
const root = ref<HTMLElement | null>(null)
const combobox = ref<HTMLElement | null>(null)
const overlay = ref<HTMLElement | null>(null)
const listContainer = ref<HTMLElement | null>(null)
const filterInput = ref<HTMLInputElement | null>(null)
const open = ref(false)
const mounted = ref(false)
const query = ref('')
const focusedIndex = ref(-1)
const position = ref<{ top: number, left: number, minWidth: number }>({ top: 0, left: 0, minWidth: 0 })

const labelOf = (option: T) => String((option as Record<string, unknown>)[props.optionLabel] ?? '')
const valueOf = (option: T) => (option as Record<string, unknown>)[props.optionValue]

const selected = computed(() => props.options.find((option) => valueOf(option) === model.value))
const hasValue = computed(() => model.value !== null && model.value !== undefined && model.value !== '')
const visibleOptions = computed(() => {
    const q = query.value.trim().toLocaleLowerCase()
    if (!props.filter || q === '') return props.options
    return props.options.filter((option) => labelOf(option).toLocaleLowerCase().includes(q))
})
const optionId = (index: number) => `${id}-option-${index}`

function place() {
    if (!root.value) return
    const rect = root.value.getBoundingClientRect()
    const height = overlay.value?.offsetHeight ?? 0
    const below = window.innerHeight - rect.bottom
    // Flip above when it doesn't fit below and there is more room above.
    const top = below < height + 2 && rect.top > below
        ? rect.top + window.scrollY - height - 2
        : rect.bottom + window.scrollY + 2
    position.value = { top, left: rect.left + window.scrollX, minWidth: rect.width }
}

async function show() {
    if (open.value || props.disabled) return
    query.value = ''
    const index = visibleOptions.value.findIndex((option) => valueOf(option) === model.value)
    focusedIndex.value = index
    open.value = true
    place()
    await nextTick()
    place()
    scrollToFocused()
    if (props.filter) filterInput.value?.focus()
}

function hide(refocus = true) {
    if (!open.value) return
    open.value = false
    focusedIndex.value = -1
    if (refocus) combobox.value?.focus()
}

function choose(option: T) {
    model.value = valueOf(option)
    hide()
}

function clear() {
    model.value = null
    hide(false)
    combobox.value?.focus()
}

function scrollToFocused() {
    if (focusedIndex.value < 0) return
    const el = listContainer.value?.querySelector<HTMLElement>(`#${CSS.escape(optionId(focusedIndex.value))}`)
    el?.scrollIntoView({ block: 'nearest' })
}

function move(to: number) {
    const count = visibleOptions.value.length
    if (count === 0) return
    focusedIndex.value = Math.max(0, Math.min(count - 1, to))
    nextTick(scrollToFocused)
}

function onKeydown(event: KeyboardEvent) {
    if (props.disabled) return
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault()
            if (!open.value) show()
            else move(focusedIndex.value + 1)
            break
        case 'ArrowUp':
            event.preventDefault()
            if (!open.value) show()
            else move(focusedIndex.value - 1)
            break
        case 'Home':
            if (open.value && !props.filter) {
                event.preventDefault()
                move(0)
            }
            break
        case 'End':
            if (open.value && !props.filter) {
                event.preventDefault()
                move(visibleOptions.value.length - 1)
            }
            break
        case 'Enter': {
            event.preventDefault()
            const option = visibleOptions.value[focusedIndex.value]
            if (open.value && option) choose(option)
            else if (open.value) hide()
            else show()
            break
        }
        case ' ':
            // In the filter box a space is just text.
            if (event.target === filterInput.value) break
            event.preventDefault()
            if (!open.value) show()
            else if (visibleOptions.value[focusedIndex.value]) choose(visibleOptions.value[focusedIndex.value]!)
            break
        case 'Escape':
            if (open.value) {
                event.preventDefault()
                event.stopPropagation()
                hide()
            }
            break
        case 'Tab':
            hide(false)
            break
        case 'Delete':
        case 'Backspace':
            if (!open.value && props.showClear && hasValue.value) {
                event.preventDefault()
                clear()
            }
            break
    }
}

function onDocumentPointerDown(event: PointerEvent) {
    const target = event.target as Node
    if (root.value?.contains(target) || overlay.value?.contains(target)) return
    hide(false)
}

function onWindowChange(event: Event) {
    // The list's own scroll keeps it open; any other scroll or a resize closes it.
    if (event.type === 'scroll' && overlay.value?.contains(event.target as Node)) return
    hide(false)
}

watch(open, (isOpen) => {
    if (isOpen) {
        document.addEventListener('pointerdown', onDocumentPointerDown, true)
        window.addEventListener('scroll', onWindowChange, true)
        window.addEventListener('resize', onWindowChange)
    } else {
        document.removeEventListener('pointerdown', onDocumentPointerDown, true)
        window.removeEventListener('scroll', onWindowChange, true)
        window.removeEventListener('resize', onWindowChange)
    }
})

watch(query, () => {
    focusedIndex.value = visibleOptions.value.length > 0 ? 0 : -1
    nextTick(place)
})

// Teleport only after mount, so the server-rendered HTML and hydration agree.
onMounted(() => { mounted.value = true })
onBeforeUnmount(() => hide(false))
</script>

<template>
    <div
        ref="root"
        data-ui="select"
        class="relative inline-flex cursor-pointer select-none rounded-md border bg-control-field shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] transition-[background-color,color,border-color,outline-color,box-shadow] duration-200"
        :class="[
            invalid ? 'border-control-invalid' : open ? 'border-control-accent' : 'border-control-border focus-within:border-control-accent hover:border-control-border-hover',
            disabled ? 'cursor-default bg-control-track opacity-100' : '',
            rootClass,
        ]"
        :style="rootStyle"
        @click="open ? hide() : show()"
    >
        <span
            v-bind="controlAttrs"
            :id="id"
            ref="combobox"
            data-ui="select-label"
            role="combobox"
            :tabindex="disabled ? -1 : 0"
            aria-haspopup="listbox"
            :aria-expanded="open"
            :aria-controls="open ? listId : undefined"
            :aria-activedescendant="open && !filter && focusedIndex >= 0 ? optionId(focusedIndex) : undefined"
            :aria-invalid="invalid || undefined"
            :aria-disabled="disabled || undefined"
            class="block w-[1%] flex-auto overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 leading-normal outline-none"
            :class="selected ? 'text-white' : invalid ? 'text-control-danger' : 'text-control-muted'"
            @keydown="onKeydown"
        >{{ selected ? labelOf(selected) : (placeholder ?? '\u00a0') }}</span>
        <button
            v-if="showClear && hasValue && !disabled"
            type="button"
            tabindex="-1"
            aria-label="Clear selection"
            data-ui="select-clear"
            class="flex w-4 shrink-0 cursor-pointer items-center justify-center self-center text-control-muted"
            @click.stop="clear"
        >
            <svg viewBox="0 0 14 14" fill="currentColor" class="size-4" aria-hidden="true">
                <path d="M8.01186 7.00933L12.27 2.75116C12.341 2.68501 12.398 2.60524 12.4375 2.51661C12.4769 2.42798 12.4982 2.3323 12.4999 2.23529C12.5016 2.13827 12.4838 2.0419 12.4474 1.95194C12.4111 1.86197 12.357 1.78024 12.2884 1.71163C12.2198 1.64302 12.138 1.58893 12.0481 1.55259C11.9581 1.51625 11.8617 1.4984 11.7647 1.50011C11.6677 1.50182 11.572 1.52306 11.4834 1.56255C11.3948 1.60204 11.315 1.65898 11.2488 1.72997L6.99067 5.98814L2.7325 1.72997C2.59553 1.60234 2.41437 1.53286 2.22718 1.53616C2.03999 1.53946 1.8614 1.61529 1.72901 1.74767C1.59663 1.88006 1.5208 2.05865 1.5175 2.24584C1.5142 2.43303 1.58368 2.61419 1.71131 2.75116L5.96948 7.00933L1.71131 11.2675C1.576 11.403 1.5 11.5866 1.5 11.7781C1.5 11.9696 1.576 12.1532 1.71131 12.2887C1.84679 12.424 2.03043 12.5 2.2219 12.5C2.41338 12.5 2.59702 12.424 2.7325 12.2887L6.99067 8.03052L11.2488 12.2887C11.3843 12.424 11.568 12.5 11.7594 12.5C11.9509 12.5 12.1346 12.424 12.27 12.2887C12.4053 12.1532 12.4813 11.9696 12.4813 11.7781C12.4813 11.5866 12.4053 11.403 12.27 11.2675L8.01186 7.00933Z" />
            </svg>
        </button>
        <span data-ui="select-dropdown" aria-hidden="true" class="flex w-10 shrink-0 items-center justify-center rounded-r-md text-control-muted">
            <svg viewBox="0 0 14 14" fill="currentColor" class="size-4">
                <path d="M7.01744 10.398C6.91269 10.3985 6.8089 10.378 6.71215 10.3379C6.61541 10.2977 6.52766 10.2386 6.45405 10.1641L1.13907 4.84913C1.03306 4.69404 0.985221 4.5065 1.00399 4.31958C1.02276 4.13266 1.10693 3.95838 1.24166 3.82747C1.37639 3.69655 1.55301 3.61742 1.74039 3.60402C1.92777 3.59062 2.11386 3.64382 2.26584 3.75424L7.01744 8.47394L11.769 3.75424C11.9189 3.65709 12.097 3.61306 12.2748 3.62921C12.4527 3.64535 12.6199 3.72073 12.7498 3.84328C12.8797 3.96582 12.9647 4.12842 12.9912 4.30502C13.0177 4.48162 12.9841 4.662 12.8958 4.81724L7.58083 10.1322C7.50996 10.2125 7.42344 10.2775 7.32656 10.3232C7.22968 10.3689 7.12449 10.3944 7.01744 10.398Z" />
            </svg>
        </span>

        <Teleport v-if="mounted" to="body">
            <div
                v-if="open"
                ref="overlay"
                data-ui="select-overlay"
                class="absolute z-[1001] cursor-default rounded-md border border-control-track bg-control-overlay text-base leading-normal text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
                :style="{ top: `${position.top}px`, left: `${position.left}px`, minWidth: `${position.minWidth}px` }"
                @click.stop
            >
                <div v-if="filter" data-ui="select-header" class="px-4 pb-1 pt-2">
                    <div class="relative">
                        <input
                            ref="filterInput"
                            v-model="query"
                            data-ui="select-filter"
                            type="text"
                            autocomplete="off"
                            role="searchbox"
                            aria-label="Filter options"
                            :aria-controls="listId"
                            :aria-activedescendant="focusedIndex >= 0 ? optionId(focusedIndex) : undefined"
                            class="w-full appearance-none rounded-md border border-control-border bg-control-field py-2 pl-3 pr-10 text-base leading-normal text-white shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] outline-none transition-[border-color] duration-200 placeholder:text-control-muted hover:border-control-border-hover focus:border-control-accent"
                            @keydown="onKeydown"
                        />
                        <svg data-ui="select-filter-icon" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true" class="pointer-events-none absolute right-3 top-1/2 -mt-2 size-4 text-control-muted">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M2.67602 11.0265C3.6661 11.688 4.83011 12.0411 6.02086 12.0411C6.81149 12.0411 7.59438 11.8854 8.32483 11.5828C8.87005 11.357 9.37808 11.0526 9.83317 10.6803L12.9769 13.8241C13.0323 13.8801 13.0983 13.9245 13.171 13.9548C13.2438 13.985 13.3219 14.0003 13.4007 14C13.4795 14.0003 13.5575 13.985 13.6303 13.9548C13.7031 13.9245 13.7691 13.8801 13.8244 13.8241C13.9367 13.7116 13.9998 13.5592 13.9998 13.4003C13.9998 13.2414 13.9367 13.089 13.8244 12.9765L10.6807 9.8328C11.053 9.37773 11.3573 8.86972 11.5831 8.32452C11.8857 7.59408 12.0414 6.81119 12.0414 6.02056C12.0414 4.8298 11.6883 3.66579 11.0268 2.67572C10.3652 1.68564 9.42494 0.913972 8.32483 0.45829C7.22472 0.00260857 6.01418 -0.116618 4.84631 0.115686C3.67844 0.34799 2.60568 0.921393 1.76369 1.76338C0.921698 2.60537 0.348296 3.67813 0.115991 4.84601C-0.116313 6.01388 0.00291375 7.22441 0.458595 8.32452C0.914277 9.42464 1.68595 10.3649 2.67602 11.0265ZM3.35565 2.0158C4.14456 1.48867 5.07206 1.20731 6.02086 1.20731C7.29317 1.20731 8.51338 1.71274 9.41304 2.6124C10.3127 3.51206 10.8181 4.73226 10.8181 6.00457C10.8181 6.95337 10.5368 7.88088 10.0096 8.66978C9.48251 9.45868 8.73328 10.0736 7.85669 10.4367C6.98011 10.7997 6.01554 10.8947 5.08496 10.7096C4.15439 10.5245 3.2996 10.0676 2.62869 9.39674C1.95778 8.72583 1.50089 7.87104 1.31579 6.94046C1.13068 6.00989 1.22568 5.04532 1.58878 4.16874C1.95187 3.29215 2.56675 2.54292 3.35565 2.0158Z" />
                        </svg>
                    </div>
                </div>
                <div ref="listContainer" data-ui="select-list-container" class="max-h-56 overflow-auto">
                    <ul :id="listId" data-ui="select-list" role="listbox" class="m-0 flex list-none flex-col gap-0.5 p-1">
                        <li
                            v-for="(option, index) in visibleOptions"
                            :id="optionId(index)"
                            :key="String(valueOf(option))"
                            data-ui="select-option"
                            role="option"
                            :aria-selected="valueOf(option) === model"
                            :data-focused="index === focusedIndex || undefined"
                            class="relative flex cursor-pointer items-center whitespace-nowrap rounded-sm px-3 py-2 transition-colors duration-200"
                            :class="valueOf(option) === model
                                ? (index === focusedIndex ? 'bg-control-accent/24 text-white/87' : 'bg-control-accent/16 text-white/87')
                                : (index === focusedIndex ? 'bg-control-secondary text-white' : 'text-white hover:bg-control-secondary')"
                            @mousemove="focusedIndex = index"
                            @click="choose(option)"
                        >
                            {{ labelOf(option) }}
                        </li>
                        <li v-if="visibleOptions.length === 0" role="option" aria-disabled="true" class="px-3 py-2 text-white">
                            {{ options.length === 0 ? 'No available options' : 'No results found' }}
                        </li>
                    </ul>
                </div>
            </div>
        </Teleport>
    </div>
</template>
