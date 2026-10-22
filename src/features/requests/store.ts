import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TransportRequest, RequestInput } from './types'
import { browserRepositories } from '../../data/localRepositories'
export const useRequestStore = defineStore('requests', () => {
  const items = ref<TransportRequest[]>([]),
    loading = ref(false),
    error = ref('')
  async function load() {
    loading.value = true
    error.value = ''
    try {
      items.value = await browserRepositories().requests.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Could not load records.'
    } finally {
      loading.value = false
    }
  }
  async function save(input: RequestInput, id?: string): Promise<TransportRequest> {
    error.value = ''
    try {
      const repo = browserRepositories().requests
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
