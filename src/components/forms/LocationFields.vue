<script setup lang="ts">
import type { Location } from '../../features/requests/types'
import type { FieldErrors } from '../../features/customers/types'
import FormField from './FormField.vue'
const props = defineProps<{ modelValue: Location; prefix: string; errors: FieldErrors }>()
const emit = defineEmits<{ 'update:modelValue': [value: Location] }>()
function update(key: keyof Location, event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: ['latitude', 'longitude'].includes(key)
      ? value === ''
        ? undefined
        : Number(value)
      : value
  })
}
</script>
<template>
  <div class="form-grid">
    <FormField :id="`${prefix}-type`" label="Location type" :error="errors[`${prefix}.type`]"
      ><select :id="`${prefix}-type`" :value="modelValue.type" @change="update('type', $event)">
        <option value="residential">Residential / home</option>
        <option value="warehouse">Warehouse</option>
        <option value="dealership">Dealership</option>
        <option value="business">Business</option>
        <option value="other">Other address</option>
      </select></FormField
    >
    <FormField
      :id="`${prefix}-address`"
      v-slot="a"
      class="span-full"
      label="Full address *"
      :error="errors[`${prefix}.address`]"
    >
      <textarea
        :id="`${prefix}-address`"
        :value="modelValue.address"
        placeholder="Street, building, city, and postal code"
        maxlength="2000"
        :aria-invalid="a.invalid"
        :aria-describedby="a.describedBy"
        @input="update('address', $event)"
      />
    </FormField>
    <FormField
      :id="`${prefix}-contactName`"
      label="Site contact name (optional)"
      :error="errors[`${prefix}.contactName`]"
      ><input
        :id="`${prefix}-contactName`"
        :value="modelValue.contactName"
        placeholder="Who should we ask for?"
        maxlength="200"
        @input="update('contactName', $event)"
    /></FormField>
    <FormField
      :id="`${prefix}-contactPhone`"
      label="Site contact phone (optional)"
      :error="errors[`${prefix}.contactPhone`]"
      ><input
        :id="`${prefix}-contactPhone`"
        type="tel"
        :value="modelValue.contactPhone"
        placeholder="+62…"
        maxlength="50"
        @input="update('contactPhone', $event)"
    /></FormField>
    <FormField
      :id="`${prefix}-latitude`"
      v-slot="a"
      label="Latitude (optional)"
      :error="errors[`${prefix}.latitude`]"
      ><input
        :id="`${prefix}-latitude`"
        type="number"
        step="any"
        min="-90"
        max="90"
        :value="modelValue.latitude"
        placeholder="-6.2000"
        :aria-invalid="a.invalid"
        :aria-describedby="a.describedBy"
        @input="update('latitude', $event)"
    /></FormField>
    <FormField
      :id="`${prefix}-longitude`"
      v-slot="a"
      label="Longitude (optional)"
      :error="errors[`${prefix}.longitude`]"
      ><input
        :id="`${prefix}-longitude`"
        type="number"
        step="any"
        min="-180"
        max="180"
        :value="modelValue.longitude"
        placeholder="106.8167"
        :aria-invalid="a.invalid"
        :aria-describedby="a.describedBy"
        @input="update('longitude', $event)"
    /></FormField>
    <FormField
      :id="`${prefix}-instructions`"
      class="span-full"
      label="Access instructions (optional)"
      :error="errors[`${prefix}.instructions`]"
    >
      <textarea
        :id="`${prefix}-instructions`"
        :value="modelValue.instructions"
        placeholder="Gate access, parking, loading area, or landmarks…"
        maxlength="5000"
        @input="update('instructions', $event)"
      />
    </FormField>
  </div>
</template>
