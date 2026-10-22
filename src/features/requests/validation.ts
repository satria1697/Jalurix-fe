import type { FieldErrors } from '../customers/types'
import type { RequestInput, Location } from './types'
export function emptyLocation(): Location { return { type: 'residential', address: '', contactName: '', contactPhone: '', instructions: '' } }
export function emptyRequest(): RequestInput { return { customerId: '', channel: 'whatsapp', intakeNotes: '', cargo: [], handling: '', pickup: emptyLocation(), delivery: emptyLocation() } }
export function validateRequest(input: RequestInput): FieldErrors {
  const e: FieldErrors = {}
  if (!input.customerId) e.customerId = 'Choose a customer.'
  if (!['phone', 'whatsapp', 'other'].includes(input.channel)) e.channel = 'Choose an intake channel.'
  if (!input.cargo.length) e.cargo = 'Add at least one cargo item.'
  input.cargo.forEach((item, i) => {
    if (!item.description.trim()) e[`cargo.${i}.description`] = 'Describe the cargo.'
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) e[`cargo.${i}.quantity`] = 'Use a positive whole number.'
    for (const key of ['length', 'width', 'height', 'weight'] as const) if (item[key] !== undefined && (!Number.isFinite(item[key]) || item[key]! <= 0)) e[`cargo.${i}.${key}`] = 'Use a positive number.'
  })
  for (const key of ['pickup', 'delivery'] as const) {
    const loc = input[key]
    if (!loc.address.trim()) e[`${key}.address`] = 'Enter the full address.'
    if (!['residential', 'warehouse', 'dealership', 'business', 'other'].includes(loc.type)) e[`${key}.type`] = 'Choose a location type.'
    if (loc.latitude !== undefined || loc.longitude !== undefined) {
      if (loc.latitude === undefined || !Number.isFinite(loc.latitude) || Math.abs(loc.latitude) > 90) e[`${key}.latitude`] = 'Enter latitude between -90 and 90.'
      if (loc.longitude === undefined || !Number.isFinite(loc.longitude) || Math.abs(loc.longitude) > 180) e[`${key}.longitude`] = 'Enter longitude between -180 and 180.'
    }
  }
  for (const key of ['pickupAt', 'deliveryAt'] as const) if (input[key] && (!/Z$/.test(input[key]!) || !Number.isFinite(Date.parse(input[key]!)))) e[key] = 'Enter a valid date and time.'
  if (input.pickupAt && input.deliveryAt && Date.parse(input.deliveryAt) < Date.parse(input.pickupAt)) e.deliveryAt = 'Delivery cannot be before pickup.'
  return e
}
