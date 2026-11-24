import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { http } from '@/lib/http'
import type { ListEntryResource, ListEntryPayload } from '@/types'

export function useListMutations() {
    const queryClient = useQueryClient()

    const storeMutation = useMutation({
        mutationFn: async (payload: ListEntryPayload) => {
            const { data } = await http.post<ListEntryResource>('/api/list', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myList'] })
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, ...patch }: { id: number } & Partial<ListEntryPayload>) => {
            const { data } = await http.patch<ListEntryResource>(`/api/list/${id}`, patch)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myList'] })
        },
    })

    const destroyMutation = useMutation({
        mutationFn: async (id: number) => {
            await http.delete(`/api/list/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myList'] })
        },
    })

    return {
        storeMutation,
        updateMutation,
        destroyMutation,
    }
}
