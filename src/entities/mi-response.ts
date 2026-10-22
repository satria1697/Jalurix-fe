type ErrorResponse = 'DATA-NOT-FOUND'

export interface MiResponse<T> {
  message: 'success' | 'failed' | string
  data: T
  error: ErrorResponse | string
}
