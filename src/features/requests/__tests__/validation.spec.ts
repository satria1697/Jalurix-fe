import { describe, it, expect } from 'vitest'
import { validateRequest, emptyRequest } from '../validation'

describe('request validation', () => {
  const valid = () => ({
    ...emptyRequest(),
    customerId: 'customer-1',
    cargo: [{ description: 'Motorcycle', quantity: 1 }],
    pickup: {
      type: 'residential' as const,
      address: 'Jakarta home',
      contactName: '',
      contactPhone: '',
      instructions: ''
    },
    delivery: {
      type: 'warehouse' as const,
      address: 'Bandung warehouse',
      contactName: '',
      contactPhone: '',
      instructions: ''
    }
  })
  it('accepts separate addresses and optional schedule/measurements', () =>
    expect(validateRequest(valid())).toEqual({}))
  it.each([0, -1, 1.5, NaN])('rejects invalid quantity %s', (quantity) =>
    expect(
      validateRequest({ ...valid(), cargo: [{ description: 'Car', quantity }] })['cargo.0.quantity']
    ).toBeTruthy()
  )
  it('requires cargo and customer', () => {
    const e = validateRequest(emptyRequest())
    expect(e.customerId).toBeTruthy()
    expect(e.cargo).toBeTruthy()
  })
  it('rejects nonpositive measurements', () =>
    expect(
      validateRequest({ ...valid(), cargo: [{ description: 'Car', quantity: 1, weight: 0 }] })[
        'cargo.0.weight'
      ]
    ).toBeTruthy())
  it('requires coordinate pairs and validates bounds', () => {
    const x = valid()
    Object.assign(x.pickup, { latitude: -90, longitude: 180 })
    expect(validateRequest(x)).toEqual({})
    Object.assign(x.pickup, { latitude: 91 })
    expect(validateRequest(x)['pickup.latitude']).toBeTruthy()
    Object.assign(x.pickup, { latitude: 5, longitude: undefined })
    expect(validateRequest(x)['pickup.longitude']).toBeTruthy()
  })
  it('rejects delivery before pickup and malformed instants', () => {
    expect(
      validateRequest({
        ...valid(),
        pickupAt: '2026-10-22T03:00:00.000Z',
        deliveryAt: '2026-10-22T02:00:00.000Z'
      }).deliveryAt
    ).toBeTruthy()
    expect(validateRequest({ ...valid(), pickupAt: 'bad' }).pickupAt).toBeTruthy()
  })
})
