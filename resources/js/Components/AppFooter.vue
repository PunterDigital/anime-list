<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useFeature } from '@/composables/useFeature'
import type { BusinessInfo } from '@/types'

const page = usePage<{ business: BusinessInfo | null }>()
const business = computed(() => page.props.business)

const publicApiEnabled = useFeature('public-api')
const companyPagesEnabled = useFeature('company-pages')
</script>

<template>
    <footer class="mt-16 border-t border-gray-800 bg-gray-950">
        <div class="container mx-auto px-4 py-10">
            <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <!-- Navigation -->
                <div>
                    <h3 class="mb-3 text-sm font-semibold text-gray-300">Navigate</h3>
                    <ul class="space-y-2 text-sm">
                        <li><Link :href="route('home')" class="text-gray-500 transition hover:text-gray-200">Home</Link></li>
                        <li><Link :href="route('anime.index')" class="text-gray-500 transition hover:text-gray-200">Browse Anime</Link></li>
                        <li><Link :href="route('seasonal')" class="text-gray-500 transition hover:text-gray-200">Seasonal</Link></li>
                        <li><Link :href="route('schedule')" class="text-gray-500 transition hover:text-gray-200">Schedule</Link></li>
                        <li><Link :href="route('top.rated')" class="text-gray-500 transition hover:text-gray-200">Top Anime</Link></li>
                        <li><Link :href="route('alternatives')" class="text-gray-500 transition hover:text-gray-200">MAL Alternatives</Link></li>
                        <li v-if="publicApiEnabled"><Link :href="route('developers')" class="text-gray-500 transition hover:text-gray-200">Developers</Link></li>
                    </ul>
                </div>

                <!-- Company -->
                <div>
                    <h3 class="mb-3 text-sm font-semibold text-gray-300">AniTrack</h3>
                    <p class="text-sm text-gray-500">
                        Track your anime, discover new shows, and share your list with friends.
                    </p>
                    <ul v-if="companyPagesEnabled" class="mt-3 space-y-2 text-sm">
                        <li><Link :href="route('about')" class="text-gray-500 transition hover:text-gray-200">About</Link></li>
                        <li><Link :href="route('how-it-works')" class="text-gray-500 transition hover:text-gray-200">How It Works</Link></li>
                        <li><Link :href="route('contact')" class="text-gray-500 transition hover:text-gray-200">Contact</Link></li>
                    </ul>
                    <p class="mt-3 text-xs text-gray-600">
                        Anime data provided by
                        <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" class="text-gray-500 transition hover:text-gray-200">AniList</a>.
                    </p>
                </div>

                <!-- Legal -->
                <div>
                    <h3 class="mb-3 text-sm font-semibold text-gray-300">Legal</h3>
                    <ul class="space-y-2 text-sm">
                        <li><Link :href="route('terms')" class="text-gray-500 transition hover:text-gray-200">Terms of Service</Link></li>
                        <li><Link :href="route('privacy')" class="text-gray-500 transition hover:text-gray-200">Privacy Policy</Link></li>
                        <li><a href="/sitemap.xml" class="text-gray-500 transition hover:text-gray-200">Sitemap</a></li>
                    </ul>
                </div>

                <!-- Business information -->
                <div v-if="business">
                    <h3 class="mb-3 text-sm font-semibold text-gray-300">Business Information</h3>
                    <address class="text-sm not-italic leading-relaxed text-gray-500">
                        {{ business.name }}<br />
                        {{ business.address.street }}<br />
                        {{ business.address.district }}<br />
                        {{ business.address.postcode }}<br />
                        {{ business.address.country }}
                    </address>
                    <dl class="mt-3 space-y-1 text-xs text-gray-500">
                        <div class="flex gap-1">
                            <dt class="text-gray-600">Business No:</dt>
                            <dd>{{ business.business_number }}</dd>
                        </div>
                        <div class="flex gap-1">
                            <dt class="text-gray-600">VAT Number:</dt>
                            <dd>{{ business.vat_number }}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div class="mt-8 border-t border-gray-800/50 pt-6 text-center text-xs text-gray-600">
                &copy; {{ new Date().getFullYear() }} AniTrack
            </div>
        </div>
    </footer>
</template>
