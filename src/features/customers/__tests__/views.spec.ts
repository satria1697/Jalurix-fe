import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import CustomerForm from '../views/CustomerForm.vue'
import CustomerList from '../views/CustomerList.vue'
const placeholder = { template: '<div />' }
async function page(component: any, path = '/customers/new') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/customers/new', component: CustomerForm },
      { path: '/customers/:id/edit', component: CustomerForm },
      { path: '/customers/:id', name: 'customer-detail', component: placeholder },
      { path: '/customers', component: CustomerList }
    ]
  })
  await router.push(path)
  const w = mount(
    { components: { RouterView }, template: '<RouterView :key="$route.fullPath" />' },
    { global: { plugins: [createPinia(), router] } }
  )
  await flushPromises()
  return { w, router }
}
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
describe('customer views', () => {
  it('validates then creates a customer and navigates to detail', async () => {
    const { w, router } = await page(CustomerForm)
    await w.get('form').trigger('submit')
    expect(w.text()).toContain('Enter a customer name.')
    await w.get('#name').setValue('New customer')
    await w.get('#phone').setValue('0812345')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('customer-detail')
    expect(
      JSON.parse(localStorage.getItem('jalurix.fr01.v1')!).customers.some(
        (c: any) => c.name === 'New customer'
      )
    ).toBe(true)
    w.unmount()
  })
  it('keeps input on failed save', async () => {
    const { w, router } = await page(CustomerForm)
    await w.get('#name').setValue('Retained')
    await w.get('#phone').setValue('123')
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota')
    })
    await w.get('form').trigger('submit')
    await flushPromises()
    expect((w.get('#name').element as HTMLInputElement).value).toBe('Retained')
    expect(w.text()).toContain('Could not save')
    expect(router.currentRoute.value.path).toBe('/customers/new')
    spy.mockRestore()
    w.unmount()
  })
  it('loads edits and missing IDs safely', async () => {
    const { w } = await page(CustomerForm, '/customers/sample-c1/edit')
    expect((w.get('#name').element as HTMLInputElement).value).toBe('Rimba Motor Collective')
    w.unmount()
    const missing = await page(CustomerForm, '/customers/missing/edit')
    expect(missing.w.text()).toContain('Customer not found')
    missing.w.unmount()
  })
  it('recovers an edit after initial storage failure', async () => {
    const { createLocalRepositories } = await import('../../../data/localRepositories')
    await createLocalRepositories(localStorage).customers.list()
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw Error('blocked')
    })
    const { w } = await page(CustomerForm, '/customers/sample-c1/edit')
    expect(w.text()).toContain('unavailable')
    spy.mockRestore()
    await w.get('button').trigger('click')
    await flushPromises()
    expect((w.get('#name').element as HTMLInputElement).value).toBe('Rimba Motor Collective')
    w.unmount()
  })
  it('searches case-insensitively and filters type', async () => {
    const { w } = await page(CustomerList, '/customers')
    await w.get('#customer-search').setValue('ARUNA')
    expect(w.text()).toContain('Aruna Pratama')
    expect(w.text()).not.toContain('Rimba Motor Collective')
    await w.get('#customer-type-filter').setValue('business')
    expect(w.text()).toContain('No matching customers')
    w.unmount()
  })
})
