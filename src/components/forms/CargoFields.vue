<script setup lang="ts">
import type { CargoItem } from '../../features/requests/types'
import type { FieldErrors } from '../../features/customers/types'
import FormField from './FormField.vue'
import AppIcon from '../layout/AppIcon.vue'
const props = defineProps<{ modelValue: CargoItem[]; errors: FieldErrors }>()
const emit = defineEmits<{ 'update:modelValue': [value: CargoItem[]] }>()
function update(index: number, key: keyof CargoItem, event: Event) {
  const raw = (event.target as HTMLInputElement).value
  emit(
    'update:modelValue',
    props.modelValue.map((c, i) =>
      i === index
        ? { ...c, [key]: key === 'description' ? raw : raw === '' ? undefined : Number(raw) }
        : c
    )
  )
}
const measures = [
  { key: 'length', label: 'Length (cm)' },
  { key: 'width', label: 'Width (cm)' },
  { key: 'height', label: 'Height (cm)' },
  { key: 'weight', label: 'Weight (kg)' }
] as const
</script>
<template>
  <div>
    <p v-if="errors.cargo" role="alert" class="field-error" style="margin-bottom: 12px">
      {{ errors.cargo }}
    </p>
    <div v-for="(c, i) in modelValue" :key="i" class="cargo-row" data-cargo-row>
      <div class="cargo-row-header">
        <strong>Cargo item {{ String(i + 1).padStart(2, '0') }}</strong
        ><button
          type="button"
          class="button danger"
          :aria-label="`Remove cargo item ${i + 1}`"
          @click="
            emit(
              'update:modelValue',
              modelValue.filter((_, n) => n !== i)
            )
          "
        >
          Remove
        </button>
      </div>
      <div class="form-grid">
        <FormField
          :id="`cargo-${i}-description`"
          v-slot="a"
          label="Cargo description *"
          :error="errors[`cargo.${i}.description`]"
          ><input
            :id="`cargo-${i}-description`"
            :value="c.description"
            placeholder="e.g. Honda CB150R, 2024"
            maxlength="5000"
            :aria-invalid="a.invalid"
            :aria-describedby="a.describedBy"
            @input="update(i, 'description', $event)" /></FormField
        ><FormField
          :id="`cargo-${i}-quantity`"
          v-slot="a"
          label="Quantity *"
          :error="errors[`cargo.${i}.quantity`]"
          ><input
            :id="`cargo-${i}-quantity`"
            type="number"
            min="1"
            max="1000000"
            step="1"
            :value="c.quantity"
            :aria-invalid="a.invalid"
            :aria-describedby="a.describedBy"
            @input="update(i, 'quantity', $event)"
        /></FormField>
      </div>
      <p class="field-hint" style="margin-top: 18px">
        Optional measurements · per item · max 1,000,000 · up to 3 decimals
      </p>
      <div class="measurement-grid">
        <FormField
          v-for="m in measures"
          :id="`cargo-${i}-${m.key}`"
          :key="m.key"
          v-slot="a"
          :label="m.label"
          :error="errors[`cargo.${i}.${m.key}`]"
          ><input
            :id="`cargo-${i}-${m.key}`"
            type="number"
            min="0.001"
            max="1000000"
            step="0.001"
            :value="c[m.key]"
            placeholder="—"
            :aria-invalid="a.invalid"
            :aria-describedby="a.describedBy"
            @input="update(i, m.key, $event)"
        /></FormField>
      </div>
    </div>
    <button
      type="button"
      class="button secondary"
      :disabled="modelValue.length >= 100"
      data-add-cargo
      @click="emit('update:modelValue', [...modelValue, { description: '', quantity: 1 }])"
    >
      <AppIcon name="plus" :size="15" />Add cargo item
    </button>
  </div>
</template>
