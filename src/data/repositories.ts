import { browserRepositories } from './localRepositories'
import { createHttpRepositories } from './httpRepositories'
import type { QuotationRepository } from '../features/quotations/types'
export function dataSource(): 'local' | 'api' {
  const source = import.meta.env.VITE_DATA_SOURCE || 'local'
  if (source !== 'local' && source !== 'api') throw Error('VITE_DATA_SOURCE must be local or api.')
  return source
}
export function getRepositories() {
  return dataSource() === 'api' ? createHttpRepositories('/api/v1') : browserRepositories()
}
export function getQuotationRepository(): QuotationRepository | undefined {
  return dataSource() === 'local' ? browserRepositories().quotations : createHttpRepositories('/api/v1').quotations
}
