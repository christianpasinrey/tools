<script setup>
import Icon from '../icons/Icon.vue'
const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, required: true },
  label: { type: String, required: true },
  size: { type: String, default: 'md' }
})
const emit = defineEmits(['update:modelValue'])

function move(index, delta) {
  const next = (index + delta + props.options.length) % props.options.length
  emit('update:modelValue', props.options[next].value)
}
function onKeydown(e, index) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(index, 1) }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(index, -1) }
}
</script>

<template>
  <div role="radiogroup" :aria-label="label" class="tb-seg tb-ui" :class="size === 'sm' && 'tb-seg-sm'">
    <button v-for="(opt, i) in options" :key="opt.value" type="button" role="radio" class="tb-seg-item"
            :aria-checked="opt.value === modelValue" :tabindex="opt.value === modelValue ? 0 : -1"
            :title="opt.title || undefined"
            @click="emit('update:modelValue', opt.value)" @keydown="onKeydown($event, i)">
      <Icon v-if="opt.icon" :name="opt.icon" :size="15" />
      <span v-if="opt.label">{{ opt.label }}</span>
    </button>
  </div>
</template>
