<script setup lang="ts">
import { computed, PropType } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  type: {
    type: String as PropType<'normal' | 'outline' | 'empty'>,
    default: 'normal'
  },
  length: {
    type: String as PropType<'full' | 'fit'>,
    default: 'fit'
  },
  size: {
    type: String as PropType<'big' | 'normal' | 'small'>,
    default: 'normal'
  },
  textPosition: {
    type: String as PropType<'left' | 'middle'>,
    default: 'left'
  }
})

const classList = computed(() => {
  const baseValue = ['hover:bg-secondary', 'transition', 'hover:text-white', 'rounded-md']

  if (props.size === 'normal') {
    baseValue.push('py-1.5', 'px-2.5')
  }
  if (props.size == 'small') {
    baseValue.push('py-0.5', 'px-1.5')
  }
  if (props.size == 'big') {
    baseValue.push('py-2.5', 'px-3.5')
  }
  if (props.length === 'full') {
    baseValue.push('w-full')
  }

  if (props.textPosition === 'left') {
    baseValue.push('flex items-start')
  }

  if (props.type === 'outline') {
    baseValue.push('hover:bg-primary border-primary border')
    return baseValue.join(' ')
  }

  if (props.type === 'empty') {
    baseValue.push('hover:bg-primary')
    return baseValue.join(' ')
  }
  baseValue.push('bg-primary', 'text-quaternary')
  return baseValue.join(' ')
})
</script>

<template>
  <button :class="classList" class="">
    <slot>
      {{ text }}
    </slot>
  </button>
</template>
