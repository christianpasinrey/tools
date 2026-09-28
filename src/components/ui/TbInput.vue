<script setup>
import Icon from '../icons/Icon.vue'
defineOptions({ inheritAttrs: false })
const model = defineModel({ type: [String, Number], default: '' })
defineProps({ size: { type: String, default: 'md' }, icon: { type: String, default: null } })
</script>

<template>
  <label class="tb-input tb-ui" :class="[`tb-input-${size}`, $attrs.class]">
    <Icon v-if="icon" :name="icon" :size="14" class="tb-input-icon" />
    <input v-model="model" v-bind="{ ...$attrs, class: undefined }" class="tb-input-field tb-bare-input" />
    <slot name="end" />
  </label>
</template>
