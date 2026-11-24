import { computed, ref, watch, type Ref, type WatchSource } from 'vue'

/**
 * Render a long list a slice at a time (card 5718): a 2,000-entry list drew
 * 2,000 cards, server-side render included. Filtering, sorting and the
 * status tabs still work on every item; only the first `step` (then
 * "Show more") are drawn. The slice starts over when a `resetOn` source
 * changes (a new filter or sort), not when the items reload after an edit.
 */
export function useRenderLimit<T>(items: Ref<T[]>, resetOn: WatchSource[], step = 120) {
    const limit = ref(step)

    watch(resetOn, () => {
        limit.value = step
    })

    const visible = computed(() => items.value.slice(0, limit.value))
    const remaining = computed(() => Math.max(0, items.value.length - limit.value))

    function showMore() {
        limit.value += step
    }

    return { visible, remaining, showMore }
}
