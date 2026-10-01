<script setup lang="ts">
defineOptions({ layout: false })

const props = defineProps<{
    status: number
}>()

const titles: Record<number, string> = {
    403: 'Forbidden',
    404: 'Not Found',
    419: 'Session Expired',
    451: 'Unavailable',
    500: 'Server Error',
    503: 'Service Unavailable',
}

const descriptions: Record<number, string> = {
    403: 'You don\'t have permission to access this page.',
    404: 'The page you\'re looking for doesn\'t exist.',
    419: 'Your session has expired. Please refresh the page and try again.',
    451: 'This page has been removed and is no longer available.',
    500: 'Something went wrong on our end. Please try again later.',
    503: 'We\'re currently undergoing maintenance. Please check back soon.',
}
</script>

<template>
    <Head :title="`${status} - ${titles[status] ?? 'Error'}`" />
    <div class="flex min-h-screen items-center justify-center bg-gray-950 text-center dark">
        <div>
            <h1 class="text-6xl font-bold text-gray-700">{{ status }}</h1>
            <p class="text-xl font-medium text-gray-400 mt-2">{{ titles[status] ?? 'Error' }}</p>
            <p class="text-gray-500 mt-4">{{ descriptions[status] ?? 'An unexpected error occurred.' }}</p>
            <a href="/" class="text-primary-400 hover:text-primary-300 mt-6 inline-block transition">
                Go Home
            </a>
        </div>
    </div>
</template>
