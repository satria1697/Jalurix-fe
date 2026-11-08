import type { CargoItem, Location } from '../requests/types'

export type PaymentTerm = 'prepayment' | 'deposit' | 'on_delivery' | 'credit'
export type QuoteStatus = 'draft' | 'approved' | 'rejected'
export type PricingMode = 'summary' | 'items'

export interface QuoteLineInput {
  description: string
  quantity: number
  unitPriceMinor: number
}

export interface QuoteInput {
  pricingMode: PricingMode
  summaryAmountMinor?: number
  items: QuoteLineInput[]
  currency: string
  validUntil: string
  paymentTerm: PaymentTerm
  paymentDetails: string
  notes: string
}

export interface QuoteDecision {
  outcome: 'approved' | 'rejected'
  at: string
  actor: { id: 'demo-staff'; name: 'Demo staff' }
  evidence: string
}

export interface QuoteSnapshot {
  requestReference: string
  customerId: string
  customerName: string
  cargo: CargoItem[]
  pickup: Location
  delivery: Location
  pickupAt?: string
  deliveryAt?: string
  handling: string
}

export interface Quotation extends QuoteInput {
  id: string
  reference: string
  requestId: string
  status: QuoteStatus
  snapshot: QuoteSnapshot
  decisions: QuoteDecision[]
  createdAt: string
  updatedAt: string
}

export interface QuotationRepository {
  list(requestId?: string): Promise<Quotation[]>
  get(id: string): Promise<Quotation | undefined>
  create(requestId: string, input: QuoteInput, snapshot: QuoteSnapshot): Promise<Quotation>
  update(id: string, input: QuoteInput): Promise<Quotation>
  copy(id: string): Promise<Quotation>
  decide(
    id: string,
    outcome: 'approved' | 'rejected',
    evidence: string
  ): Promise<Quotation>
}
