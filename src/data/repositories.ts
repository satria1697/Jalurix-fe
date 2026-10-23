import { browserRepositories } from './localRepositories'
import { createHttpRepositories } from './httpRepositories'
export function dataSource(): 'local' | 'api' {
  const source = import.meta.env.VITE_DATA_SOURCE || 'local'
  if (source !== 'local' && source !== 'api') throw Error('VITE_DATA_SOURCE must be local or api.')
  return source
}
export function getRepositories() {
  return dataSource() === 'api' ? createHttpRepositories('/api/v1') : browserRepositories()
}
