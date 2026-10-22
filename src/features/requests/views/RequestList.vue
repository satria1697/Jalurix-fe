<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRequestStore } from '../store'
import { useCustomerStore } from '../../customers/store'
import { displayTime } from '../../../shared/time'
import AppIcon from '../../../components/layout/AppIcon.vue'
const requests = useRequestStore(),
  customers = useCustomerStore(),
  search = ref('')
const customerName = (id: string) =>
  customers.items.find((c) => c.id === id)?.name || 'Unknown customer'
async function load() {
  await Promise.all([requests.load(), customers.load()])
}
onMounted(load)
const filtered = computed(() =>
  [...requests.items]
    .reverse()
    .filter((r) =>
      [
        r.reference,
        customerName(r.customerId),
        r.pickup.address,
        r.delivery.address,
        ...r.cargo.map((c) => c.description)
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.value.toLowerCase())
    )
)
const scheduled = computed(() => requests.items.filter((r) => r.pickupAt).length)
</script>
<template>
  <div class="page-header">
    <div>
      <div class="eyebrow">FROM FIRST HELLO TO THE OPEN ROAD</div>
      <h1>Transport requests</h1>
      <p class="page-description">Every journey starts with a little clarity. Find yours here.</p>
    </div>
    <RouterLink to="/requests/new" class="button"
      ><AppIcon name="plus" :size="16" />New request</RouterLink
    >
  </div>
  <div v-if="requests.error || customers.error" class="notice error" role="alert">
    {{ requests.error || customers.error }}
    <button class="button ghost" @click="load">Retry</button>
  </div>
  <div class="stats">
    <div class="stat-card">
      <div>
        <p class="stat-label">Total requests</p>
        <p class="stat-value">{{ requests.items.length.toString().padStart(2, '0') }}</p>
        <p class="stat-note">Every possibility, together</p>
      </div>
      <span class="stat-icon"><AppIcon name="requests" /></span>
    </div>
    <div class="stat-card chocolate">
      <div>
        <p class="stat-label">Draft requests</p>
        <p class="stat-value">{{ requests.items.length.toString().padStart(2, '0') }}</p>
        <p class="stat-note">Taking shape, one detail at a time</p>
      </div>
      <span class="stat-icon"><AppIcon name="edit" /></span>
    </div>
    <div class="stat-card">
      <div>
        <p class="stat-label">Pickup preferences</p>
        <p class="stat-value">{{ scheduled.toString().padStart(2, '0') }}</p>
        <p class="stat-note">With a preferred pickup time</p>
      </div>
      <span class="stat-icon"><AppIcon name="clock" /></span>
    </div>
  </div>
  <section class="panel">
    <div class="panel-heading">
      <h2>
        All transport requests <span class="count">{{ requests.items.length }}</span>
      </h2>
      <span class="cell-sub">A clear view of what’s ahead</span>
    </div>
    <div class="toolbar">
      <label class="search-field" for="request-search"
        ><AppIcon name="search" :size="16" /><input
          id="request-search"
          v-model="search"
          placeholder="Search request, customer, route, or cargo…"
          aria-label="Search transport requests" /></label
      ><span class="filter" style="display: flex; align-items: center; padding: 0 13px; gap: 7px"
        ><span class="route-dot end"></span>Draft requests</span
      >
    </div>
    <div v-if="requests.loading || customers.loading" class="loading-state">Loading requests…</div>
    <div v-else-if="filtered.length" class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>REQUEST</th>
            <th>CUSTOMER</th>
            <th>ROUTE</th>
            <th>CARGO</th>
            <th>PREFERRED PICKUP</th>
            <th>STATUS</th>
            <th><span class="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id">
            <td>
              <RouterLink :to="`/requests/${r.id}`" class="ref-link">{{ r.reference }}</RouterLink
              ><span class="cell-sub">{{
                r.channel === 'whatsapp'
                  ? 'WhatsApp'
                  : r.channel === 'phone'
                    ? 'Phone call'
                    : 'Other channel'
              }}</span>
            </td>
            <td>
              <RouterLink :to="`/customers/${r.customerId}`" class="cell-title">{{
                customerName(r.customerId)
              }}</RouterLink
              ><span class="cell-sub">{{
                customers.items.find((c) => c.id === r.customerId)?.type === 'business'
                  ? 'Business'
                  : 'Individual'
              }}</span>
            </td>
            <td class="route-cell">
              <div>
                <span class="route-dot"></span><span>{{ r.pickup.address }}</span>
              </div>
              <div>
                <span class="route-dot end"></span><span>{{ r.delivery.address }}</span>
              </div>
            </td>
            <td>
              <span class="cell-title">{{ r.cargo[0]?.description }}</span
              ><span class="cell-sub"
                >{{ r.cargo.reduce((n, c) => n + c.quantity, 0) }} units ·
                {{ r.cargo.length }} cargo {{ r.cargo.length === 1 ? 'item' : 'items' }}</span
              >
            </td>
            <td>
              <span class="cell-title" style="font-size: 11px">{{
                r.pickupAt ? displayTime(r.pickupAt).replace(' WIB', '') : 'Not specified'
              }}</span
              ><span v-if="r.pickupAt" class="cell-sub">WIB · Preference only</span>
            </td>
            <td><span class="badge">Draft</span></td>
            <td>
              <RouterLink
                :to="`/requests/${r.id}`"
                class="icon-button"
                :aria-label="`View ${r.reference}`"
                ><AppIcon name="arrow" :size="16"
              /></RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state">
      <AppIcon name="requests" :size="34" />
      <h2>
        {{ requests.items.length ? 'No matching requests' : 'Your next journey starts here' }}
      </h2>
      <p>
        {{
          requests.items.length
            ? 'Try another customer, cargo description, or route.'
            : 'Create your first transport request to bring the details together.'
        }}
      </p>
      <RouterLink v-if="!requests.items.length && !requests.error" to="/requests/new" class="button"
        >Create a request</RouterLink
      >
    </div>
    <div class="table-footer">
      <span>Showing {{ filtered.length }} of {{ requests.items.length }} requests</span
      ><span>One clear path, from the start.</span>
    </div>
  </section>
  <p class="list-note">
    <AppIcon name="leaf" :size="14" />Requests are saved as drafts. Quotations and shipment
    operations come next.
  </p>
</template>
