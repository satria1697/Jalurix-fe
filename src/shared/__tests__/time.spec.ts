import { describe, it, expect } from 'vitest'
import { toUtc, toWib } from '../time'
describe('WIB conversion', () => {
  it('uses WIB regardless of host timezone', () => {
    expect(toUtc('2026-10-22T09:00')).toBe('2026-10-22T02:00:00.000Z')
    expect(toWib('2026-10-22T02:00:00.000Z')).toBe('2026-10-22T09:00')
  })
  it('rejects invalid dates', () => {
    expect(() => toUtc('2026-02-30T09:00')).toThrow()
    expect(() => toUtc('bad')).toThrow()
  })
})
