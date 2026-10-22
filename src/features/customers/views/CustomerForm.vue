<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCustomerStore } from '../store'
import { validateCustomer } from '../validation'
import type { CustomerInput, FieldErrors } from '../types'
import FormField from '../../../components/forms/FormField.vue'
import AppIcon from '../../../components/layout/AppIcon.vue'
import { useDirtyForm } from '../../../shared/useDirtyForm'
const route = useRoute(), router = useRouter(), store = useCustomerStore()
const id = typeof route.params.id === 'string' ? route.params.id : undefined
const returning = route.query.returnTo === '/requests/new'
const model = reactive<CustomerInput>({ type: 'individual', name: '', phone: '', email: '', address: '' })
const errors = ref<FieldErrors>({}), ready = ref(false), missing = ref(false), busy = ref(false), failure = ref('')
let initial = JSON.stringify(model)
const guard = useDirtyForm(() => ready.value && JSON.stringify(model) !== initial)
onMounted(async () => { await store.load(); if (id && !store.error) { const c = store.items.find(c => c.id === id); if (c) Object.assign(model, c); else missing.value = true } initial = JSON.stringify(model); ready.value = true })
async function save() {
  if (busy.value) return
  errors.value = validateCustomer(model); if (Object.keys(errors.value).length) return
  busy.value = true; failure.value = ''
  try { const record = await store.save(model, id); guard.markSaved(); await router.push(returning ? { path: '/requests/new', query: { customerId: record.id, resume: '1' } } : { name: 'customer-detail', params: { id: record.id } }) }
  catch (e) { failure.value = e instanceof Error ? e.message : 'Could not save customer.'; guard.resume() }
  finally { busy.value = false }
}
</script>
<template>
  <RouterLink :to="returning ? '/requests/new?resume=1' : '/customers'" class="back-link"><AppIcon name="back" :size="15" />{{ returning ? 'Back to request' : 'Back to customers' }}</RouterLink>
  <div class="page-header"><div><div class="eyebrow">YOUR CUSTOMER DIRECTORY</div><h1>{{ id ? 'Edit customer' : 'New customer' }}</h1><p class="page-description">A few details to make every handoff feel personal.</p></div></div>
  <div v-if="!ready" class="loading-state">Loading customer…</div><div v-else-if="missing" class="empty-state"><h2>Customer not found</h2><p>This customer does not exist in this browser.</p><RouterLink to="/customers" class="button">Back to customers</RouterLink></div>
  <form v-else novalidate @submit.prevent="save"><div v-if="failure || store.error" class="notice error" role="alert">{{ failure || store.error }} <button v-if="!failure" type="button" class="button ghost" @click="store.load">Retry</button></div><p v-if="returning" class="notice">Your transport request draft is saved for your return.</p>
    <section class="panel form-section"><div class="section-title"><span class="section-number">01</span><div><h2>Customer details</h2><p>Who are we moving for?</p></div></div><div class="form-grid">
      <FormField id="type" label="Customer type" :error="errors.type" v-slot="a"><select id="type" v-model="model.type" :aria-invalid="a.invalid" :aria-describedby="a.describedBy"><option value="individual">Individual</option><option value="business">Business</option></select></FormField>
      <FormField id="name" :label="model.type === 'business' ? 'Business name *' : 'Full name *'" :error="errors.name" v-slot="a"><input id="name" v-model="model.name" autocomplete="name" placeholder="Enter customer name" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
      <FormField id="phone" label="Phone number *" :error="errors.phone" v-slot="a"><input id="phone" v-model="model.phone" type="tel" autocomplete="tel" placeholder="+62 812 3456 7890" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
      <FormField id="email" label="Email address (optional)" :error="errors.email" v-slot="a"><input id="email" v-model="model.email" type="email" autocomplete="email" placeholder="name@example.com" :aria-invalid="a.invalid" :aria-describedby="a.describedBy" /></FormField>
      <FormField id="address" class="span-full" label="Saved address (optional)" hint="A reference address only. Each transport request has its own pickup and delivery locations." v-slot="a"><textarea id="address" v-model="model.address" autocomplete="street-address" placeholder="Street, building, city, and postal code" :aria-describedby="a.describedBy" /></FormField>
    </div></section><div class="form-actions"><span class="draft-info">* Required fields</span><RouterLink :to="returning ? '/requests/new?resume=1' : id ? `/customers/${id}` : '/customers'" class="button secondary">Cancel</RouterLink><button class="button" :disabled="busy || !!store.error && !failure" type="submit"><AppIcon name="check" :size="16" />{{ busy ? 'Saving…' : id ? 'Save changes' : 'Create customer' }}</button></div>
  </form>
</template>
