import type { Quotation, QuotationRepository, QuoteInput } from '../features/quotations/types'
import { validateQuotation } from '../features/quotations/validation'

export const QUOTATION_STORAGE_KEY = 'jalurix.fr02.v1'
interface QuoteDatabase {
  version: 1
  nextNumber: number
  quotations: Quotation[]
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const trim = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value, (_key, item) => (typeof item === 'string' ? item.trim() : item)))

function validRecord(value: unknown): value is Quotation {
  if (!object(value)) return false
  const q = value as unknown as Quotation
  const snapshot = q.snapshot
  if (
    typeof q.id !== 'string' || !q.id || typeof q.reference !== 'string' ||
    !/^QUO-\d{6,}$/.test(q.reference) || typeof q.requestId !== 'string' ||
    !['draft', 'approved', 'rejected'].includes(q.status) ||
    !['summary', 'items'].includes(q.pricingMode) || !Array.isArray(q.items) ||
    !Array.isArray(q.decisions) || !object(snapshot) ||
    typeof snapshot.requestReference !== 'string' || typeof snapshot.customerId !== 'string' ||
    typeof snapshot.customerName !== 'string' || typeof snapshot.handling !== 'string' ||
    !Array.isArray(snapshot.cargo) || !snapshot.cargo.every((item) => object(item) && typeof item.description === 'string' && Number.isSafeInteger(item.quantity)) ||
    !object(snapshot.pickup) || typeof snapshot.pickup.address !== 'string' ||
    !object(snapshot.delivery) || typeof snapshot.delivery.address !== 'string' ||
    !Number.isFinite(Date.parse(q.createdAt)) || !Number.isFinite(Date.parse(q.updatedAt))
  ) return false
  if (q.decisions.some((d) => !object(d) || !['approved', 'rejected'].includes(String(d.outcome)) ||
    !Number.isFinite(Date.parse(String(d.at))) || !object(d.actor) || d.actor.id !== 'demo-staff' ||
    d.actor.name !== 'Demo staff' || typeof d.evidence !== 'string')) return false
  try { return Object.keys(validateQuotation(q)).length === 0 } catch { return false }
}

export function createLocalQuotationRepository(storage: Storage): QuotationRepository {
  function read(): QuoteDatabase {
    let raw: string | null
    try { raw = storage.getItem(QUOTATION_STORAGE_KEY) }
    catch { throw new Error('Browser storage is unavailable. Allow site storage and retry.') }
    if (raw === null) return { version: 1, nextNumber: 1, quotations: [] }
    try {
      const db: unknown = JSON.parse(raw)
      if (!object(db) || db.version !== 1 || !Number.isSafeInteger(db.nextNumber) ||
        Number(db.nextNumber) < 1 || !Array.isArray(db.quotations) || !db.quotations.every(validRecord) ||
        new Set(db.quotations.map((q: Quotation) => q.id)).size !== db.quotations.length ||
        new Set(db.quotations.map((q: Quotation) => q.reference)).size !== db.quotations.length)
        throw new Error('Invalid quotation database')
      return db as unknown as QuoteDatabase
    } catch {
      throw new Error('Saved quotation data could not be read. Existing data has been preserved.')
    }
  }
  function write(db: QuoteDatabase) {
    try { storage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(db)) }
    catch { throw new Error('Could not save quotations in this browser. Check storage permissions or free space.') }
  }
  function check(input: QuoteInput) {
    const errors = validateQuotation(input)
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])
  }
  const cleanInput = (input: QuoteInput): QuoteInput => trim({
    pricingMode: input.pricingMode,
    summaryAmountMinor: input.pricingMode === 'summary' ? input.summaryAmountMinor : undefined,
    items: input.pricingMode === 'items' ? input.items : [],
    currency: input.currency.toUpperCase(),
    validUntil: input.validUntil,
    paymentTerm: input.paymentTerm,
    paymentDetails: input.paymentDetails,
    notes: input.notes
  })
  return {
    async list(requestId) {
      const quotes = read().quotations
      return clone(requestId ? quotes.filter((q) => q.requestId === requestId) : quotes)
    },
    async get(id) {
      const record = read().quotations.find((q) => q.id === id)
      return record ? clone(record) : undefined
    },
    async create(requestId, input, snapshot) {
      check(input)
      const db = read(), now = new Date().toISOString()
      const record: Quotation = {
        ...cleanInput(input), id: crypto.randomUUID(),
        reference: `QUO-${String(db.nextNumber++).padStart(6, '0')}`,
        requestId, status: 'draft', snapshot: clone(snapshot), decisions: [], createdAt: now, updatedAt: now
      }
      db.quotations.push(record); write(db); return clone(record)
    },
    async update(id, input) {
      check(input)
      const db = read(), index = db.quotations.findIndex((q) => q.id === id)
      if (index < 0) throw new Error('Quotation not found.')
      const old = db.quotations[index]
      if (old.status === 'approved') throw new Error('Approved quotations are locked. Copy this quotation to create a new draft.')
      const updated: Quotation = { ...old, ...cleanInput(input), status: 'draft', updatedAt: new Date().toISOString() }
      db.quotations[index] = updated; write(db); return clone(updated)
    },
    async copy(id) {
      const db = read(), source = db.quotations.find((q) => q.id === id)
      if (!source) throw new Error('Quotation not found.')
      const now = new Date().toISOString()
      const copy: Quotation = {
        ...source, id: crypto.randomUUID(), reference: `QUO-${String(db.nextNumber++).padStart(6, '0')}`,
        status: 'draft', decisions: [], createdAt: now, updatedAt: now
      }
      db.quotations.push(copy); write(db); return clone(copy)
    },
    async decide(id, outcome, evidence) {
      const db = read(), index = db.quotations.findIndex((q) => q.id === id)
      if (index < 0) throw new Error('Quotation not found.')
      const old = db.quotations[index]
      if (old.status === 'approved') throw new Error('Approved quotations are locked.')
      if (old.status !== 'draft') throw new Error('Edit this rejected quotation before recording another decision.')
      const updated: Quotation = {
        ...old, status: outcome, decisions: [...old.decisions, {
          outcome, at: new Date().toISOString(), actor: { id: 'demo-staff', name: 'Demo staff' }, evidence: evidence.trim()
        }], updatedAt: new Date().toISOString()
      }
      db.quotations[index] = updated; write(db); return clone(updated)
    }
  }
}
