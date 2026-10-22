<script setup lang="ts"></script>

<template>
  <div class="grid grid-cols-[20rem,1fr]">
    <div class="flex flex-col border-r-4 border-r-black h-screen">
      <div class="p-2">
        <span class="text-4xl font-semibold">Component List</span>
      </div>
      <div class="flex flex-col m-2">
        <router-link
          active-class="bg-primary py-0.5 px-1.5 rounded-md"
          :to="{ name: 'story-book:button' }"
          >Button
        </router-link>
      </div>
    </div>
    <div>
      <router-view />
    </div>
  </div>
</template>
