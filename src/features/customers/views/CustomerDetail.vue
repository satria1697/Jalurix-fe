<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useCustomerStore } from '../store'
import { useRequestStore } from '../../requests/store'
import { displayTime } from '../../../shared/time'
import AppIcon from '../../../components/layout/AppIcon.vue'
const route = useRoute(),
  customers = useCustomerStore(),
  requests = useRequestStore(),
  ready = ref(false)
const customer = computed(() => customers.items.find((c) => c.id === route.params.id)),
  linked = computed(() => requests.items.filter((r) => r.customerId === route.params.id))
async function load() {
  await Promise.all([customers.get(String(route.params.id)), requests.load()])
  ready.value = true
}
onMounted(load)
</script>
<template>
  <RouterLink to="/customers" class="back-link"
    ><AppIcon name="back" :size="15" />Back to customers</RouterLink
  >
  <div v-if="customers.error || requests.error" class="notice error" role="alert">
    {{ customers.error || requests.error }}
    <button class="button ghost" @click="load">Retry</button>
  </div>
  <div v-if="!ready" class="loading-state">Loading customer…</div>
  <template v-else-if="customer"
    ><div class="page-header">
      <div>
        <div class="eyebrow">CUSTOMER PROFILE</div>
        <h1>{{ customer.name }}</h1>
        <p class="page-description">
          {{ customer.type === 'business' ? 'Business' : 'Individual' }} · Part of your network
        </p>
      </div>
      <RouterLink :to="`/customers/${customer.id}/edit`" class="button secondary"
        ><AppIcon name="edit" :size="15" />Edit customer</RouterLink
      >
    </div>
    <div class="detail-grid">
      <section class="panel detail-card">
        <h2>Contact & address</h2>
        <dl>
          <dt>PHONE NUMBER</dt>
          <dd>{{ customer.phone }}</dd>
          <dt>EMAIL ADDRESS</dt>
          <dd>{{ customer.email || 'Not provided' }}</dd>
          <dt>SAVED ADDRESS</dt>
          <dd>{{ customer.address || 'Not provided' }}</dd>
        </dl>
      </section>
      <section class="panel detail-card">
        <h2>Customer record</h2>
        <dl>
          <dt>CUSTOMER TYPE</dt>
          <dd>{{ customer.type }}</dd>
          <dt>CREATED</dt>
          <dd>{{ displayTime(customer.createdAt) }}</dd>
          <dt>LAST UPDATED</dt>
          <dd>{{ displayTime(customer.updatedAt) }}</dd>
        </dl>
      </section>
    </div>
    <section class="panel" style="margin-top: 22px">
      <div class="panel-heading">
        <h2>
          Transport requests <span class="count">{{ linked.length }}</span>
        </h2>
        <RouterLink
          :to="{ path: '/requests/new', query: { customerId: customer.id } }"
          class="button"
          ><AppIcon name="plus" :size="15" />New request</RouterLink
        >
      </div>
      <div v-if="linked.length" class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>REFERENCE</th>
              <th>CARGO</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in linked" :key="r.id">
              <td>
                <RouterLink :to="`/requests/${r.id}`" class="ref-link">{{
                  r.reference
                }}</RouterLink>
              </td>
              <td>{{ r.cargo.map((c) => `${c.quantity} × ${c.description}`).join(', ') }}</td>
              <td><span class="badge">Draft</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <p>No transport requests yet. Start a new journey for this customer.</p>
      </div>
    </section></template
  >
  <div v-else-if="!customers.error" class="empty-state">
    <h2>Customer not found</h2>
    <p>This record does not exist in this browser.</p>
  </div>
</template>
