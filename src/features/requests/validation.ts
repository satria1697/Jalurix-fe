import type { FieldErrors } from '../customers/types'
import type { RequestInput, Location } from './types'
export function emptyLocation(): Location {
  return { type: 'residential', address: '', contactName: '', contactPhone: '', instructions: '' }
}
export function emptyRequest(): RequestInput {
  return {
    customerId: '',
    channel: 'whatsapp',
    intakeNotes: '',
    cargo: [],
    handling: '',
    pickup: emptyLocation(),
    delivery: emptyLocation()
  }
}
export function validateRequest(input: RequestInput, enforceLimits = true): FieldErrors {
  const e: FieldErrors = {}
  if (!input.customerId) e.customerId = 'Choose a customer.'
  if (!['phone', 'whatsapp', 'other'].includes(input.channel))
    e.channel = 'Choose an intake channel.'
  if (!input.cargo.length || (enforceLimits && input.cargo.length > 100))
    e.cargo = 'Add between 1 and 100 cargo items.'
  input.cargo.forEach((item, i) => {
    if (!item.description.trim()) e[`cargo.${i}.description`] = 'Describe the cargo.'
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      (enforceLimits && item.quantity > 1000000)
    )
      e[`cargo.${i}.quantity`] = 'Use a whole number between 1 and 1,000,000.'
    for (const key of ['length', 'width', 'height', 'weight'] as const)
      if (
        item[key] !== undefined &&
        (!Number.isFinite(item[key]) ||
          item[key]! <= 0 ||
          (enforceLimits &&
            (item[key]! > 1000000 || item[key] !== Math.round(item[key]! * 1000) / 1000)))
      )
        e[`cargo.${i}.${key}`] =
          'Use a positive number up to 1,000,000 with at most 3 decimal places.'
  })
  for (const key of ['pickup', 'delivery'] as const) {
    const loc = input[key]
    if (!loc.address.trim()) e[`${key}.address`] = 'Enter the full address.'
    if (!['residential', 'warehouse', 'dealership', 'business', 'other'].includes(loc.type))
      e[`${key}.type`] = 'Choose a location type.'
    if (loc.latitude !== undefined || loc.longitude !== undefined) {
      if (
        loc.latitude === undefined ||
        !Number.isFinite(loc.latitude) ||
        Math.abs(loc.latitude) > 90
      )
        e[`${key}.latitude`] = 'Enter latitude between -90 and 90.'
      if (
        loc.longitude === undefined ||
        !Number.isFinite(loc.longitude) ||
        Math.abs(loc.longitude) > 180
      )
        e[`${key}.longitude`] = 'Enter longitude between -180 and 180.'
    }
  }
  for (const key of ['pickupAt', 'deliveryAt'] as const)
    if (input[key] && (!/Z$/.test(input[key]!) || !Number.isFinite(Date.parse(input[key]!))))
      e[key] = 'Enter a valid date and time.'
  if (
    input.pickupAt &&
    input.deliveryAt &&
    Date.parse(input.deliveryAt) < Date.parse(input.pickupAt)
  )
    e.deliveryAt = 'Delivery cannot be before pickup.'
  if (!enforceLimits) return e
  const text = (key: string, value: string, max: number) => {
    if ([...value.trim()].length > max) e[key] = `Use at most ${max} characters.`
  }
  text('intakeNotes', input.intakeNotes, 5000)
  text('handling', input.handling, 5000)
  input.cargo.forEach((c, i) => text(`cargo.${i}.description`, c.description, 5000))
  for (const key of ['pickup', 'delivery'] as const) {
    const l = input[key]
    text(`${key}.address`, l.address, 2000)
    text(`${key}.contactName`, l.contactName, 200)
    text(`${key}.contactPhone`, l.contactPhone, 50)
    text(`${key}.instructions`, l.instructions, 5000)
  }
  return e
}
