import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createHttpRepositories } from '../httpRepositories'
import { getRepositories, dataSource } from '../repositories'
import { ApiError } from '../apiError'
import { seed } from '../seed'
const customer = seed().customers[0]
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
describe('HTTP repositories', () => {
  it('follows all pages without silently returning a partial collection', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({ data: [customer], pagination: { page: 1, pageSize: 1, total: 2 } })
      )
      .mockResolvedValueOnce(
        response({
          data: [{ ...customer, id: 'second' }],
          pagination: { page: 2, pageSize: 1, total: 2 }
        })
      )
    const r = createHttpRepositories('/api/v1', fetcher)
    expect((await r.customers.list()).map((c) => c.id)).toEqual(['sample-c1', 'second'])
    expect(fetcher.mock.calls[1][0]).toContain('page=2')
  })
  it('rejects later-page failures and nonprogressing pages', async () => {
    for (const second of [
      response({ error: { code: 'unavailable', message: 'Unavailable' } }, 503),
      response({ data: [], pagination: { page: 2, pageSize: 1, total: 2 } })
    ]) {
      const f = vi
        .fn()
        .mockResolvedValueOnce(
          response({ data: [customer], pagination: { page: 1, pageSize: 1, total: 2 } })
        )
        .mockResolvedValueOnce(second)
      await expect(createHttpRepositories('/api/v1', f).customers.list()).rejects.toThrow()
    }
  })
  it('strips metadata and keeps structured server field errors', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(response({ data: customer }, 201))
      .mockResolvedValueOnce(
        response(
          {
            error: {
              code: 'validation_failed',
              message: 'Check fields',
              fields: { name: 'Too long' }
            }
          },
          422
        )
      )
    const r = createHttpRepositories('/api/v1', f)
    await r.customers.create(customer)
    expect(JSON.parse(f.mock.calls[0][1].body)).not.toHaveProperty('id')
    expect(JSON.parse(f.mock.calls[0][1].body)).not.toHaveProperty('createdAt')
    try {
      await r.customers.create(customer)
      throw Error('accepted')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).fields).toEqual({ name: 'Too long' })
    }
    expect(localStorage.length).toBe(0)
  })
  it('strips metadata from request editing', async () => {
    const r = seed().requests[0],
      f = vi.fn().mockResolvedValue(response({ data: r }))
    await createHttpRepositories('/api/v1', f).requests.update(r.id, r)
    const body = JSON.parse(f.mock.calls[0][1].body)
    expect(body).not.toHaveProperty('creator')
    expect(body).not.toHaveProperty('reference')
    expect(body).not.toHaveProperty('id')
    expect(body.cargo).toHaveLength(1)
  })
  it('maps missing records to undefined, rejects malformed success', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(response({ error: { code: 'not_found', message: 'Missing' } }, 404))
      .mockResolvedValueOnce(response({ data: { name: 'bad' } }))
    const r = createHttpRepositories('/api/v1', f)
    expect(await r.customers.get('missing')).toBeUndefined()
    await expect(r.customers.get('bad')).rejects.toThrow()
  })
  it('bounds the entire collection load to ten seconds', async () => {
    vi.useFakeTimers()
    const f = vi
      .fn()
      .mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) =>
            init.signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError'))
            )
          )
      )
    const p = createHttpRepositories('/api/v1', f).customers.list()
    const check = expect(p).rejects.toThrow(/timed out/i)
    await vi.advanceTimersByTimeAsync(10000)
    await check
  })
  it('defaults to local and API mode never imports browser records', async () => {
    expect(dataSource()).toBe('local')
    await getRepositories().customers.list()
    const bytes = localStorage.getItem('jalurix.fr01.v1')
    vi.stubEnv('VITE_DATA_SOURCE', 'api')
    const f = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response({ data: [], pagination: { page: 1, pageSize: 100, total: 0 } }))
    expect(await getRepositories().customers.list()).toEqual([])
    expect(localStorage.getItem('jalurix.fr01.v1')).toBe(bytes)
    f.mockRestore()
  })
})
