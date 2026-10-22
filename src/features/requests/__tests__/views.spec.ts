import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import RequestForm from '../views/RequestForm.vue'
import RequestList from '../views/RequestList.vue'
import CustomerForm from '../../customers/views/CustomerForm.vue'
const blank = { template: '<div>Detail page</div>' }
async function page(path = '/requests/new') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/requests/new', component: RequestForm },
      { path: '/requests/:id/edit', component: RequestForm },
      { path: '/requests/:id', name: 'request-detail', component: blank },
      { path: '/requests', component: RequestList },
      { path: '/customers/new', component: CustomerForm },
      { path: '/customers/:id', name: 'customer-detail', component: blank }
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
async function fill(w: any) {
  await w.get('#customerId').setValue('sample-c1')
  await w.get('#cargo-0-description').setValue('Motorcycle')
  await w.get('#pickup-address').setValue('Home pickup')
  await w.get('#delivery-address').setValue('Warehouse delivery')
}
describe('request views', () => {
  it('creates a draft with independent addresses and WIB schedule', async () => {
    const { w, router } = await page()
    await fill(w)
    await w.get('#pickupAt').setValue('2026-10-24T09:00')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('request-detail')
    const r = JSON.parse(localStorage.getItem('jalurix.fr01.v1')!).requests.at(-1)
    expect(r.pickup.address).toBe('Home pickup')
    expect(r.delivery.address).toBe('Warehouse delivery')
    expect(r.pickupAt).toBe('2026-10-24T02:00:00.000Z')
    expect(r.creator.name).toBe('Demo staff')
    w.unmount()
  })
  it('adds cargo and copies only the selected address', async () => {
    const { w } = await page()
    await w.get('#customerId').setValue('sample-c1')
    await w.get('[data-copy="pickup"]').trigger('click')
    expect((w.get('#pickup-address').element as HTMLTextAreaElement).value).toContain('Taman Rimba')
    expect((w.get('#delivery-address').element as HTMLTextAreaElement).value).toBe('')
    await w.get('[data-add-cargo]').trigger('click')
    expect(w.findAll('[data-cargo-row]')).toHaveLength(2)
    w.unmount()
  })
  it('validates schedule and retains fields when save fails', async () => {
    const { w, router } = await page()
    await fill(w)
    await w.get('#pickupAt').setValue('2026-10-25T10:00')
    await w.get('#deliveryAt').setValue('2026-10-24T10:00')
    await w.get('form').trigger('submit')
    expect(w.text()).toContain('Delivery cannot be before pickup.')
    await w.get('#deliveryAt').setValue('')
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota')
    })
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(w.text()).toContain('Could not save')
    expect((w.get('#pickup-address').element as HTMLTextAreaElement).value).toBe('Home pickup')
    expect(router.currentRoute.value.path).toBe('/requests/new')
    spy.mockRestore()
    w.unmount()
  })
  it('loads existing edits and handles missing records', async () => {
    const a = await page('/requests/sample-r1/edit')
    expect((a.w.get('#cargo-0-description').element as HTMLInputElement).value).toBe('Honda CB150R')
    a.w.unmount()
    const b = await page('/requests/missing/edit')
    expect(b.w.text()).toContain('Request not found')
    b.w.unmount()
  })
  it('restores a draft after customer creation and clears it after request save', async () => {
    const { w, router } = await page()
    await fill(w)
    await w.get('[data-new-customer]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/customers/new')
    await w.get('#name').setValue('New request customer')
    await w.get('#phone').setValue('08123')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/requests/new')
    expect((w.get('#pickup-address').element as HTMLTextAreaElement).value).toBe('Home pickup')
    const id = (w.get('#customerId').element as HTMLSelectElement).value
    expect(id).not.toBe('sample-c1')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('request-detail')
    expect(sessionStorage.getItem('jalurix.request-editor.v1')).toBeNull()
    w.unmount()
  })
  it('restores on customer cancel and surfaces invalid draft storage', async () => {
    const { w, router } = await page()
    await fill(w)
    await w.get('[data-new-customer]').trigger('click')
    await flushPromises()
    await router.push('/requests/new?resume=1')
    await flushPromises()
    expect((w.get('#pickup-address').element as HTMLTextAreaElement).value).toBe('Home pickup')
    w.unmount()
    sessionStorage.setItem('jalurix.request-editor.v1', 'broken')
    const bad = await page('/requests/new?resume=1')
    expect(bad.w.text()).toContain('draft could not be restored')
    bad.w.unmount()
  })
  it('keeps the request open if draft storage fails', async () => {
    const { w, router } = await page()
    await fill(w)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota')
    })
    await w.get('[data-new-customer]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/requests/new')
    expect((w.get('#pickup-address').element as HTMLTextAreaElement).value).toBe('Home pickup')
    spy.mockRestore()
    w.unmount()
  })
  it('protects dirty navigation and allows canceling the confirmation', async () => {
    const { w, router } = await page()
    await fill(w)
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await router.push('/requests')
    expect(router.currentRoute.value.path).toBe('/requests/new')
    spy.mockRestore()
    w.unmount()
  })
  it('restores pending request when browser Back leaves customer creation', async () => {
    const { w, router } = await page()
    await fill(w)
    await w.get('[data-new-customer]').trigger('click')
    await flushPromises()
    router.back()
    await flushPromises()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/requests/new')
    expect((w.get('#pickup-address').element as HTMLTextAreaElement).value).toBe('Home pickup')
    w.unmount()
  })
  it('keeps resumed unsubmitted requests dirty and clears draft only after discard', async () => {
    const { w, router } = await page()
    await fill(w)
    await w.get('[data-new-customer]').trigger('click')
    await flushPromises()
    await router.push('/requests/new?resume=1')
    await flushPromises()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    await router.push('/requests')
    expect(router.currentRoute.value.path).toBe('/requests/new')
    expect(sessionStorage.getItem('jalurix.request-editor.v1')).not.toBeNull()
    confirm.mockReturnValue(true)
    await router.push('/requests')
    expect(router.currentRoute.value.path).toBe('/requests')
    expect(sessionStorage.getItem('jalurix.request-editor.v1')).toBeNull()
    confirm.mockRestore()
    w.unmount()
  })
  it('searches route and cargo text', async () => {
    const { w } = await page('/requests')
    await w.get('#request-search').setValue('VESPA')
    expect(w.text()).toContain('Vespa Primavera')
    expect(w.text()).not.toContain('Honda CB150R')
    w.unmount()
  })
})
