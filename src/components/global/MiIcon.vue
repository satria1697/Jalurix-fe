<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PropType } from 'vue'
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  size: {
    type: String as PropType<'small' | 'large' | 'medium' | 'extra-large'>,
    default: 'medium'
  },
  isClickable: {
    type: Boolean,
    default: false
  }
})

const classList = computed(() => {
  const list: Array<String> = ['text-primary']
  if (props.size == 'small') {
    list.push('text-xs')
  }
  if (props.size == 'large') {
    list.push('text-lg')
  }
  if (props.size == 'extra-large') {
    list.push('text-2xl')
  }
  if (props.isClickable) {
    list.push('hover:cursor-pointer hover:text-gray-500 transition')
  }
  return list.join(' ')
})
</script>

<template>
  <icon :icon="icon" :class="classList" />
</template>
