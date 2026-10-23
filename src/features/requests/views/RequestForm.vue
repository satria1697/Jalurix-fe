<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCustomerStore } from '../../customers/store'
import { useRequestStore } from '../store'
import { emptyRequest, validateRequest } from '../validation'
import type { FieldErrors } from '../../customers/types'
import { toUtc, toWib } from '../../../shared/time'
import { serverFields } from '../../../data/apiError'
import { useDirtyForm } from '../../../shared/useDirtyForm'
import { readDraft, saveDraft, clearDraft } from '../draft'
import FormField from '../../../components/forms/FormField.vue'
import LocationFields from '../../../components/forms/LocationFields.vue'
import CargoFields from '../../../components/forms/CargoFields.vue'
import AppIcon from '../../../components/layout/AppIcon.vue'
const route = useRoute(),
  router = useRouter(),
  customers = useCustomerStore(),
  requests = useRequestStore()
const id = typeof route.params.id === 'string' ? route.params.id : undefined
const model = reactive({ ...emptyRequest(), cargo: [{ description: '', quantity: 1 }] })
const pickupLocal = ref(''),
  deliveryLocal = ref(''),
  errors = ref<FieldErrors>({}),
  busy = ref(false),
  ready = ref(false),
  missing = ref(false),
  failure = ref(''),
  draftWarning = ref(''),
  loadError = ref(''),
  restoredDraft = ref(false)
const customer = computed(() => customers.items.find((c) => c.id === model.customerId))
const snapshot = () =>
  JSON.stringify({ model, pickupLocal: pickupLocal.value, deliveryLocal: deliveryLocal.value })
let initial = snapshot()
const guard = useDirtyForm(
  () => ready.value && (restoredDraft.value || snapshot() !== initial),
  () => {
    if (!id) clearDraft()
  }
)
async function load() {
  await Promise.all([customers.load(), id ? requests.get(id) : Promise.resolve()])
  loadError.value = customers.error || requests.error
  if (loadError.value) {
    ready.value = true
    return
  }
  if (id) {
    const r = requests.items.find((r) => r.id === id)
    if (r) {
      Object.assign(model, r)
      pickupLocal.value = r.pickupAt ? toWib(r.pickupAt) : ''
      deliveryLocal.value = r.deliveryAt ? toWib(r.deliveryAt) : ''
    } else missing.value = true
  } else {
    {
      // A pending customer-creation draft also resumes on browser Back.
      try {
        const draft = readDraft()
        if (draft) {
          restoredDraft.value = true
          Object.assign(model, draft.input)
          pickupLocal.value = draft.pickupLocal
          deliveryLocal.value = draft.deliveryLocal
        }
      } catch (e) {
        draftWarning.value = (e as Error).message
      }
    }
    if (
      typeof route.query.customerId === 'string' &&
      customers.items.some((c) => c.id === route.query.customerId)
    )
      model.customerId = route.query.customerId
  }
  initial = snapshot()
  ready.value = true
}
onMounted(load)
function copyAddress(key: 'pickup' | 'delivery') {
  if (customer.value?.address) model[key] = { ...model[key], address: customer.value.address }
}
async function newCustomer() {
  failure.value = ''
  try {
    saveDraft({
      version: 1,
      input: JSON.parse(JSON.stringify(model)),
      pickupLocal: pickupLocal.value,
      deliveryLocal: deliveryLocal.value
    })
    guard.markSaved()
    await router.push({ path: '/customers/new', query: { returnTo: '/requests/new' } })
  } catch (e) {
    failure.value = (e as Error).message
    guard.resume()
  }
}
async function save() {
  if (busy.value) return
  const dateErrors: FieldErrors = {}
  for (const key of ['pickupAt', 'deliveryAt'] as const) {
    const value = key === 'pickupAt' ? pickupLocal.value : deliveryLocal.value
    try {
      model[key] = value ? toUtc(value) : undefined
    } catch {
      dateErrors[key] = 'Enter a valid date and time.'
      model[key] = undefined
    }
  }
  errors.value = { ...validateRequest(model), ...dateErrors }
  if (Object.keys(errors.value).length) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  busy.value = true
  failure.value = ''
  try {
    const r = await requests.save(model, id)
    if (!id) clearDraft()
    guard.markSaved()
    await router.push({ name: 'request-detail', params: { id: r.id } })
  } catch (e) {
    failure.value = (e as Error).message
    errors.value = { ...errors.value, ...serverFields(e) }
    await nextTick()
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    guard.resume()
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <RouterLink :to="id ? `/requests/${id}` : '/requests'" class="back-link"
    ><AppIcon name="back" :size="15" />{{ id ? 'Back to request' : 'Back to requests' }}</RouterLink
  >
  <div class="page-header">
    <div>
      <div class="eyebrow">A NEW JOURNEY STARTS HERE</div>
      <h1>{{ id ? 'Edit transport request' : 'New transport request' }}</h1>
      <p class="page-description">From the first conversation to a clear plan for the road.</p>
    </div>
    <span class="badge">Draft</span>
  </div>
  <div v-if="!ready" class="loading-state">Loading your workspace…</div>
  <div v-else-if="loadError" class="notice error" role="alert">
    {{ loadError }} <button class="button ghost" @click="load">Retry</button>
  </div>
  <div v-else-if="missing" class="empty-state">
    <h2>Request not found</h2>
    <p>This request does not exist in this browser.</p>
    <RouterLink to="/requests" class="button">Back to requests</RouterLink>
  </div>
  <form v-else novalidate @submit.prevent="save">
    <div v-if="failure" class="notice error" role="alert">{{ failure }}</div>
    <div v-if="draftWarning" class="notice" role="status">{{ draftWarning }}</div>
    <section class="panel form-section">
      <div class="section-title">
        <span class="section-number">01</span>
        <div>
          <h2>Customer & intake</h2>
          <p>The person behind this request, and how it reached you.</p>
        </div>
      </div>
      <div class="form-grid">
        <FormField id="customerId" v-slot="a" label="Customer *" :error="errors.customerId"
          ><select
            id="customerId"
            v-model="model.customerId"
            :aria-invalid="a.invalid"
            :aria-describedby="a.describedBy"
          >
            <option value="">Choose a customer</option>
            <option v-for="c in customers.items" :key="c.id" :value="c.id">
              {{ c.name }} · {{ c.type }}
            </option></select
          ><button
            v-if="!id"
            type="button"
            class="button ghost"
            style="align-self: flex-start"
            data-new-customer
            @click="newCustomer"
          >
            <AppIcon name="plus" :size="13" />Create a new customer
          </button></FormField
        >
        <FormField id="channel" label="Intake channel"
          ><select id="channel" v-model="model.channel">
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone call</option>
            <option value="other">Other offline channel</option>
          </select></FormField
        >
        <FormField
          id="intakeNotes"
          label="Intake notes (optional)"
          :error="errors.intakeNotes"
          class="span-full"
        >
          <textarea
            id="intakeNotes"
            v-model="model.intakeNotes"
            placeholder="Context from the conversation, references, or the originating channel…"
            maxlength="5000"
          />
        </FormField>
      </div>
    </section>
    <section class="panel form-section">
      <div class="section-title">
        <span class="section-number">02</span>
        <div>
          <h2>What are we moving?</h2>
          <p>Add the cargo and any dimensions you already know.</p>
        </div>
      </div>
      <CargoFields v-model="model.cargo" :errors="errors" />
    </section>
    <section class="panel form-section">
      <div class="section-title">
        <span class="section-number">03</span>
        <div>
          <h2>Schedule & handling</h2>
          <p>Preferred times, not confirmed bookings. All times are WIB.</p>
        </div>
      </div>
      <div class="form-grid">
        <FormField
          id="pickupAt"
          v-slot="a"
          label="Preferred pickup (WIB, optional)"
          :error="errors.pickupAt"
          ><input
            id="pickupAt"
            v-model="pickupLocal"
            type="datetime-local"
            :aria-invalid="a.invalid"
            :aria-describedby="a.describedBy"
        /></FormField>
        <FormField
          id="deliveryAt"
          v-slot="a"
          label="Preferred delivery (WIB, optional)"
          :error="errors.deliveryAt"
          ><input
            id="deliveryAt"
            v-model="deliveryLocal"
            type="datetime-local"
            :aria-invalid="a.invalid"
            :aria-describedby="a.describedBy"
        /></FormField>
        <FormField
          id="handling"
          label="Special handling instructions (optional)"
          :error="errors.handling"
          class="span-full"
        >
          <textarea
            id="handling"
            v-model="model.handling"
            placeholder="Cargo condition, protective packing, loading considerations…"
            maxlength="5000"
          />
        </FormField>
      </div>
    </section>
    <section
      v-for="(key, i) in ['pickup', 'delivery'] as const"
      :key="key"
      class="panel form-section"
    >
      <div class="location-heading">
        <div class="section-title" style="margin: 0">
          <span class="section-number">0{{ i + 4 }}</span>
          <div>
            <h2>{{ key === 'pickup' ? 'Pickup location' : 'Delivery location' }}</h2>
            <p>
              {{ key === 'pickup' ? 'Where the journey begins.' : 'Where the cargo is headed.' }}
            </p>
          </div>
        </div>
        <button
          v-if="customer?.address"
          type="button"
          class="button secondary"
          :data-copy="key"
          @click="copyAddress(key)"
        >
          Use saved address
        </button>
      </div>
      <LocationFields v-model="model[key]" :prefix="key" :errors="errors" />
      <p class="copy-hint">
        Independent of the customer profile. Copying an address fills only this location.
      </p>
    </section>
    <div class="form-actions">
      <span class="draft-info">Recorded by Demo staff · Draft status only</span
      ><RouterLink :to="id ? `/requests/${id}` : '/requests'" class="button secondary"
        >Cancel</RouterLink
      ><button type="submit" class="button" :disabled="busy">
        <AppIcon name="check" :size="16" />{{
          busy ? 'Saving…' : id ? 'Save changes' : 'Create request'
        }}
      </button>
    </div>
  </form>
</template>
