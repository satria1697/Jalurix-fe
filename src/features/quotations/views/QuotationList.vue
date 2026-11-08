<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useRequestStore } from '../../requests/store'
import { useCustomerStore } from '../../customers/store'
import { useQuotationStore } from '../store'
import AppIcon from '../../../components/layout/AppIcon.vue'

const route = useRoute(), requestId = typeof route.params.requestId === 'string' ? route.params.requestId : undefined
const quotes = useQuotationStore(), requests = useRequestStore(), customers = useCustomerStore()
const request = computed(() => requests.items.find((r) => r.id === requestId))
const customer = computed(() => customers.items.find((c) => c.id === request.value?.customerId))
const visibleQuotes = computed(() => requestId ? quotes.items.filter((q) => q.requestId === requestId) : quotes.items)
function statusClass(status: string) { return `badge quote-${status}` }
function amount(q: (typeof quotes.items)[number]) {
  const minor = q.pricingMode === 'summary' ? q.summaryAmountMinor || 0 : q.items.reduce((n, i) => n + i.quantity * i.unitPriceMinor, 0)
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency: q.currency }).resolvedOptions().maximumFractionDigits ?? 2
  return new Intl.NumberFormat('en', { style: 'currency', currency: q.currency }).format(minor / 10 ** digits)
}
onMounted(async () => {
  await Promise.all([requestId ? requests.get(requestId) : requests.load(), customers.load()])
  await quotes.load(requestId)
})
</script>

<template>
  <RouterLink :to="requestId ? `/requests/${requestId}` : '/requests'" class="back-link"><AppIcon name="back" :size="15" />{{ requestId ? 'Back to request' : 'Back to requests' }}</RouterLink>
  <div class="page-header">
    <div><div class="eyebrow">COMMERCIAL PROPOSALS</div><h1>Quotations</h1>
      <p class="page-description">{{ request ? `${request.reference} · ${customer?.name || 'Customer'}` : 'Every offer prepared in this workspace.' }}</p>
    </div>
    <RouterLink v-if="requestId" :to="`/requests/${requestId}/quotations/new`" class="button"><AppIcon name="plus" :size="16" />New quotation</RouterLink>
    <RouterLink v-else to="/requests" class="button"><AppIcon name="plus" :size="16" />Choose a request</RouterLink>
  </div>
  <div v-if="quotes.error" class="notice error" role="alert">{{ quotes.error }} <button class="button ghost" @click="quotes.load(requestId)">Retry</button></div>
  <div v-if="quotes.loading" class="loading-state">Loading quotations…</div>
  <section v-else class="panel">
    <div class="panel-heading"><h2>{{ request ? `For ${request.reference}` : 'All quotations' }} <span class="count">{{ visibleQuotes.length }}</span></h2><span class="cell-sub">Each offer keeps its own decision and terms</span></div>
    <div v-if="visibleQuotes.length" class="table-scroll"><table><thead><tr><th>QUOTATION</th><th>REQUEST</th><th>CUSTOMER</th><th>TOTAL</th><th>VALID UNTIL</th><th>PAYMENT TERMS</th><th>STATUS</th><th><span class="sr-only">Open</span></th></tr></thead>
      <tbody><tr v-for="q in [...visibleQuotes].reverse()" :key="q.id">
        <td><RouterLink :to="`/requests/${q.requestId}/quotations/${q.id}`" class="ref-link">{{ q.reference }}</RouterLink><span class="cell-sub">{{ q.pricingMode === 'items' ? `${q.items.length} price items` : 'Summary price' }}</span></td>
        <td><RouterLink :to="`/requests/${q.requestId}`" class="ref-link">{{ q.snapshot.requestReference }}</RouterLink></td><td>{{ q.snapshot.customerName }}</td>
        <td><strong>{{ amount(q) }}</strong></td>
        <td>{{ q.validUntil }}</td><td>{{ q.paymentTerm.replace('_', ' ') }}</td><td><span :class="statusClass(q.status)">{{ q.status }}</span></td>
        <td><RouterLink :to="`/requests/${q.requestId}/quotations/${q.id}`" class="icon-button" :aria-label="`Open ${q.reference}`"><AppIcon name="arrow" :size="16" /></RouterLink></td>
      </tr></tbody></table></div>
    <div v-else class="empty-state"><AppIcon name="requests" :size="34" /><h2>No quotations yet</h2><p>{{ request ? 'Prepare a price and terms for this request.' : 'Create the first quotation from a transport request.' }}</p><RouterLink to="/requests" class="button">Browse requests</RouterLink></div>
  </section>
</template>
