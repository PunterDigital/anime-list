import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
import { useDebounce } from './useDebounce'
import type { SearchResponse } from '@/types'

export function useAnimeSearch() {
    const query = ref('')
    const debouncedQuery = useDebounce(query, 300)

    const enabled = computed(() => debouncedQuery.value.length >= 2)

    const { data, isFetching, isError } = useQuery<SearchResponse>({
        queryKey: ['anime-search', debouncedQuery],
        queryFn: async ({ signal }) => {
            const { data } = await axios.get<SearchResponse>('/api/search', {
                params: { q: debouncedQuery.value },
                signal,
            })
            return data
        },
        enabled,
        staleTime: 5 * 60 * 1000,
        // A miss queues an AniList lookup (card 5707): ask again every 2 s
        // while it's pending, up to 5 times, so new titles show up.
        refetchInterval: (q) =>
            q.state.data?.pending && q.state.dataUpdateCount <= 5 ? 2000 : false,
    })

    const results = computed(() => data.value?.data ?? [])
    const total = computed(() => data.value?.total ?? 0)

    return {
        query,
        debouncedQuery,
        results,
        total,
        isLoading: isFetching,
        isError,
    }
}
