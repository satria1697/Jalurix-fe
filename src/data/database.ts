import type { Customer } from '../features/customers/types'
import type { TransportRequest } from '../features/requests/types'
import { validateCustomer } from '../features/customers/validation'
import { validateRequest } from '../features/requests/validation'
import type { Quotation } from '../features/quotations/types'
import { validateQuotation } from '../features/quotations/validation'
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
export function isCustomer(
  x: unknown,
  validation: 'current' | 'legacy' = 'current'
): x is Customer {
  return (
    object(x) &&
    strings(x, ['id', 'type', 'name', 'phone', 'email', 'address']) &&
    !!x.id &&
    timestamp(x.createdAt) &&
    timestamp(x.updatedAt) &&
    !Object.keys(validateCustomer(x as unknown as Customer, validation === 'current')).length
  )
}
function location(x: unknown): boolean {
  return (
    object(x) &&
    strings(x, ['type', 'address', 'contactName', 'contactPhone', 'instructions']) &&
    ['latitude', 'longitude'].every((k) => x[k] === undefined || typeof x[k] === 'number')
  )
}
export function isTransportRequest(
  x: unknown,
  validation: 'current' | 'legacy' = 'current'
): x is TransportRequest {
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
  return !Object.keys(validateRequest(x as unknown as TransportRequest, validation === 'current'))
    .length
}
export function isQuotation(x: unknown): x is Quotation {
  if (!object(x) || !strings(x, ['id','reference','requestId','status','currency','validUntil','paymentTerm','paymentDetails','notes']) ||
    !/^QUO-\d{6,}$/.test(String(x.reference)) || !['draft','approved','rejected'].includes(String(x.status)) ||
    !['summary','items'].includes(String(x.pricingMode)) || !Array.isArray(x.items) || !Array.isArray(x.decisions) ||
    !timestamp(x.createdAt) || !timestamp(x.updatedAt) || !object(x.snapshot)) return false
  const s = x.snapshot
  if (!strings(s, ['requestReference','customerId','customerName','handling']) || !Array.isArray(s.cargo) ||
    !location(s.pickup) || !location(s.delivery) ||
    !s.cargo.every((c) => object(c) && typeof c.description === 'string' && Number.isSafeInteger(c.quantity)) ||
    !x.decisions.every((d) => object(d) && ['approved','rejected'].includes(String(d.outcome)) && timestamp(d.at) &&
      object(d.actor) && d.actor.id === 'demo-staff' && d.actor.name === 'Demo staff' && typeof d.evidence === 'string')) return false
  if (x.summaryAmountMinor !== undefined && !Number.isSafeInteger(x.summaryAmountMinor)) return false
  if (!x.items.every((i) => object(i) && typeof i.description === 'string' && Number.isSafeInteger(i.quantity) && Number.isSafeInteger(i.unitPriceMinor))) return false
  try { return Object.keys(validateQuotation(x as unknown as Quotation)).length === 0 } catch { return false }
}
export function parseDatabase(raw: string): Database {
  const x: unknown = JSON.parse(raw)
  if (
    !object(x) ||
    x.version !== 1 ||
    !Number.isSafeInteger(x.nextRequestNumber) ||
    Number(x.nextRequestNumber) < 1 ||
    !Array.isArray(x.customers) ||
    !x.customers.every((c) => isCustomer(c, 'legacy')) ||
    !Array.isArray(x.requests) ||
    !x.requests.every((r) => isTransportRequest(r, 'legacy'))
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
