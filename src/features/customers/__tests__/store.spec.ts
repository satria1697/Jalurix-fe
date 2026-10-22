import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCustomerStore } from '../store'
beforeEach(() => { setActivePinia(createPinia()); window.localStorage.clear() })
describe('customer store', () => {
  it('surfaces corrupt storage without phantom records', async () => { localStorage.setItem('jalurix.fr01.v1', 'broken'); const store = useCustomerStore(); await store.load(); expect(store.error).toBeTruthy(); expect(store.items).toEqual([]) })
  it('updates existing records without duplicates', async () => { const s = useCustomerStore(); const c = await s.save({ type: 'individual', name: 'New', phone: '123', email: '', address: '' }); await s.save({ ...c, name: 'Edited' }, c.id); expect(s.items.filter(x => x.id === c.id)).toHaveLength(1); expect(s.items.find(x => x.id === c.id)?.name).toBe('Edited') })
  it('rejects failed saves without inserting records', async () => { const s = useCustomerStore(); await s.load(); const count = s.items.length; const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota') }); await expect(s.save({ type: 'individual', name: 'New', phone: '123', email: '', address: '' })).rejects.toThrow(); expect(s.items).toHaveLength(count); spy.mockRestore() })
})
