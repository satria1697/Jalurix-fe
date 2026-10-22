import type { Customer } from '../features/customers/types'
import type { TransportRequest } from '../features/requests/types'
import { validateCustomer } from '../features/customers/validation'
import { validateRequest } from '../features/requests/validation'
export interface Database {
  version: 1
  nextRequestNumber: number
  customers: Customer[]
  requests: TransportRequest[]
}
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x)
const strings = (x: Record<string, unknown>, keys: string[]) =>
  keys.every((k) => typeof x[k] === 'string')
const timestamp = (x: unknown) =>
  typeof x === 'string' && /Z$/.test(x) && Number.isFinite(Date.parse(x))
function customer(x: unknown): x is Customer {
  return (
    object(x) &&
    strings(x, ['id', 'type', 'name', 'phone', 'email', 'address']) &&
    !!x.id &&
    timestamp(x.createdAt) &&
    timestamp(x.updatedAt) &&
    !Object.keys(validateCustomer(x as unknown as Customer)).length
  )
}
function location(x: unknown): boolean {
  return (
    object(x) &&
    strings(x, ['type', 'address', 'contactName', 'contactPhone', 'instructions']) &&
    ['latitude', 'longitude'].every((k) => x[k] === undefined || typeof x[k] === 'number')
  )
}
function request(x: unknown): x is TransportRequest {
  if (
    !object(x) ||
    !strings(x, ['id', 'reference', 'customerId', 'channel', 'intakeNotes', 'handling']) ||
    !x.id ||
    !/^REQ-\d{6,}$/.test(String(x.reference)) ||
    x.status !== 'draft' ||
    !timestamp(x.createdAt) ||
    !timestamp(x.updatedAt)
  )
    return false
  if (
    !object(x.creator) ||
    x.creator.id !== 'demo-staff' ||
    x.creator.name !== 'Demo staff' ||
    !location(x.pickup) ||
    !location(x.delivery)
  )
    return false
  if (
    !Array.isArray(x.cargo) ||
    !x.cargo.every(
      (c) =>
        object(c) &&
        typeof c.description === 'string' &&
        typeof c.quantity === 'number' &&
        ['length', 'width', 'height', 'weight'].every(
          (k) => c[k] === undefined || typeof c[k] === 'number'
        )
    )
  )
    return false
  if (['pickupAt', 'deliveryAt'].some((k) => x[k] !== undefined && !timestamp(x[k]))) return false
  return !Object.keys(validateRequest(x as unknown as TransportRequest)).length
}
export function parseDatabase(raw: string): Database {
  const x: unknown = JSON.parse(raw)
  if (
    !object(x) ||
    x.version !== 1 ||
    !Number.isSafeInteger(x.nextRequestNumber) ||
    Number(x.nextRequestNumber) < 1 ||
    !Array.isArray(x.customers) ||
    !x.customers.every(customer) ||
    !Array.isArray(x.requests) ||
    !x.requests.every(request)
  )
    throw new Error('Invalid database')
  const ids = new Set(x.customers.map((c) => c.id))
  if (
    ids.size !== x.customers.length ||
    new Set(x.requests.map((r) => r.id)).size !== x.requests.length ||
    new Set(x.requests.map((r) => r.reference)).size !== x.requests.length ||
    x.requests.some(
      (r) => !ids.has(r.customerId) || Number(r.reference.slice(4)) >= Number(x.nextRequestNumber)
    )
  )
    throw new Error('Invalid record links')
  return x as unknown as Database
}
