<script setup>
defineProps({
  input: String,
  results: Object,
  algorithm: String,
  loading: Boolean,
  algorithms: Array,
  themeColor: String
})

const emit = defineEmits(['update:input', 'update:algorithm', 'generate', 'generate-all', 'clear', 'copy'])
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Input section -->
    <div class="flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Texto a hashear</span>
        <button
          @click="emit('clear')"
          class="text-xs text-neutral-500 hover:text-white transition-colors"
        >
          Limpiar
        </button>
      </div>
      <textarea
        :value="input"
        @input="emit('update:input', $event.target.value)"
        placeholder="Introduce el texto para generar hash..."
        rows="4"
        class="p-4 bg-transparent text-neutral-300 text-sm font-mono resize-none focus:outline-none placeholder:text-neutral-600"
      />
    </div>

    <!-- Algorithm selector & actions -->
    <div class="flex items-center gap-4">
      <div class="flex gap-2">
        <button
          v-for="algo in algorithms"
          :key="algo"
          @click="emit('update:algorithm', algo)"
          class="px-3 py-1.5 text-xs rounded-lg transition-colors"
          :class="algorithm === algo ? 'text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'"
          :style="algorithm === algo ? { backgroundColor: themeColor } : {}"
        >
          {{ algo }}
        </button>
      </div>

      <div class="flex-1" />

      <button
        @click="emit('generate')"
        :disabled="!input || loading"
        class="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
        :style="{ backgroundColor: themeColor + '20', color: themeColor }"
      >
        Generar {{ algorithm }}
      </button>

      <button
        @click="emit('generate-all')"
        :disabled="!input || loading"
        class="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors disabled:opacity-50"
      >
        Generar todos
      </button>
    </div>

    <!-- Results -->
    <div class="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
      <div class="px-4 py-2 border-b border-neutral-800">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Resultados</span>
      </div>

      <div v-if="loading" class="p-4 flex items-center justify-center">
        <svg class="w-6 h-6 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <div v-else-if="Object.keys(results).length > 0" class="divide-y divide-neutral-800">
        <div
          v-for="(hash, algo) in results"
          :key="algo"
          class="flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/50 transition-colors"
        >
          <span
            class="w-20 text-xs font-medium px-2 py-1 rounded text-center"
            :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          >
            {{ algo }}
          </span>
          <code class="flex-1 text-sm text-neutral-300 font-mono break-all">{{ hash }}</code>
          <button
            @click="emit('copy', hash)"
            class="p-2 text-neutral-500 hover:text-white transition-colors shrink-0"
            title="Copiar"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div v-else class="flex-1 flex items-center justify-center p-8 text-neutral-600">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          <p class="text-sm">Introduce texto y genera hashes</p>
        </div>
      </div>
    </div>
  </div>
</template>
