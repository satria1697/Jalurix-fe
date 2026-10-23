import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Customer, CustomerInput } from './types'
import { getRepositories } from '../../data/repositories'
export const useCustomerStore = defineStore('customers', () => {
  const items = ref<Customer[]>([]),
    loading = ref(false),
    error = ref('')
  async function load() {
    loading.value = true
    error.value = ''
    try {
      items.value = await getRepositories().customers.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load records.'
    } finally {
      loading.value = false
    }
  }
  async function get(id: string): Promise<Customer | undefined> {
    error.value = ''
    loading.value = true
    try {
      const record = await getRepositories().customers.get(id)
      const index = items.value.findIndex((x) => x.id === id)
      if (record) {
        if (index < 0) items.value.push(record)
        else items.value[index] = record
      } else if (index >= 0) items.value.splice(index, 1)
      return record
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load record.'
      return undefined
    } finally {
      loading.value = false
    }
  }
  async function save(input: CustomerInput, id?: string): Promise<Customer> {
    error.value = ''
    try {
      const repo = getRepositories().customers
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
  return { items, loading, error, load, get, save }
})
