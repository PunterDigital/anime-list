<script setup lang="ts">
import { fieldClasses } from './fieldClasses'

// Card 4272: replaces PrimeVue's InputText. Other attributes (type,
// placeholder, disabled, class, listeners) go straight to the input.
withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false })

const model = defineModel<string | null | undefined>()
</script>

<template>
    <input
        v-model="model"
        type="text"
        :class="fieldClasses(invalid)"
        :aria-invalid="invalid || undefined"
    />
</template>
