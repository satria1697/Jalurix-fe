import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TransportRequest, RequestInput } from './types'
import { getRepositories } from '../../data/repositories'
export const useRequestStore = defineStore('requests', () => {
  const items = ref<TransportRequest[]>([]),
    loading = ref(false),
    error = ref('')
  async function load() {
    loading.value = true
    error.value = ''
    try {
      items.value = await getRepositories().requests.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load records.'
    } finally {
      loading.value = false
    }
  }
  async function get(id: string): Promise<TransportRequest | undefined> {
    error.value = ''
    loading.value = true
    try {
      const record = await getRepositories().requests.get(id)
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
  async function save(input: RequestInput, id?: string): Promise<TransportRequest> {
    error.value = ''
    try {
      const repo = getRepositories().requests
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
