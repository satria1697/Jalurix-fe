import type { FieldErrors } from '../features/customers/types'
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code = 'network_error',
    public fields?: FieldErrors
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
export function serverFields(error: unknown): FieldErrors {
  return error instanceof ApiError ? error.fields || {} : {}
}
