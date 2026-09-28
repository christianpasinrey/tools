<script setup>
import Icon from '../icons/Icon.vue'
defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: null },
  active: { type: Boolean, default: undefined },
  size: { type: String, default: 'md' },
  tone: { type: String, default: 'default' }
})
</script>

<template>
  <button type="button" class="tb-icon-btn tb-ui" :class="[`tb-icon-btn-${size}`, tone === 'danger' && 'tb-icon-btn-danger']"
          :aria-label="label" :title="label" :aria-pressed="active === undefined ? undefined : String(active)">
    <slot><Icon :name="icon" :size="size === 'sm' ? 14 : 16" /></slot>
  </button>
</template>
