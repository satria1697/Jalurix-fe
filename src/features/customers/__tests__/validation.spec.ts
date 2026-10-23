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

it('bounds customer Unicode name and contact fields for the API', () => {
  const input = {
    type: 'individual' as const,
    name: '森'.repeat(201),
    phone: '1'.repeat(51),
    email: '',
    address: 'a'.repeat(2001)
  }
  const errors = validateCustomer(input)
  expect(errors.name).toBeTruthy()
  expect(errors.phone).toBeTruthy()
  expect(errors.address).toBeTruthy()
})
