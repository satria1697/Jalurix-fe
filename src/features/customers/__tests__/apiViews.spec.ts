import { afterEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import CustomerForm from '../views/CustomerForm.vue'
import { seed } from '../../../data/seed'
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})
async function page(path = '/customers/new') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/customers', component: { template: '<div />' } },
      { path: '/customers/new', component: CustomerForm },
      { path: '/customers/:id/edit', component: CustomerForm },
      { path: '/customers/:id', name: 'customer-detail', component: { template: '<div />' } }
    ]
  })
  await router.push(path)
  const w = mount(
    { components: { RouterView }, template: '<RouterView />' },
    { global: { plugins: [createPinia(), router] } }
  )
  await flushPromises()
  return { w, router }
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })
it('displays API field errors and keeps user input on save failure', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api')
  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(json({ data: [], pagination: { page: 1, pageSize: 100, total: 0 } }))
    .mockResolvedValueOnce(
      json(
        {
          error: {
            code: 'validation_failed',
            message: 'Check fields',
            fields: { name: 'Server rejected this name' }
          }
        },
        422
      )
    )
  const { w, router } = await page()
  await w.get('#name').setValue('Kept')
  await w.get('#phone').setValue('123')
  await w.get('form').trigger('submit')
  await flushPromises()
  expect(w.text()).toContain('Server rejected this name')
  expect((w.get('#name').element as HTMLInputElement).value).toBe('Kept')
  expect(router.currentRoute.value.path).toBe('/customers/new')
  w.unmount()
})
it('loads an edit by ID rather than a potentially incomplete list', async () => {
  vi.stubEnv('VITE_DATA_SOURCE', 'api')
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ data: seed().customers[0] }))
  const { w } = await page('/customers/sample-c1/edit')
  expect((w.get('#name').element as HTMLInputElement).value).toBe('Rimba Motor Collective')
  expect(f.mock.calls[0][0]).toBe('/api/v1/customers/sample-c1')
  w.unmount()
})
