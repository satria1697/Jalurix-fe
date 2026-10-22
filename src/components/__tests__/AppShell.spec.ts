import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppShell from '../layout/AppShell.vue'
it('offers customer and request navigation with local demo disclosure', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }]
  })
  await router.push('/requests')
  const w = mount(AppShell, { global: { plugins: [router] } })
  expect(w.find('a[href="/customers"]').exists()).toBe(true)
  expect(w.find('a[href="/requests"]').exists()).toBe(true)
  expect(w.text()).toContain('Local demo — data saved in this browser')
})
