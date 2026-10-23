import { seed } from '../seed'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalRepositories, STORAGE_KEY } from '../localRepositories'
import { emptyRequest } from '../../features/requests/validation'
const localStorage = window.localStorage
const input = {
  type: 'individual' as const,
  name: ' Rani ',
  phone: '+62 812',
  email: '',
  address: 'Home'
}
beforeEach(() => localStorage.clear())
describe('local repositories', () => {
  it('reads existing version-1 demo records that exceed new API resource bounds', async () => {
    const db = seed()
    db.customers[0].name = '森'.repeat(201)
    db.requests[0].cargo[0].weight = 0.1234
    db.requests[0].cargo[0].quantity = 1000001
    const bytes = JSON.stringify(db)
    localStorage.setItem(STORAGE_KEY, bytes)
    const r = createLocalRepositories(localStorage)
    expect((await r.customers.list())[0].name).toHaveLength(201)
    expect((await r.requests.list())[0].cargo[0].weight).toBe(0.1234)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(bytes)
  })

  it('persists detached records, independent addresses and immutable creator', async () => {
    const r = createLocalRepositories(localStorage)
    const c = await r.customers.create(input)
    const req = await r.requests.create({
      ...emptyRequest(),
      customerId: c.id,
      cargo: [{ description: 'Motorcycle', quantity: 1 }],
      pickup: { ...emptyRequest().pickup, address: c.address },
      delivery: { ...emptyRequest().delivery, address: 'Warehouse' }
    })
    expect(req.reference).toMatch(/^REQ-\d{6}$/)
    await r.customers.update(c.id, { ...input, address: 'Different' })
    const changed = await r.requests.update(req.id, { ...req, handling: 'Careful' })
    expect(changed.creator).toEqual({ id: 'demo-staff', name: 'Demo staff' })
    expect(changed.createdAt).toBe(req.createdAt)
    expect(changed.pickup.address).toBe('Home')
    changed.pickup.address = 'Mutated'
    expect((await createLocalRepositories(localStorage).requests.get(req.id))?.pickup.address).toBe(
      'Home'
    )
    expect((await r.customers.get(c.id))?.name).toBe('Rani')
  })
  it('allocates unique references and validates customer links', async () => {
    const r = createLocalRepositories(localStorage)
    const c = await r.customers.create(input)
    const x = {
      ...emptyRequest(),
      customerId: c.id,
      cargo: [{ description: 'Car', quantity: 1 }],
      pickup: { ...emptyRequest().pickup, address: 'A' },
      delivery: { ...emptyRequest().delivery, address: 'B' }
    }
    const a = await r.requests.create(x),
      b = await r.requests.create(x)
    expect(a.reference).not.toBe(b.reference)
    expect(a.id).not.toBe(b.id)
    await expect(r.requests.create({ ...x, customerId: 'missing' })).rejects.toThrow()
  })
  it('seeds once and preserves a valid empty database', async () => {
    await createLocalRepositories(localStorage).customers.list()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, nextRequestNumber: 1, customers: [], requests: [] })
    )
    expect(await createLocalRepositories(localStorage).customers.list()).toEqual([])
  })
  it.each([
    '{broken',
    '{"version":2}',
    '{"version":1,"nextRequestNumber":1,"customers":[{}],"requests":[]}'
  ])('preserves corrupt or unsupported data %s', async (bytes) => {
    localStorage.setItem(STORAGE_KEY, bytes)
    await expect(createLocalRepositories(localStorage).customers.list()).rejects.toThrow()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(bytes)
  })
  it('does not overwrite existing bytes when writes fail', async () => {
    const r = createLocalRepositories(localStorage)
    await r.customers.list()
    const before = localStorage.getItem(STORAGE_KEY)
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota')
    })
    await expect(r.customers.create(input)).rejects.toThrow()
    spy.mockRestore()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
  })
  it('surfaces unavailable storage reads', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Unavailable')
    })
    await expect(createLocalRepositories(localStorage).customers.list()).rejects.toThrow()
    spy.mockRestore()
  })
})
