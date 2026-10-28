/// <reference types="node" />
import { createSSRApp, h, type App, type DefineComponent } from 'vue'
import { createInertiaApp, Link, Head } from '@inertiajs/vue3'
import createServer from '@inertiajs/vue3/server'
import { renderToString } from 'vue/server-renderer'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primevue/themes/aura'
import { ZiggyVue } from 'ziggy-js'

createServer((page) => {
    // Inertia 2.x puts the page app inside a wrapper div with `innerHTML: render(app)`,
    // which is a Promise. Vue 3.5.44 turns innerHTML into a string (vuejs/core#15769),
    // so every page came out as "[object Promise]". Render the page app before the
    // wrapper, and hand Inertia the finished HTML when it asks for it.
    let pageApp: App | undefined
    let pageHtml: string | undefined
    const render = (app: App): string | Promise<string> => {
        if (app === pageApp) return pageHtml ?? renderToString(app)
        if (!pageApp) return renderToString(app)
        return renderToString(pageApp).then((html) => {
            pageHtml = html
            return renderToString(app)
        })
    }

    return createInertiaApp({
        page,
        render: render as (app: App) => Promise<string>,
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
            app.use(PrimeVue, {
                unstyled: false,
                theme: {
                    preset: Aura,
                    options: {
                        darkModeSelector: '.dark',
                    },
                },
            })
            app.use(ToastService)

            // Inertia's own names for these globals.
            // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
            app.component('Link', Link)
            // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
            app.component('Head', Head)

            pageApp = app
            return app
        },
    })
},
// E2E runs its own SSR server next to a dev one; production uses the default.
{ port: Number(process.env.INERTIA_SSR_PORT) || 13714 })
