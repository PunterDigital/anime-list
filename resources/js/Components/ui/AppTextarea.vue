<script setup lang="ts">
import { fieldClasses } from './fieldClasses'

// Card 4272: replaces PrimeVue's Textarea. Other attributes (rows,
// placeholder, class, listeners) go straight to the textarea.
withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false })

const model = defineModel<string | null | undefined>()
</script>

<template>
    <textarea
        v-model="model"
        :class="fieldClasses(invalid)"
        :aria-invalid="invalid || undefined"
    />
</template>
