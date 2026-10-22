<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
const open = ref(false),
  route = useRoute()
</script>
<template>
  <div class="app-layout">
    <aside class="sidebar" :class="{ 'is-open': open }">
      <RouterLink to="/requests" class="brand" @click="open = false"
        ><span class="brand-symbol"><AppIcon name="leaf" :size="27" /></span>jalurix<span
          class="brand-dot"
          >.</span
        ></RouterLink
      >
      <div class="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">
        <RouterLink
          to="/requests"
          :class="{ active: route.path.startsWith('/requests') }"
          @click="open = false"
          ><AppIcon name="requests" />Transport requests<AppIcon name="arrow" :size="15"
        /></RouterLink>
        <RouterLink
          to="/customers"
          :class="{ active: route.path.startsWith('/customers') }"
          @click="open = false"
          ><AppIcon name="customers" />Customers</RouterLink
        >
      </nav>
      <div class="sidebar-garden">
        <AppIcon name="leaf" :size="38" />
        <p>Every shipment.<br /><em>One clear path.</em></p>
        <div class="garden-line"></div>
        <span>Room to grow, built in.</span>
      </div>
      <div class="staff">
        <span class="avatar">DS</span>
        <div><strong>Demo staff</strong><small>Local workspace</small></div>
        <span class="online-dot"></span>
      </div>
    </aside>
    <button
      v-if="open"
      class="sidebar-backdrop"
      aria-label="Close navigation"
      @click="open = false"
    ></button>
    <div class="main-area">
      <header class="topbar">
        <div class="breadcrumb">
          <button
            class="icon-button mobile-menu"
            aria-label="Open navigation"
            @click="open = !open"
          >
            <AppIcon name="menu" /></button
          ><span>Workspace</span><span class="crumb-divider">/</span
          ><strong>{{
            route.path.startsWith('/customers') ? 'Customers' : 'Transport requests'
          }}</strong>
        </div>
        <span class="topbar-tag"><span class="online-dot"></span>FR-01 · Intake workspace</span>
      </header>
      <main id="main-content"><RouterView :key="route.fullPath" /></main>
      <footer class="app-footer">
        <span><span class="demo-dot"></span>Local demo — data saved in this browser</span
        ><span>Jalurix · A clearer way forward</span>
      </footer>
    </div>
  </div>
</template>
