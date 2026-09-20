import type { BusinessInfo } from './business'
import type { User } from './user'

declare module '@inertiajs/vue3' {
    interface PageProps {
        auth: {
            user: User | null
        }
        flash: {
            message: string | null
            status: string | null
        }
        business: BusinessInfo
    }
}
