<script setup lang="ts">
import { computed, ref } from 'vue'
import { useForm, usePage } from '@inertiajs/vue3'
import AppLayout from '@/Layouts/AppLayout.vue'
import TurnstileWidget from '@/Components/TurnstileWidget.vue'
import type { BusinessInfo } from '@/types'

defineOptions({ layout: AppLayout })

const props = defineProps<{
    requiresCaptcha: boolean
    turnstileSiteKey: string | null
    prefill: {
        name: string
        email: string
    }
}>()

const page = usePage<{
    business: BusinessInfo | null
    flash: { message: string | null; status: string | null }
}>()
const business = computed(() => page.props.business)
const flash = computed(() => page.props.flash)

const captcha = ref<InstanceType<typeof TurnstileWidget> | null>(null)
const sent = ref(false)

const form = useForm({
    name: props.prefill.name,
    email: props.prefill.email,
    subject: '',
    message: '',
    website: '',
    turnstile_token: '',
})

const captchaBlocked = computed(() => props.requiresCaptcha && !form.turnstile_token)
const captchaUnavailable = computed(() => props.requiresCaptcha && !props.turnstileSiteKey)

function submit() {
    form.post(route('contact.store'), {
        preserveScroll: true,
        onSuccess: () => {
            sent.value = true
            form.reset('subject', 'message', 'turnstile_token')
        },
        // Turnstile tokens are single-use; ask for a fresh one after every attempt.
        onFinish: () => captcha.value?.reset(),
    })
}

const inputClass = 'w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none'
</script>

<template>
    <Head title="Contact">
        <meta name="description" content="Get in touch with the AniTrack team. Report a bug, suggest a feature, or ask a question." />
        <link rel="canonical" :href="route('contact')" />
    </Head>

    <div class="mx-auto max-w-5xl py-4">
        <header class="mb-10 space-y-3">
            <h1 class="text-3xl font-bold sm:text-4xl">Contact us</h1>
            <p class="text-lg leading-relaxed text-gray-300">
                Found a bug, got an idea, or just want to talk anime? Send us a message and we will get back to you.
            </p>
        </header>

        <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section>
                <div
                    v-if="sent && flash?.status === 'success'"
                    class="mb-6 rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-sm text-emerald-200"
                    role="status"
                >
                    {{ flash.message }}
                </div>

                <div
                    v-if="captchaUnavailable"
                    class="mb-6 rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-200"
                >
                    The contact form is temporarily unavailable for signed-out visitors.
                    <Link :href="route('login')" class="underline hover:text-amber-100">Sign in</Link> to send a message.
                </div>

                <form class="space-y-5" @submit.prevent="submit">
                    <div class="grid gap-5 sm:grid-cols-2">
                        <div>
                            <label for="name" class="mb-1 block text-sm text-gray-400">Name</label>
                            <input
                                id="name"
                                v-model="form.name"
                                type="text"
                                :class="inputClass"
                                autocomplete="name"
                                maxlength="120"
                                required
                            />
                            <p v-if="form.errors.name" class="mt-1 text-sm text-red-400">{{ form.errors.name }}</p>
                        </div>
                        <div>
                            <label for="email" class="mb-1 block text-sm text-gray-400">Email</label>
                            <input
                                id="email"
                                v-model="form.email"
                                type="email"
                                :class="inputClass"
                                autocomplete="email"
                                maxlength="255"
                                required
                            />
                            <p v-if="form.errors.email" class="mt-1 text-sm text-red-400">{{ form.errors.email }}</p>
                        </div>
                    </div>

                    <div>
                        <label for="subject" class="mb-1 block text-sm text-gray-400">Subject</label>
                        <input
                            id="subject"
                            v-model="form.subject"
                            type="text"
                            :class="inputClass"
                            maxlength="150"
                            required
                        />
                        <p v-if="form.errors.subject" class="mt-1 text-sm text-red-400">{{ form.errors.subject }}</p>
                    </div>

                    <div>
                        <label for="message" class="mb-1 block text-sm text-gray-400">Message</label>
                        <textarea
                            id="message"
                            v-model="form.message"
                            rows="7"
                            :class="inputClass"
                            minlength="10"
                            maxlength="5000"
                            required
                        />
                        <div class="mt-1 flex items-center justify-between text-sm">
                            <p v-if="form.errors.message" class="text-red-400">{{ form.errors.message }}</p>
                            <span v-else />
                            <span class="text-gray-600">{{ form.message.length }} / 5000</span>
                        </div>
                    </div>

                    <!-- Honeypot: hidden from people, tempting to bots. -->
                    <div class="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                        <label for="website">Website</label>
                        <input id="website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
                    </div>

                    <div v-if="requiresCaptcha && turnstileSiteKey">
                        <TurnstileWidget ref="captcha" v-model="form.turnstile_token" :site-key="turnstileSiteKey" />
                        <p v-if="form.errors.turnstile_token" class="mt-1 text-sm text-red-400">{{ form.errors.turnstile_token }}</p>
                    </div>

                    <button
                        type="submit"
                        :disabled="form.processing || captchaBlocked || captchaUnavailable"
                        class="rounded-lg bg-primary-600 px-6 py-2 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {{ form.processing ? 'Sending…' : 'Send message' }}
                    </button>
                </form>
            </section>

            <aside class="space-y-8 text-sm">
                <div>
                    <h2 class="mb-2 font-semibold text-gray-200">Before you write</h2>
                    <ul class="space-y-2 text-gray-400">
                        <li>
                            Wrong or missing anime data? It comes from
                            <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300">AniList</a>.
                            Fixing it there fixes it here on the next sync, unless the synopsis or title is one we wrote ourselves, in which case tell us.
                        </li>
                        <li>
                            Curious how recommendations work?
                            <Link :href="route('how-it-works')" class="text-primary-400 hover:text-primary-300">We explain it here</Link>.
                        </li>
                    </ul>
                </div>

                <div v-if="business">
                    <h2 class="mb-2 font-semibold text-gray-200">Business details</h2>
                    <address class="not-italic leading-relaxed text-gray-400">
                        {{ business.name }}<br />
                        {{ business.address.street }}<br />
                        {{ business.address.district }}<br />
                        {{ business.address.postcode }}<br />
                        {{ business.address.country }}
                    </address>
                    <dl class="mt-3 space-y-1 text-gray-400">
                        <div class="flex gap-2">
                            <dt class="text-gray-500">Business No:</dt>
                            <dd>{{ business.business_number }}</dd>
                        </div>
                        <div class="flex gap-2">
                            <dt class="text-gray-500">VAT Number:</dt>
                            <dd>{{ business.vat_number }}</dd>
                        </div>
                    </dl>
                </div>
            </aside>
        </div>
    </div>
</template>
