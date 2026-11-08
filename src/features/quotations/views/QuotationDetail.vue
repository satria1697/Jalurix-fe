<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useQuotationStore } from '../store'
import { useRequestStore } from '../../requests/store'
import AppIcon from '../../../components/layout/AppIcon.vue'

const route = useRoute(), router = useRouter()
const requestId = String(route.params.requestId), id = String(route.params.quoteId)
const quotes = useQuotationStore(), requests = useRequestStore()
const ready = ref(false), missing = ref(false), failure = ref(''), evidence = ref(''), busy = ref(false)
const quote = computed(() => quotes.items.find((q) => q.id === id))
const lastDecision = computed(() => quote.value?.decisions[quote.value.decisions.length - 1])
const totalMinor = computed(() => quote.value?.pricingMode === 'summary' ? quote.value.summaryAmountMinor || 0 : quote.value?.items.reduce((n, i) => n + i.quantity * i.unitPriceMinor, 0) || 0)
function amount(minor: number) {
  const currency = quote.value?.currency || 'IDR'
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 10 ** digits)
}
function term(value: string) { return ({ prepayment: 'Full prepayment', deposit: 'Deposit with balance', on_delivery: 'Payment on delivery', credit: 'Invoiced / credit terms' } as Record<string, string>)[value] || value }
onMounted(async () => {
  await Promise.all([requests.get(requestId), quotes.load(requestId)])
  const record = await quotes.get(id)
  missing.value = !record || record.requestId !== requestId
  ready.value = true
})
async function copyQuote() {
  if (busy.value) return
  busy.value = true; failure.value = ''
  try { const copy = await quotes.copy(id); await router.push(`/requests/${requestId}/quotations/${copy.id}/edit`) }
  catch (e) { failure.value = e instanceof Error ? e.message : 'Could not copy quotation.' }
  finally { busy.value = false }
}
async function decide(outcome: 'approved' | 'rejected') {
  if (busy.value || !quote.value || quote.value.status !== 'draft') return
  busy.value = true; failure.value = ''
  try { await quotes.decide(id, outcome, evidence.value) }
  catch (e) { failure.value = e instanceof Error ? e.message : 'Could not record decision.' }
  finally { busy.value = false }
}
</script>

<template>
  <RouterLink :to="`/requests/${requestId}/quotations`" class="back-link"><AppIcon name="back" :size="15" />Back to quotations</RouterLink>
  <div v-if="!ready" class="loading-state">Loading quotation…</div>
  <div v-else-if="missing" class="empty-state"><h2>Quotation not found</h2><p>This quotation is not linked to the selected request.</p><RouterLink :to="`/requests/${requestId}/quotations`" class="button">Back to quotations</RouterLink></div>
  <template v-else-if="quote">
    <div class="page-header"><div><div class="eyebrow">QUOTATION · {{ quote.snapshot.requestReference }}</div><h1>{{ quote.reference }}</h1><p class="page-description">{{ quote.snapshot.customerName }} · Prepared {{ new Date(quote.createdAt).toLocaleDateString() }}</p></div><div class="header-actions"><span class="badge" :class="`quote-${quote.status}`">{{ quote.status }}</span><RouterLink v-if="quote.status !== 'approved'" :to="`/requests/${requestId}/quotations/${quote.id}/edit`" class="button secondary"><AppIcon name="edit" :size="15" />Edit quotation</RouterLink><button class="button secondary" :disabled="busy" @click="copyQuote">Copy to new draft</button></div></div>
    <div v-if="failure" class="notice error" role="alert">{{ failure }}</div>
    <div v-if="quote.status === 'approved'" class="notice success"><strong>Approved by {{ lastDecision?.actor.name }}</strong> · {{ new Date(lastDecision?.at || '').toLocaleString() }}. Approved price, terms, cargo, and route are preserved. Shipment conversion will be available in a later phase.</div>
    <div class="detail-grid">
      <section class="panel detail-card"><h2>Price & validity</h2><dl><dt>PRICING</dt><dd>{{ quote.pricingMode === 'items' ? 'Itemized' : 'Summary price' }}</dd><dt>VALID UNTIL</dt><dd>{{ quote.validUntil }}</dd><dt>TOTAL</dt><dd class="quote-grand-total">{{ amount(totalMinor) }}</dd></dl>
        <div v-if="quote.pricingMode === 'items'" class="quote-price-lines"><div v-for="(item, index) in quote.items" :key="index"><span>{{ item.description }} · {{ item.quantity }} × {{ amount(item.unitPriceMinor) }}</span><strong>{{ amount(item.quantity * item.unitPriceMinor) }}</strong></div></div>
        <p v-if="quote.notes" class="quote-note">{{ quote.notes }}</p>
      </section>
      <section class="panel detail-card"><h2>Payment terms</h2><dl><dt>ARRANGEMENT</dt><dd>{{ term(quote.paymentTerm) }}</dd><dt>DETAILS</dt><dd>{{ quote.paymentDetails || 'No additional details' }}</dd></dl></section>
      <section class="panel detail-card"><h2>Agreed cargo</h2><div v-for="(item, index) in quote.snapshot.cargo" :key="index" class="request-detail-cargo"><strong>{{ item.quantity }} × {{ item.description }}</strong><p v-if="item.length || item.width || item.height || item.weight"><span v-if="item.length">{{ item.length }} cm long · </span><span v-if="item.width">{{ item.width }} cm wide · </span><span v-if="item.height">{{ item.height }} cm high · </span><span v-if="item.weight">{{ item.weight }} kg each</span></p></div></section>
      <section v-for="key in ['pickup', 'delivery'] as const" :key="key" class="panel detail-card"><h2>{{ key === 'pickup' ? 'Agreed pickup' : 'Agreed delivery' }}</h2><dl><dt>ADDRESS</dt><dd>{{ quote.snapshot[key].address }}</dd><dt>SITE CONTACT</dt><dd>{{ quote.snapshot[key].contactName || 'Not provided' }}<br v-if="quote.snapshot[key].contactPhone" />{{ quote.snapshot[key].contactPhone }}</dd><dt>ACCESS NOTES</dt><dd>{{ quote.snapshot[key].instructions || 'No access instructions' }}</dd></dl></section>
      <section class="panel detail-card"><h2>Decision history</h2><div v-if="quote.decisions.length" class="quote-decisions"><article v-for="(decision, index) in quote.decisions" :key="index"><span class="badge" :class="`quote-${decision.outcome}`">{{ decision.outcome }}</span><p>{{ decision.actor.name }} · {{ new Date(decision.at).toLocaleString() }}</p><p>{{ decision.evidence || 'No evidence reference added' }}</p></article></div><p v-else>No decision recorded. This quotation remains a draft.</p></section>
    </div>
    <section v-if="quote.status === 'draft'" class="panel detail-card quote-decision-panel"><h2>Record customer decision</h2><p class="page-description">Confirm the customer's response. Add an optional reference to a WhatsApp message, email, or call notes.</p><label class="field-label" for="quote-evidence">Supporting evidence (optional)</label><textarea id="quote-evidence" v-model="evidence" maxlength="1000" placeholder="For example: WhatsApp approval received 29 Oct" /><div class="header-actions"><button class="button danger" :disabled="busy" @click="decide('rejected')">Record rejection</button><button class="button" :disabled="busy" @click="decide('approved')">Record approval</button></div></section>
    <p v-if="quote.status === 'approved'" class="notice">This approved quotation is eligible for future shipment conversion. Shipment creation is part of FR-03.</p>
  </template>
</template>
