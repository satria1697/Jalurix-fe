import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Customer, CustomerInput } from './types'
import { browserRepositories } from '../../data/localRepositories'
export const useCustomerStore = defineStore('customers', () => {
  const items = ref<Customer[]>([]),
    loading = ref(false),
    error = ref('')
  async function load() {
    loading.value = true
    error.value = ''
    try {
      items.value = await browserRepositories().customers.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load records.'
    } finally {
      loading.value = false
    }
  }
  async function save(input: CustomerInput, id?: string): Promise<Customer> {
    error.value = ''
    try {
      const repo = browserRepositories().customers
      const record = id ? await repo.update(id, input) : await repo.create(input)
      const i = items.value.findIndex((x) => x.id === record.id)
      if (i < 0) items.value.push(record)
      else items.value[i] = record
      return record
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not save record.'
      throw e
    }
  }
  return { items, loading, error, load, save }
})
