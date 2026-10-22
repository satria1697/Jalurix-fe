<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })
const paths: Record<string, string> = {
  leaf: 'M20 4C11 2 3 6 4 14c1 7 13 8 16-10ZM4 21 15 10M8 15v-5m3 2h5',
  requests: 'M7 3h10v4H7zM5 5H3v16h18V5h-2M7 12h10M7 16h6',
  customers: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m8-7.87a4 4 0 0 1 0 7.75',
  plus: 'M12 5v14M5 12h14', search: 'm21 21-4.5-4.5M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16',
  arrow: 'M4 12h16m-6-6 6 6-6 6', pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  box: 'm3 7 9-5 9 5v10l-9 5-9-5Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  back: 'M20 12H4m6-6-6 6 6 6', edit: 'm16 3 5 5-13 13H3v-5ZM14 5l5 5',
  menu: 'M4 6h16M4 12h16M4 18h16', close: 'm6 6 12 12M6 18 18 6', check: 'm5 12 4 4L19 6',
  mail: 'M3 5h18v14H3Zm0 0 9 8 9-8', phone: 'M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4c0 5-18-2-18-14Z'
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.leaf" /></svg></template>
