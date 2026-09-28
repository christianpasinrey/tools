<script setup>
defineProps({ value: { type: Number, default: null }, label: { type: String, required: true } })
</script>

<template>
  <div class="tb-ui">
    <div class="flex justify-between text-xs text-tb-muted mb-1.5">
      <span>{{ label }}</span><span v-if="value !== null" class="font-code">{{ Math.round(value) }} %</span>
    </div>
    <div role="progressbar" :aria-label="label" aria-valuemin="0" aria-valuemax="100"
         :aria-valuenow="value === null ? undefined : Math.round(value)"
         class="tb-progress" :class="value === null && 'is-indeterminate'">
      <div class="tb-progress-bar" :style="value === null ? null : { width: `${value}%` }"></div>
    </div>
  </div>
</template>
