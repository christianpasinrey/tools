<script setup>
import Icon from '../icons/Icon.vue'
defineProps({
  variant: { type: String, default: 'secondary' },
  size: { type: String, default: 'md' },
  loading: Boolean,
  icon: { type: String, default: null },
  type: { type: String, default: 'button' }
})
</script>

<template>
  <button :type="type" class="tb-btn tb-ui" :class="[`tb-btn-${variant}`, `tb-btn-${size}`]"
          :disabled="loading || $attrs.disabled" :aria-busy="loading || undefined">
    <span v-if="loading" class="tb-spinner" aria-hidden="true"></span>
    <Icon v-else-if="icon" :name="icon" :size="size === 'sm' ? 14 : 16" />
    <slot />
  </button>
</template>
