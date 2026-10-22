import { describe, it, expect } from 'vitest'
import { validateCustomer } from '../validation'
describe('customer validation', () => {
  const input = {
    type: 'individual' as const,
    name: 'Rani',
    phone: '+62 (812) 345-678',
    email: '',
    address: ''
  }
  it('accepts international phone formats and optional email', () =>
    expect(validateCustomer(input)).toEqual({}))
  it('rejects blank name and phone', () => {
    const e = validateCustomer({ ...input, name: '  ', phone: '' })
    expect(e.name).toBeTruthy()
    expect(e.phone).toBeTruthy()
  })
  it('rejects malformed optional email', () =>
    expect(validateCustomer({ ...input, email: 'invalid' }).email).toBeTruthy())
})
