<script setup lang="ts">
defineProps<{ label: string; id: string; error?: string; hint?: string }>()
</script>
<template><div class="field"><label :for="id">{{ label }}</label><slot :invalid="!!error" :described-by="error ? `${id}-error` : hint ? `${id}-hint` : undefined" /><span v-if="error" :id="`${id}-error`" class="field-error" role="alert">{{ error }}</span><span v-else-if="hint" :id="`${id}-hint`" class="field-hint">{{ hint }}</span></div></template>
