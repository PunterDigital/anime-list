<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useForm } from '@inertiajs/vue3'
import { useWebpass, Webpass } from '@/composables/useWebpass'
import AppLayout from '@/Layouts/AppLayout.vue'

const webpass = useWebpass()

defineOptions({ layout: AppLayout })

const form = useForm({
    email: '',
    password: '',
})

const passkeySupported = ref(false)
const passkeyError = ref<string | null>(null)
const passkeyBusy = ref(false)

onMounted(() => {
    passkeySupported.value = Webpass.isSupported()
})

function submit() {
    form.post(route('login'))
}

async function signInWithPasskey() {
    passkeyError.value = null
    passkeyBusy.value = true

    try {
        const { success, error } = await webpass.assert(
            {
                path: route('webauthn.login.options'),
                body: form.email ? { email: form.email } : {},
            },
            { path: route('webauthn.login') },
        )

        if (success) {
            window.location.href = route('home')
            return
        }

        passkeyError.value = error instanceof Error ? error.message : "Couldn't sign in with a passkey."
    } catch (e) {
        passkeyError.value = e instanceof Error ? e.message : "Couldn't sign in with a passkey."
    } finally {
        passkeyBusy.value = false
    }
}
</script>

<template>
    <Head title="Login" />
    <div class="max-w-md mx-auto mt-16">
        <h1 class="text-2xl font-bold mb-6">Login</h1>
        <form class="space-y-4" @submit.prevent="submit">
            <div>
                <label for="email" class="block text-sm text-gray-400 mb-1">Email</label>
                <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none"
                    required
                    autofocus
                />
                <p v-if="form.errors.email" class="text-red-400 text-sm mt-1">{{ form.errors.email }}</p>
            </div>
            <div>
                <label for="password" class="block text-sm text-gray-400 mb-1">Password</label>
                <input
                    id="password"
                    v-model="form.password"
                    type="password"
                    class="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:border-primary-500 focus:outline-none"
                    required
                />
                <p v-if="form.errors.password" class="text-red-400 text-sm mt-1">{{ form.errors.password }}</p>
            </div>
            <button
                type="submit"
                :disabled="form.processing"
                class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition disabled:opacity-50"
            >
                Login
            </button>
        </form>

        <template v-if="passkeySupported">
            <div class="flex items-center gap-3 my-6">
                <span class="flex-1 h-px bg-gray-800" />
                <span class="text-xs text-gray-500 uppercase tracking-wider">or</span>
                <span class="flex-1 h-px bg-gray-800" />
            </div>
            <button
                type="button"
                :disabled="passkeyBusy"
                class="w-full flex items-center justify-center gap-2 border border-gray-700 hover:bg-gray-900 text-gray-100 py-2 rounded-lg transition disabled:opacity-50"
                @click="signInWithPasskey"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
                    <path d="M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
                    <path d="m13 11 8 8-2 2-1-1-1 1-1-1-1 1-1-1-1 1-2-2v-3l2-5Z" />
                </svg>
                <span v-if="passkeyBusy">Waiting for passkey…</span>
                <span v-else>Sign in with a passkey</span>
            </button>
            <p v-if="passkeyError" class="text-red-400 text-sm mt-2 text-center">{{ passkeyError }}</p>
        </template>

        <p class="text-gray-500 text-sm mt-6 text-center">
            Don't have an account? <Link :href="route('register')" class="text-primary-400 hover:text-primary-300">Sign up</Link>
        </p>
    </div>
</template>
