/// <reference types="node" />
import { createSSRApp, h, type DefineComponent } from 'vue'
import { createInertiaApp, Link, Head } from '@inertiajs/vue3'
import createServer from '@inertiajs/vue3/server'
import { renderToString } from 'vue/server-renderer'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ZiggyVue } from 'ziggy-js'
import { createToast } from '@/composables/useToast'

createServer((page) => {
    // Inertia 3 awaits renderToString and builds the #app markup as a string, so the
    // Inertia 2 workaround for "[object Promise]" (#3408, vuejs/core#15769) is gone.
    return createInertiaApp({
        page,
        render: renderToString,
        title: (title) => title ? `${title} — AniTrack` : 'AniTrack',
        resolve: (name) => {
            const pages = import.meta.glob<DefineComponent>('./Pages/**/*.vue', { eager: true })
            const page = pages[`./Pages/${name}.vue`]
            if (!page) return pages['./Pages/ErrorPage.vue']!
            return page
        },
        setup({ App, props, plugin }) {
            const app = createSSRApp({ render: () => h(App, props) })

            app.use(plugin)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ziggy = (props.initialPage.props as any).ziggy

            // Make Ziggy config available globally for SSR so route() works
            // (in the browser, @routes Blade directive sets window.Ziggy)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(globalThis as any).Ziggy = ziggy

            app.use(ZiggyVue, {
                ...ziggy,
                location: ziggy?.location ? new URL(ziggy.location) : undefined,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)

            // Expose route() globally for <script setup> blocks
            // (in the browser, @routes Blade directive sets window.route)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(globalThis as any).route = app.config.globalProperties.route
            app.use(createPinia())
            app.use(VueQueryPlugin)
            app.use(createToast())

            // Inertia's own names for these globals.
            // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
            app.component('Link', Link)
            // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
            app.component('Head', Head)

            return app
        },
    })
},
// E2E runs its own SSR server next to a dev one; production uses the default.
{ port: Number(process.env.INERTIA_SSR_PORT) || 13714 })
