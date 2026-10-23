import { afterEach, expect, it, vi } from 'vitest'
import { emptyRequest } from '../validation'
import { readDraft, saveDraft, clearDraft } from '../draft'
afterEach(() => {
  vi.unstubAllEnvs()
  sessionStorage.clear()
})
it('keeps browser-demo and API drafts isolated', () => {
  const local = {
    version: 1 as const,
    input: { ...emptyRequest(), handling: 'local-only' },
    pickupLocal: '',
    deliveryLocal: ''
  }
  saveDraft(local)
  vi.stubEnv('VITE_DATA_SOURCE', 'api')
  expect(readDraft()).toBeUndefined()
  saveDraft({ ...local, input: { ...local.input, handling: 'api-only' } })
  expect(readDraft()?.input.handling).toBe('api-only')
  clearDraft()
  vi.stubEnv('VITE_DATA_SOURCE', 'local')
  expect(readDraft()?.input.handling).toBe('local-only')
})
