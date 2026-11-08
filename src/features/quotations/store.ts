import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getQuotationRepository } from '../../data/repositories'
import type { Quotation, QuoteInput, QuoteSnapshot } from './types'

export const useQuotationStore = defineStore('quotations', () => {
  const items = ref<Quotation[]>([]), loading = ref(false), error = ref('')
  const repo = () => {
    const repository = getQuotationRepository()
    if (!repository) throw new Error('Quotations are available in the local demo workspace only.')
    return repository
  }
  async function load(requestId?: string) {
    loading.value = true; error.value = ''
    try { items.value = await repo().list(requestId) }
    catch (e) { error.value = e instanceof Error ? e.message : 'Could not load quotations.' }
    finally { loading.value = false }
  }
  async function get(id: string) {
    error.value = ''
    try {
      const record = await repo().get(id)
      if (record) {
        const index = items.value.findIndex((q) => q.id === id)
        if (index < 0) items.value.push(record); else items.value[index] = record
      }
      return record
    } catch (e) { error.value = e instanceof Error ? e.message : 'Could not load quotation.'; return undefined }
  }
  async function create(requestId: string, input: QuoteInput, snapshot: QuoteSnapshot) {
    const record = await repo().create(requestId, input, snapshot)
    items.value.push(record); return record
  }
  async function update(id: string, input: QuoteInput) {
    const record = await repo().update(id, input)
    const index = items.value.findIndex((q) => q.id === id)
    if (index < 0) items.value.push(record); else items.value[index] = record
    return record
  }
  async function copy(id: string) {
    const record = await repo().copy(id); items.value.push(record); return record
  }
  async function decide(id: string, outcome: 'approved' | 'rejected', evidence: string) {
    const record = await repo().decide(id, outcome, evidence)
    const index = items.value.findIndex((q) => q.id === id)
    if (index < 0) items.value.push(record); else items.value[index] = record
    return record
  }
  return { items, loading, error, load, get, create, update, copy, decide }
})
