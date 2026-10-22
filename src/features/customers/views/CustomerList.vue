<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useCustomerStore } from '../store'
import AppIcon from '../../../components/layout/AppIcon.vue'
const store = useCustomerStore(),
  search = ref(''),
  type = ref('')
onMounted(store.load)
const filtered = computed(() =>
  store.items.filter(
    (c) =>
      (!type.value || c.type === type.value) &&
      [c.name, c.phone, c.email, c.address]
        .join(' ')
        .toLowerCase()
        .includes(search.value.toLowerCase())
  )
)
</script>
<template>
  <div class="page-header">
    <div>
      <div class="eyebrow">GOOD CONNECTIONS START HERE</div>
      <h1>Customers</h1>
      <p class="page-description">The people and businesses behind every journey.</p>
    </div>
    <RouterLink class="button" to="/customers/new"
      ><AppIcon name="plus" :size="16" />New customer</RouterLink
    >
  </div>
  <div v-if="store.error" class="notice error" role="alert">
    {{ store.error }} <button class="button ghost" @click="store.load">Retry</button>
  </div>
  <div class="stats">
    <div class="stat-card">
      <div>
        <p class="stat-label">All customers</p>
        <p class="stat-value">{{ store.items.length.toString().padStart(2, '0') }}</p>
        <p class="stat-note">Your growing network</p>
      </div>
      <span class="stat-icon"><AppIcon name="customers" /></span>
    </div>
    <div class="stat-card">
      <div>
        <p class="stat-label">Businesses</p>
        <p class="stat-value">
          {{
            store.items
              .filter((c) => c.type === 'business')
              .length.toString()
              .padStart(2, '0')
          }}
        </p>
        <p class="stat-note">Partners on the road</p>
      </div>
      <span class="stat-icon"><AppIcon name="box" /></span>
    </div>
    <div class="stat-card chocolate">
      <div>
        <p class="stat-label">Individuals</p>
        <p class="stat-value">
          {{
            store.items
              .filter((c) => c.type === 'individual')
              .length.toString()
              .padStart(2, '0')
          }}
        </p>
        <p class="stat-note">Personal connections</p>
      </div>
      <span class="stat-icon"><AppIcon name="leaf" /></span>
    </div>
  </div>
  <section class="panel">
    <div class="panel-heading">
      <h2>
        Your customer directory <span class="count">{{ store.items.length }}</span>
      </h2>
      <span class="cell-sub">All in one place</span>
    </div>
    <div class="toolbar">
      <label class="search-field" for="customer-search"
        ><AppIcon name="search" :size="16" /><input
          id="customer-search"
          v-model="search"
          placeholder="Search name, phone, or address…"
          aria-label="Search customers" /></label
      ><select
        id="customer-type-filter"
        v-model="type"
        class="filter"
        aria-label="Filter customer type"
      >
        <option value="">All customer types</option>
        <option value="business">Business</option>
        <option value="individual">Individual</option>
      </select>
    </div>
    <div v-if="store.loading" class="loading-state">Loading customers…</div>
    <div v-else-if="filtered.length" class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>CUSTOMER</th>
            <th>TYPE</th>
            <th>CONTACT</th>
            <th>SAVED ADDRESS</th>
            <th><span class="sr-only">Open</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filtered" :key="c.id">
            <td>
              <RouterLink :to="`/customers/${c.id}`" class="customer-summary"
                ><span class="customer-avatar">{{
                  c.name
                    .split(' ')
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join('')
                }}</span
                ><span class="cell-title">{{ c.name }}</span></RouterLink
              >
            </td>
            <td>
              <span class="badge" :class="c.type">{{
                c.type === 'business' ? 'Business' : 'Individual'
              }}</span>
            </td>
            <td>
              <span class="cell-title">{{ c.phone }}</span
              ><span class="cell-sub">{{ c.email || 'No email added' }}</span>
            </td>
            <td>
              <span class="cell-sub" style="max-width: 260px; margin: 0">{{
                c.address || 'No address saved'
              }}</span>
            </td>
            <td>
              <RouterLink
                :to="`/customers/${c.id}`"
                class="icon-button"
                :aria-label="`View ${c.name}`"
                ><AppIcon name="arrow" :size="16"
              /></RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state">
      <AppIcon name="customers" :size="32" />
      <h2>{{ store.items.length ? 'No matching customers' : 'Your network starts here' }}</h2>
      <p>
        {{
          store.items.length
            ? 'Try a different search or customer type.'
            : 'Add your first customer to start a transport request.'
        }}
      </p>
      <RouterLink v-if="!store.items.length && !store.error" to="/customers/new" class="button"
        >Add a customer</RouterLink
      >
    </div>
    <div class="table-footer">
      <span>Showing {{ filtered.length }} of {{ store.items.length }} customers</span
      ><span>Rooted in good relationships.</span>
    </div>
  </section>
  <p class="list-note">
    <AppIcon name="leaf" :size="14" />A customer’s saved address is separate from their pickup and
    delivery locations.
  </p>
</template>
