import type { CustomerInput } from '../features/customers/types'
import type { RequestInput } from '../features/requests/types'
import type { CustomerRepository } from '../features/customers/repository'
import type { RequestRepository } from '../features/requests/repository'
import type { Quotation, QuotationRepository, QuoteInput } from '../features/quotations/types'
import { isCustomer, isTransportRequest, isQuotation } from './database'
import { ApiError } from './apiError'
type Guard<T> = (x: unknown) => x is T
function customerBody(x: CustomerInput) {
  return { type: x.type, name: x.name, phone: x.phone, email: x.email, address: x.address }
}
function requestBody(x: RequestInput) {
  return {
    customerId: x.customerId,
    channel: x.channel,
    intakeNotes: x.intakeNotes,
    cargo: x.cargo.map((c) => ({
      description: c.description,
      quantity: c.quantity,
      length: c.length,
      width: c.width,
      height: c.height,
      weight: c.weight
    })),
    pickupAt: x.pickupAt,
    deliveryAt: x.deliveryAt,
    handling: x.handling,
    pickup: x.pickup,
    delivery: x.delivery
  }
}
export function createHttpRepositories(
  baseURL: string,
  fetcher: typeof fetch = (...args) => fetch(...args)
): { customers: CustomerRepository; requests: RequestRepository; quotations: QuotationRepository } {
  const base = baseURL.replace(/\/$/, '')
  async function bounded<T>(action: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      return await action(controller.signal)
    } catch (e) {
      if (controller.signal.aborted)
        throw new ApiError('The API request timed out. Please retry.', 0, 'timeout')
      if (e instanceof ApiError) throw e
      throw new ApiError(
        'Could not reach the API. Check the connection and retry. Your form is still here.'
      )
    } finally {
      clearTimeout(timer)
    }
  }
  async function send(
    path: string,
    signal: AbortSignal,
    method = 'GET',
    body?: unknown
  ): Promise<Record<string, unknown>> {
    const response = await fetcher(base + path, {
      method,
      signal,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    let json: unknown
    try {
      json = await response.json()
    } catch {
      throw new ApiError(
        'The API returned an invalid response.',
        response.status,
        'invalid_response'
      )
    }
    if (!json || typeof json !== 'object')
      throw new ApiError(
        'The API returned an invalid response.',
        response.status,
        'invalid_response'
      )
    const envelope = json as Record<string, unknown>
    if (!response.ok) {
      const e = envelope.error as
        | { message?: unknown; code?: unknown; fields?: unknown }
        | undefined
      const fields =
        e?.fields &&
        typeof e.fields === 'object' &&
        !Array.isArray(e.fields) &&
        Object.values(e.fields).every((v) => typeof v === 'string')
          ? (e.fields as Record<string, string>)
          : undefined
      throw new ApiError(
        typeof e?.message === 'string' ? e.message : 'The operation failed. Please retry.',
        response.status,
        typeof e?.code === 'string' ? e.code : 'api_error',
        fields
      )
    }
    return envelope
  }
  function repository<T, I>(path: string, guard: Guard<T>, body: (input: I) => unknown) {
    const validate = (x: unknown): T => {
      if (!guard(x))
        throw new ApiError('The API returned an invalid record.', 0, 'invalid_response')
      return x
    }
    return {
      list: () =>
        bounded(async (signal) => {
          const items: T[] = []
          const ids = new Set<string>()
          let expectedTotal: number | undefined
          for (let page = 1; ; page++) {
            const envelope = await send(`${path}?page=${page}&pageSize=100`, signal)
            const p = envelope.pagination as
              | { page?: unknown; pageSize?: unknown; total?: unknown }
              | undefined
            if (
              !Array.isArray(envelope.data) ||
              !p ||
              p.page !== page ||
              !Number.isInteger(p.pageSize) ||
              Number(p.pageSize) < 1 ||
              Number(p.pageSize) > 100 ||
              !Number.isSafeInteger(p.total) ||
              Number(p.total) < 0 ||
              envelope.data.length > Number(p.pageSize)
            )
              throw new ApiError('The API returned invalid pagination.', 0, 'invalid_response')
            if (expectedTotal !== undefined && expectedTotal !== p.total)
              throw new ApiError(
                'Records changed while loading. Please retry.',
                0,
                'collection_changed'
              )
            expectedTotal = Number(p.total)
            for (const raw of envelope.data) {
              const item = validate(raw)
              const id = (item as { id: string }).id
              if (ids.has(id))
                throw new ApiError(
                  'Records changed while loading. Please retry.',
                  0,
                  'collection_changed'
                )
              ids.add(id)
              items.push(item)
            }
            if (items.length === expectedTotal) return items
            if (items.length > expectedTotal || envelope.data.length === 0 || page >= 10000)
              throw new ApiError(
                'The collection could not be fully loaded. Please retry.',
                0,
                'invalid_response'
              )
          }
        }),
      get: (id: string) =>
        bounded(async (signal) => {
          try {
            return validate((await send(`${path}/${encodeURIComponent(id)}`, signal)).data)
          } catch (e) {
            if (e instanceof ApiError && e.status === 404) return undefined
            throw e
          }
        }),
      create: (input: I) =>
        bounded(async (signal) => validate((await send(path, signal, 'POST', body(input))).data)),
      update: (id: string, input: I) =>
        bounded(async (signal) =>
          validate(
            (await send(`${path}/${encodeURIComponent(id)}`, signal, 'PUT', body(input))).data
          )
        )
    }
  }
  const validateQuote = (x: unknown): Quotation => {
    if (!isQuotation(x)) throw new ApiError('The API returned an invalid record.', 0, 'invalid_response')
    return x
  }
  const quotationBody = (input: QuoteInput) => ({
    pricingMode: input.pricingMode,
    ...(input.pricingMode === 'summary' ? { summaryAmountMinor: input.summaryAmountMinor } : {}),
    items: input.pricingMode === 'items' ? input.items : [],
    currency: input.currency,
    validUntil: input.validUntil,
    paymentTerm: input.paymentTerm,
    paymentDetails: input.paymentDetails,
    notes: input.notes
  })
  const quotations: QuotationRepository = {
    list: (requestId) => bounded(async (signal) => {
      const out: Quotation[] = [], ids = new Set<string>()
      let total: number | undefined
      for (let page = 1; ; page++) {
        const query = new URLSearchParams({ page: String(page), pageSize: '100' })
        if (requestId) query.set('requestId', requestId)
        const envelope = await send(`/quotations?${query}`, signal)
        const p = envelope.pagination as { page?: unknown; pageSize?: unknown; total?: unknown } | undefined
        if (!Array.isArray(envelope.data) || !p || p.page !== page || p.pageSize !== 100 || !Number.isSafeInteger(p.total) || Number(p.total) < 0 || envelope.data.length > 100)
          throw new ApiError('The API returned invalid pagination.', 0, 'invalid_response')
        if (total !== undefined && total !== p.total) throw new ApiError('Records changed while loading. Please retry.', 0, 'collection_changed')
        total = Number(p.total)
        for (const raw of envelope.data) {
          const item = validateQuote(raw)
          if (ids.has(item.id)) throw new ApiError('Records changed while loading. Please retry.', 0, 'collection_changed')
          ids.add(item.id); out.push(item)
        }
        if (out.length === total) return out
        if (out.length > total || !envelope.data.length || page >= 10000) throw new ApiError('The collection could not be fully loaded. Please retry.', 0, 'invalid_response')
      }
    }),
    get: (id) => bounded(async (signal) => {
      try { return validateQuote((await send(`/quotations/${encodeURIComponent(id)}`, signal)).data) }
      catch (e) { if (e instanceof ApiError && e.status === 404) return undefined; throw e }
    }),
    create: (requestId, input, _snapshot) => bounded(async (signal) => validateQuote((await send('/quotations', signal, 'POST', { requestId, ...quotationBody(input) })).data)),
    update: (id, input) => bounded(async (signal) => validateQuote((await send(`/quotations/${encodeURIComponent(id)}`, signal, 'PUT', quotationBody(input))).data)),
    copy: (id) => bounded(async (signal) => validateQuote((await send(`/quotations/${encodeURIComponent(id)}/copy`, signal, 'POST')).data)),
    decide: (id, outcome, evidence) => bounded(async (signal) => validateQuote((await send(`/quotations/${encodeURIComponent(id)}/decision`, signal, 'POST', { outcome, evidence })).data))
  }
  return {
    customers: repository('/customers', isCustomer, customerBody),
    requests: repository('/transport-requests', isTransportRequest, requestBody),
    quotations
  }
}
