import { watch, onUnmounted } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useToast } from '@/composables/useToast'

export function useFlashToast() {
    const page = usePage()
    const toast = useToast()

    const stop = watch(
        () => (page.props.flash as { message?: string; status?: string })?.message,
        (message) => {
            if (!message) return

            const status = (page.props.flash as { status?: string })?.status ?? 'info'
            const severityMap: Record<string, 'success' | 'info' | 'warn' | 'error'> = {
                success: 'success',
                error: 'error',
                warning: 'warn',
                info: 'info',
            }

            toast.add({
                severity: severityMap[status] ?? 'info',
                summary: status.charAt(0).toUpperCase() + status.slice(1),
                detail: message,
                life: 3000,
            })
        },
    )

    onUnmounted(stop)
}
