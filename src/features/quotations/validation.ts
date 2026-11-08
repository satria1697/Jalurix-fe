import type { QuoteInput } from './types'

export type QuoteFieldErrors = Record<string, string>

export function quoteTotal(input: Pick<QuoteInput, 'pricingMode' | 'summaryAmountMinor' | 'items'>) {
  if (input.pricingMode === 'summary') return input.summaryAmountMinor ?? 0
  return input.items.reduce((total, item) => total + item.quantity * item.unitPriceMinor, 0)
}

export function validateQuotation(input: QuoteInput): QuoteFieldErrors {
  const errors: QuoteFieldErrors = {}
  if (!/^[A-Z]{3}$/.test(input.currency)) errors.currency = 'Use a three-letter currency code, such as IDR.'
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(input.validUntil) ? new Date(`${input.validUntil}T00:00:00Z`) : undefined
  if (!parsedDate || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== input.validUntil)
    errors.validUntil = 'Choose a valid quotation validity date.'
  if (!['prepayment', 'deposit', 'on_delivery', 'credit'].includes(input.paymentTerm))
    errors.paymentTerm = 'Choose a payment term.'
  if (input.paymentDetails.length > 500) errors.paymentDetails = 'Use 500 characters or fewer.'
  if (input.notes.length > 5000) errors.notes = 'Use 5,000 characters or fewer.'
  if (input.pricingMode === 'summary') {
    if (!Number.isSafeInteger(input.summaryAmountMinor))
      errors.summaryAmountMinor = 'Enter an amount using the precision supported by this currency.'
    else if ((input.summaryAmountMinor ?? 0) <= 0) errors.summaryAmountMinor = 'Enter a total greater than zero.'
  } else if (input.pricingMode === 'items') {
    if (input.items.length < 1) errors.items = 'Add at least one price item.'
    input.items.forEach((item, index) => {
      if (!item.description.trim()) errors[`items.${index}.description`] = 'Enter an item description.'
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1)
        errors[`items.${index}.quantity`] = 'Enter a whole quantity greater than zero.'
      if (!Number.isSafeInteger(item.unitPriceMinor))
        errors[`items.${index}.unitPriceMinor`] = 'Enter an amount using the precision supported by this currency.'
      else if (item.unitPriceMinor < 1)
        errors[`items.${index}.unitPriceMinor`] = 'Enter a unit price greater than zero.'
      if (!Number.isSafeInteger(item.quantity * item.unitPriceMinor))
        errors[`items.${index}.unitPriceMinor`] = 'This line total is too large.'
    })
    if (!errors.items && !Object.keys(errors).some((key) => key.startsWith('items.')) && quoteTotal(input) <= 0)
      errors.items = 'The total must be greater than zero.'
    if (input.items.reduce((n, item) => n + item.quantity * item.unitPriceMinor, 0) > Number.MAX_SAFE_INTEGER)
      errors.items = 'The quotation total is too large.'
  } else errors.pricingMode = 'Choose a pricing style.'
  return errors
}

export function emptyQuote(): QuoteInput {
  return {
    pricingMode: 'summary',
    summaryAmountMinor: undefined,
    items: [],
    currency: 'IDR',
    validUntil: '',
    paymentTerm: 'prepayment',
    paymentDetails: '',
    notes: ''
  }
}
