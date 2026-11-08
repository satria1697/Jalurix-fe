<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useRequestStore } from '../../requests/store'
import { useCustomerStore } from '../../customers/store'
import { useQuotationStore } from '../store'
import { emptyQuote, validateQuotation, type QuoteFieldErrors } from '../validation'
import type { QuoteInput } from '../types'
import FormField from '../../../components/forms/FormField.vue'
import AppIcon from '../../../components/layout/AppIcon.vue'

const route = useRoute(), router = useRouter()
const requestId = String(route.params.requestId), id = typeof route.params.quoteId === 'string' ? route.params.quoteId : undefined
const requests = useRequestStore(), customers = useCustomerStore(), quotes = useQuotationStore()
const model = reactive({ ...emptyQuote(), items: [] as { description: string; quantity: number; unitPrice: string }[] })
const errors = ref<QuoteFieldErrors>({}), failure = ref(''), ready = ref(false), missing = ref(false), locked = ref(false), busy = ref(false)
const request = computed(() => requests.items.find((r) => r.id === requestId))
const customer = computed(() => customers.items.find((c) => c.id === request.value?.customerId))
const fractionDigits = computed(() => {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency: model.currency.toUpperCase() }).resolvedOptions().maximumFractionDigits ?? 2 }
  catch { return 2 }
})
const totalMajor = computed(() => {
  const factor = 10 ** fractionDigits.value
  if (model.pricingMode === 'summary') return Number(model.summaryAmountMinor || 0) / factor
  return model.items.reduce((n, item) => n + item.quantity * (Number(item.unitPrice) || 0), 0)
})
function addItem() { model.items.push({ description: '', quantity: 1, unitPrice: '' }) }
function removeItem(index: number) { model.items.splice(index, 1) }
function loadInput(input: QuoteInput) {
  Object.assign(model, input)
  const factor = 10 ** fractionDigits.value
  model.summaryAmountMinor = input.summaryAmountMinor === undefined ? undefined : input.summaryAmountMinor / factor
  model.items = input.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: String(item.unitPriceMinor / factor) }))
}
onMounted(async () => {
  await Promise.all([requests.get(requestId), customers.load()])
  if (!request.value) { missing.value = true; ready.value = true; return }
  if (id) {
    const record = await quotes.get(id)
    if (!record || record.requestId !== requestId) missing.value = true
    else { loadInput(record); locked.value = record.status === 'approved' }
  }
  ready.value = true
})
function toInput(): QuoteInput {
  const toMinor = (value: string | number) => {
    if (value === '' || value === undefined) return undefined
    const match = /^(\d+)(?:\.(\d+))?$/.exec(String(value).trim())
    if (!match || (match[2]?.length || 0) > fractionDigits.value) return NaN
    try {
      const scale = 10n ** BigInt(fractionDigits.value)
      const whole = BigInt(match[1])
      const fractional = BigInt((match[2] || '').padEnd(fractionDigits.value, '0') || '0')
      const minor = whole * scale + fractional
      return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : NaN
    } catch { return NaN }
  }
  return {
    pricingMode: model.pricingMode,
    summaryAmountMinor: model.pricingMode === 'summary' ? toMinor(model.summaryAmountMinor as number | '') : undefined,
    items: model.pricingMode === 'items' ? model.items.map((item) => ({ description: item.description, quantity: Number(item.quantity), unitPriceMinor: toMinor(item.unitPrice) ?? NaN })) : [],
    currency: model.currency.toUpperCase(), validUntil: model.validUntil, paymentTerm: model.paymentTerm,
    paymentDetails: model.paymentDetails, notes: model.notes
  }
}
async function save() {
  if (busy.value || locked.value || !request.value || !customer.value) return
  const input = toInput(); errors.value = validateQuotation(input)
  if (Object.keys(errors.value).length) return
  busy.value = true; failure.value = ''
  try {
    let record
    if (id) record = await quotes.update(id, input)
    else record = await quotes.create(requestId, input, {
      requestReference: request.value.reference, customerId: request.value.customerId, customerName: customer.value.name,
      cargo: structuredClone(request.value.cargo), pickup: structuredClone(request.value.pickup), delivery: structuredClone(request.value.delivery),
      pickupAt: request.value.pickupAt, deliveryAt: request.value.deliveryAt, handling: request.value.handling
    })
    await router.push(`/requests/${requestId}/quotations/${record.id}`)
  } catch (e) { failure.value = e instanceof Error ? e.message : 'Could not save quotation.' }
  finally { busy.value = false }
}
</script>

<template>
  <RouterLink :to="`/requests/${requestId}/quotations`" class="back-link"><AppIcon name="back" :size="15" />Back to quotations</RouterLink>
  <div class="page-header"><div><div class="eyebrow">A CLEAR OFFER FOR THE ROAD</div><h1>{{ id ? 'Edit quotation' : 'New quotation' }}</h1><p class="page-description">{{ request?.reference }} · {{ customer?.name }}</p></div><span class="badge">{{ id ? 'Draft' : 'New draft' }}</span></div>
  <div v-if="!ready" class="loading-state">Loading request…</div>
  <div v-else-if="missing" class="empty-state"><h2>Request or quotation not found</h2><p>Check the request and quotation links, then try again.</p><RouterLink to="/requests" class="button">Back to requests</RouterLink></div>
  <div v-else-if="locked" class="notice">Approved quotations are locked. Copy the quotation to prepare new terms.</div>
  <form v-else novalidate @submit.prevent="save">
    <div v-if="failure" class="notice error" role="alert">{{ failure }}</div>
    <section class="panel form-section"><div class="section-title"><span class="section-number">01</span><div><h2>Price</h2><p>Choose one total or list the agreed price items.</p></div></div>
      <div class="form-grid">
        <FormField id="pricingMode" label="Pricing style"><select id="pricingMode" v-model="model.pricingMode"><option value="summary">One summarized price</option><option value="items">Itemized prices</option></select></FormField>
        <FormField id="currency" v-slot="a" label="Currency code *" :error="errors.currency"><input id="currency" v-model="model.currency" maxlength="3" autocomplete="off" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
        <FormField v-if="model.pricingMode === 'summary'" id="summaryAmountMinor" v-slot="a" label="Total price *" :error="errors.summaryAmountMinor" class="span-full"><input id="summaryAmountMinor" v-model="model.summaryAmountMinor" type="number" min="0" :step="fractionDigits ? `0.${'0'.repeat(fractionDigits - 1)}1` : 1" inputmode="decimal" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /><small>Enter the amount in {{ model.currency.toUpperCase() }}.</small></FormField>
      </div>
      <template v-if="model.pricingMode === 'items'"><div v-if="errors.items" class="field-error" role="alert">{{ errors.items }}</div>
        <div v-for="(item, index) in model.items" :key="index" class="quote-line form-grid">
          <FormField :id="`item-description-${index}`" v-slot="a" label="Description *" :error="errors[`items.${index}.description`]"><input :id="`item-description-${index}`" v-model="item.description" maxlength="200" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
          <FormField :id="`item-quantity-${index}`" v-slot="a" label="Quantity *" :error="errors[`items.${index}.quantity`]"><input :id="`item-quantity-${index}`" v-model.number="item.quantity" type="number" min="1" step="1" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
          <FormField :id="`item-price-${index}`" v-slot="a" label="Unit price *" :error="errors[`items.${index}.unitPriceMinor`]"><input :id="`item-price-${index}`" v-model="item.unitPrice" type="number" min="0" :step="fractionDigits ? `0.${'0'.repeat(fractionDigits - 1)}1` : 1" inputmode="decimal" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
          <button type="button" class="button danger" :aria-label="`Remove price item ${index + 1}`" @click="removeItem(index)">Remove</button>
        </div>
        <button type="button" class="button secondary" @click="addItem"><AppIcon name="plus" :size="14" />Add price item</button>
      </template>
      <div class="quote-total"><span>Quotation total</span><strong>{{ new Intl.NumberFormat('en', { style: 'currency', currency: /^[A-Z]{3}$/.test(model.currency) ? model.currency : 'IDR' }).format(totalMajor) }}</strong></div>
    </section>
    <section class="panel form-section"><div class="section-title"><span class="section-number">02</span><div><h2>Validity & payment</h2><p>Set when this offer is valid and how payment is arranged.</p></div></div>
      <div class="form-grid">
        <FormField id="validUntil" v-slot="a" label="Valid until *" :error="errors.validUntil"><input id="validUntil" v-model="model.validUntil" type="date" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
        <FormField id="paymentTerm" v-slot="a" label="Payment terms *" :error="errors.paymentTerm"><select id="paymentTerm" v-model="model.paymentTerm" :aria-invalid="a.invalid" :aria-describedby="a.describedBy"><option value="prepayment">Full prepayment</option><option value="deposit">Deposit with balance</option><option value="on_delivery">Payment on delivery</option><option value="credit">Invoiced / credit terms</option></select></FormField>
        <FormField id="paymentDetails" label="Payment details (optional)" :error="errors.paymentDetails"><input id="paymentDetails" v-model="model.paymentDetails" maxlength="500" placeholder="Deposit amount, balance due date, or agreed credit period" /></FormField>
        <FormField id="notes" label="Notes (optional)" :error="errors.notes" class="span-full"><textarea id="notes" v-model="model.notes" maxlength="5000" placeholder="Clarifications or conditions for the customer" /></FormField>
      </div>
    </section>
    <div class="form-actions"><RouterLink :to="`/requests/${requestId}/quotations`" class="button secondary">Cancel</RouterLink><button class="button" type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Save draft' }}</button></div>
  </form>
</template>
