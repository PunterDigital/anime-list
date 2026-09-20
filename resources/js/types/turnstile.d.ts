export {}

declare global {
    interface TurnstileRenderOptions {
        sitekey: string
        theme?: 'light' | 'dark' | 'auto'
        size?: 'normal' | 'compact' | 'flexible'
        callback?: (token: string) => void
        'expired-callback'?: () => void
        'error-callback'?: () => void
    }

    interface TurnstileApi {
        render: (container: HTMLElement, options: TurnstileRenderOptions) => string
        reset: (widgetId?: string) => void
        remove: (widgetId: string) => void
    }

    interface Window {
        turnstile?: TurnstileApi
        onTurnstileLoad?: () => void
    }
}
