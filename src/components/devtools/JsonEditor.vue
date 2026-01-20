<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: String,
  readonly: Boolean,
  error: String,
  placeholder: String
})

const emit = defineEmits(['update:modelValue'])

const highlightedValue = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
      let cls = 'text-emerald-400'
      if (/:$/.test(match)) {
        cls = 'text-sky-400'
      }
      return `<span class="${cls}">${match}</span>`
    })
    .replace(/\b(true|false)\b/g, '<span class="text-amber-400">$1</span>')
    .replace(/\b(null)\b/g, '<span class="text-neutral-500">$1</span>')
    .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="text-purple-400">$1</span>')
})
</script>

<template>
  <div class="relative bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden h-full">
    <textarea
      v-if="!readonly"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      class="w-full h-full p-4 bg-transparent text-neutral-300 font-mono text-sm resize-none outline-none focus:ring-1 focus:ring-cyan-500/50"
      spellcheck="false"
    ></textarea>
    <pre
      v-else
      class="w-full h-full p-4 overflow-auto font-mono text-sm whitespace-pre-wrap"
      :class="error ? 'text-red-400' : 'text-neutral-300'"
      v-html="highlightedValue || modelValue || '<span class=\'text-neutral-600\'>Output will appear here...</span>'"
    ></pre>
  </div>
</template>
