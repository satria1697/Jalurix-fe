import type { Customer, CustomerInput } from '../features/customers/types'
import type { RequestInput, TransportRequest } from '../features/requests/types'
import type { CustomerRepository } from '../features/customers/repository'
import type { RequestRepository } from '../features/requests/repository'
import { validateCustomer } from '../features/customers/validation'
import { validateRequest } from '../features/requests/validation'
import { parseDatabase, type Database } from './database'
import { seed } from './seed'
export const STORAGE_KEY = 'jalurix.fr01.v1'
function trim<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_k, v) => typeof v === 'string' ? v.trim() : v)) }
const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x))
export function createLocalRepositories(storage: Storage): { customers: CustomerRepository; requests: RequestRepository } {
  function write(db: Database) {
    try { storage.setItem(STORAGE_KEY, JSON.stringify(db)) } catch { throw new Error('Could not save in this browser. Check storage permissions or free space, then try again. Your form is still here.') }
  }
  function read(): Database {
    let raw: string | null
    try { raw = storage.getItem(STORAGE_KEY) } catch { throw new Error('Browser storage is unavailable. Allow site storage and retry.') }
    if (raw === null) { const db = seed(); write(db); return db }
    try { return parseDatabase(raw) } catch { throw new Error('Saved demo data could not be read. Existing data has been preserved. Restore a valid browser backup or use a separate browser profile, then retry.') }
  }
  function check(errors: Record<string, string>) { if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]) }
  function customerFields(input: CustomerInput): CustomerInput { return trim({ type: input.type, name: input.name, phone: input.phone, email: input.email, address: input.address }) }
  function requestFields(input: RequestInput): RequestInput { return trim({ customerId: input.customerId, channel: input.channel, intakeNotes: input.intakeNotes, cargo: input.cargo, pickupAt: input.pickupAt, deliveryAt: input.deliveryAt, handling: input.handling, pickup: input.pickup, delivery: input.delivery }) }
  function saveCustomer(input: CustomerInput, id?: string): Customer {
    check(validateCustomer(input)); const db = read(); const old = id ? db.customers.find(c => c.id === id) : undefined
    if (id && !old) throw new Error('Customer not found.')
    const now = new Date().toISOString(); const record: Customer = { ...customerFields(input), id: old?.id ?? crypto.randomUUID(), createdAt: old?.createdAt ?? now, updatedAt: now }
    db.customers = old ? db.customers.map(c => c.id === id ? record : c) : [...db.customers, record]; write(db); return copy(record)
  }
  function saveRequest(input: RequestInput, id?: string): TransportRequest {
    check(validateRequest(input)); const db = read(); if (!db.customers.some(c => c.id === input.customerId)) throw new Error('Choose an existing customer.')
    const old = id ? db.requests.find(r => r.id === id) : undefined; if (id && !old) throw new Error('Request not found.')
    const now = new Date().toISOString(); const record: TransportRequest = { ...requestFields(input), id: old?.id ?? crypto.randomUUID(), reference: old?.reference ?? `REQ-${String(db.nextRequestNumber++).padStart(6, '0')}`, status: 'draft', creator: { id: 'demo-staff', name: 'Demo staff' }, createdAt: old?.createdAt ?? now, updatedAt: now }
    db.requests = old ? db.requests.map(r => r.id === id ? record : r) : [...db.requests, record]; write(db); return copy(record)
  }
  return {
    customers: { async list() { return copy(read().customers) }, async get(id) { return copy(read().customers).find(c => c.id === id) }, async create(input) { return saveCustomer(input) }, async update(id, input) { return saveCustomer(input, id) } },
    requests: { async list() { return copy(read().requests) }, async get(id) { return copy(read().requests).find(r => r.id === id) }, async create(input) { return saveRequest(input) }, async update(id, input) { return saveRequest(input, id) } }
  }
}
// Resolve storage lazily so blocked browser storage produces a visible repository error.
export function browserRepositories() { try { return createLocalRepositories(window.localStorage) } catch { throw new Error('Browser storage is unavailable. Allow site storage and retry.') } }
