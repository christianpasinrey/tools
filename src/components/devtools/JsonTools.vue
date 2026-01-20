<script setup>
import { ref } from 'vue'
import JsonEditor from './JsonEditor.vue'

const props = defineProps({
  input: String,
  output: String,
  error: String,
  themeColor: String
})

const emit = defineEmits(['update:input', 'format', 'minify', 'validate', 'to-yaml', 'from-yaml', 'copy', 'clear'])

const copied = ref(false)

const handleCopy = async () => {
  emit('copy', props.output)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const actions = [
  { id: 'format', name: 'Beautify', icon: 'M4 6h16M4 12h16m-7 6h7' },
  { id: 'minify', name: 'Minify', icon: 'M20 12H4' },
  { id: 'validate', name: 'Validate', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'to-yaml', name: 'To YAML', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' },
  { id: 'from-yaml', name: 'From YAML', icon: 'M7 8V20m0 0l-4-4m4 4l4-4m6 0V4m0 0l4 4m-4-4l-4 4' }
]
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="action in actions"
        :key="action.id"
        @click="emit(action.id)"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.icon"/>
        </svg>
        {{ action.name }}
      </button>

      <div class="flex-1"></div>

      <button
        @click="emit('clear')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-300 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Clear
      </button>
    </div>

    <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <div class="flex flex-col gap-2 min-h-0">
        <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium">Input</label>
        <JsonEditor
          :modelValue="input"
          @update:modelValue="emit('update:input', $event)"
          placeholder="Paste your JSON or YAML here..."
          class="flex-1"
        />
      </div>

      <div class="flex flex-col gap-2 min-h-0">
        <div class="flex items-center justify-between">
          <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium">Output</label>
          <button
            v-if="output"
            @click="handleCopy"
            class="flex items-center gap-1 text-xs transition-colors"
            :class="copied ? 'text-green-400' : 'text-neutral-500 hover:text-white'"
          >
            <svg v-if="!copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <JsonEditor
          :modelValue="output"
          :readonly="true"
          :error="error"
          class="flex-1"
        />
      </div>
    </div>

    <div
      v-if="error"
      class="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2"
    >
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>
