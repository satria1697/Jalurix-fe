<script setup lang="ts">
import MiButton from '@/components/global/MiButton.vue'
</script>

<template>
  <div class="flex flex-col m-10">
    <div class="flex flex-col space-y-3">
      <span class="text-4xl font-semibold">Button</span>
      <div>
        <span>Normal Button</span>
        <mi-button text="Button" />
      </div>
      <div>
        <span>Full Length Button</span>
        <mi-button length="full" text="Button" />
      </div>
      <div>
        <span>Big size button</span>
        <mi-button size="big" text="Button" />
      </div>
      <div>
        <span>Small size button</span>
        <mi-button size="small" text="Button" />
      </div>
      <div>
        <span>Button text position in middle </span>
        <mi-button text-position="middle" length="full" text="Button" />
      </div>
      <div>
        <span>Button outline type</span>
        <mi-button type="outline" text="Button" />
      </div>
      <div>
        <span>Button empty type</span>
        <mi-button type="empty" text="Button" />
      </div>
    </div>
  </div>
</template>
