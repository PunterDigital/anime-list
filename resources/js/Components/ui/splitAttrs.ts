import { computed, useAttrs, type StyleValue } from 'vue'

// Card 4272: for components whose `class`/`style` go on a wrapper while
// every other attribute (id, aria-*, disabled, listeners) goes on the
// control inside. Use with `defineOptions({ inheritAttrs: false })`.
export function useSplitAttrs() {
    const attrs = useAttrs()

    return {
        rootClass: computed(() => attrs.class),
        rootStyle: computed(() => attrs.style as StyleValue),
        controlAttrs: computed(() =>
            Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style')),
        ),
    }
}
