import type { Customer, CustomerInput } from './types'
export interface CustomerRepository {
  list(): Promise<Customer[]>
  get(id: string): Promise<Customer | undefined>
  create(input: CustomerInput): Promise<Customer>
  update(id: string, input: CustomerInput): Promise<Customer>
}
