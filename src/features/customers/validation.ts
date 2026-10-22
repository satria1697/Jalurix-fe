import type { CustomerInput, FieldErrors } from './types'
export function validateCustomer(input: CustomerInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!['individual', 'business'].includes(input.type)) errors.type = 'Choose a customer type.'
  if (!input.name.trim()) errors.name = 'Enter a customer name.'
  if (!input.phone.trim()) errors.phone = 'Enter a phone number.'
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    errors.email = 'Enter a valid email address.'
  return errors
}
