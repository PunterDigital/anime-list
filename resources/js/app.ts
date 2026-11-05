import { createSSRApp, h, type DefineComponent } from 'vue'
import { createInertiaApp, Link, Head } from '@inertiajs/vue3'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { ZiggyVue } from 'ziggy-js'
import { createToast } from '@/composables/useToast'
import '../css/app.css'

createInertiaApp({
    title: (title) => title ? `${title} — AniTrack` : 'AniTrack',
    resolve: (name) => {
        const pages = import.meta.glob<DefineComponent>('./Pages/**/*.vue')
        const page = pages[`./Pages/${name}.vue`]
        if (!page) throw new Error(`Page not found: ${name}`)
        return page()
    },
    setup({ el, App, props, plugin }) {
        const app = createSSRApp({ render: () => h(App, props) })

        app.use(plugin)
        app.use(ZiggyVue)
        app.use(createPinia())
        app.use(VueQueryPlugin)
        app.use(createToast())

        // Inertia's own names for these globals.
        // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
        app.component('Link', Link)
        // eslint-disable-next-line vue/multi-word-component-names, vue/no-reserved-component-names
        app.component('Head', Head)

        app.mount(el)
    },
})
