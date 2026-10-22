export interface CustomerInput { type: 'individual' | 'business'; name: string; phone: string; email: string; address: string }
export interface Customer extends CustomerInput { id: string; createdAt: string; updatedAt: string }
export type FieldErrors = Record<string, string>
