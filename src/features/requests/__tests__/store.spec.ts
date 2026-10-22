import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRequestStore } from '../store'
beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})
describe('request store', () => {
  it('keeps creator and replaces edits', async () => {
    const s = useRequestStore()
    await s.load()
    const old = s.items[0]
    await s.save({ ...old, handling: 'Careful' }, old.id)
    expect(s.items.filter((x) => x.id === old.id)).toHaveLength(1)
    expect(s.items.find((x) => x.id === old.id)?.creator.name).toBe('Demo staff')
  })
  it('surfaces load errors', async () => {
    localStorage.setItem('jalurix.fr01.v1', 'broken')
    const s = useRequestStore()
    await s.load()
    expect(s.error).toBeTruthy()
  })
})
