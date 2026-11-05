import { inject, reactive, type App, type InjectionKey } from 'vue'

// Card 4272: replaces PrimeVue's ToastService/useToast with the same `add`
// call. One store per app (installed in app.ts and ssr.ts), so SSR requests
// never share toasts. AppToast in the layout shows them.
export type ToastSeverity = 'success' | 'info' | 'warn' | 'error'

export interface ToastMessage {
    severity?: ToastSeverity
    summary?: string
    detail?: string
    /** Milliseconds before it closes itself; leave out to keep it until closed. */
    life?: number
}

export interface ShownToast extends Required<Pick<ToastMessage, 'severity'>>, Omit<ToastMessage, 'severity'> {
    id: number
}

export interface ToastStore {
    messages: ShownToast[]
    add(message: ToastMessage): void
    remove(id: number): void
    removeAll(): void
}

const key: InjectionKey<ToastStore> = Symbol('toast')

export function createToast() {
    let next = 0
    const timers = new Map<number, ReturnType<typeof setTimeout>>()

    const store: ToastStore = reactive({
        messages: [] as ShownToast[],
        add(message: ToastMessage) {
            const id = ++next
            store.messages.push({ severity: 'info', ...message, id })
            if (message.life && typeof window !== 'undefined') {
                timers.set(id, setTimeout(() => store.remove(id), message.life))
            }
        },
        remove(id: number) {
            clearTimeout(timers.get(id))
            timers.delete(id)
            const index = store.messages.findIndex((m) => m.id === id)
            if (index !== -1) store.messages.splice(index, 1)
        },
        removeAll() {
            for (const timer of timers.values()) clearTimeout(timer)
            timers.clear()
            store.messages.splice(0)
        },
    })

    return {
        store,
        install(app: App) {
            app.provide(key, store)
        },
    }
}

export function useToast(): ToastStore {
    const store = inject(key)
    if (!store) throw new Error('useToast() needs createToast() installed on the app')
    return store
}
