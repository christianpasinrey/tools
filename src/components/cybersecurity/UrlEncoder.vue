<script setup>
defineProps({
  input: String,
  output: String,
  mode: String,
  error: String,
  themeColor: String
})

const emit = defineEmits(['update:input', 'update:mode', 'process', 'encode-all', 'swap', 'clear', 'copy'])
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Mode toggle -->
    <div class="flex items-center gap-4">
      <div class="flex bg-neutral-800 rounded-lg p-1">
        <button
          @click="emit('update:mode', 'encode')"
          class="px-4 py-1.5 text-sm rounded-md transition-colors"
          :class="mode === 'encode' ? 'text-white' : 'text-neutral-400 hover:text-white'"
          :style="mode === 'encode' ? { backgroundColor: themeColor } : {}"
        >
          Encode
        </button>
        <button
          @click="emit('update:mode', 'decode')"
          class="px-4 py-1.5 text-sm rounded-md transition-colors"
          :class="mode === 'decode' ? 'text-white' : 'text-neutral-400 hover:text-white'"
          :style="mode === 'decode' ? { backgroundColor: themeColor } : {}"
        >
          Decode
        </button>
      </div>

      <div class="flex-1" />

      <button
        @click="emit('process')"
        :disabled="!input"
        class="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
        :style="{ backgroundColor: themeColor + '20', color: themeColor }"
      >
        {{ mode === 'encode' ? 'Codificar' : 'Decodificar' }}
      </button>

      <button
        v-if="mode === 'encode'"
        @click="emit('encode-all')"
        :disabled="!input"
        class="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors disabled:opacity-50"
        title="Codifica todos los caracteres incluyendo letras y números"
      >
        Encode All
      </button>

      <button
        @click="emit('swap')"
        :disabled="!output"
        class="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors disabled:opacity-50"
        title="Intercambiar entrada y salida"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
    </div>

    <!-- Input/Output grid -->
    <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <!-- Input -->
      <div class="flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Entrada</span>
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
          :placeholder="mode === 'encode' ? 'Texto a codificar...' : 'URL encoded text...'"
          class="flex-1 p-4 bg-transparent text-neutral-300 text-sm font-mono resize-none focus:outline-none placeholder:text-neutral-600"
        />
      </div>

      <!-- Output -->
      <div class="flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Resultado</span>
          <button
            v-if="output"
            @click="emit('copy', output)"
            class="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>
        <div class="flex-1 p-4 overflow-auto">
          <code v-if="output" class="text-sm text-neutral-300 font-mono break-all whitespace-pre-wrap">{{ output }}</code>
          <p v-else-if="error" class="text-sm text-red-400">{{ error }}</p>
          <p v-else class="text-sm text-neutral-600">El resultado aparecerá aquí...</p>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="text-xs text-neutral-500 px-2">
      <span class="font-medium">Tip:</span> URL Encoding convierte caracteres especiales en formato seguro para URLs.
      Útil para payloads XSS, parámetros de query strings y análisis de seguridad.
    </div>
  </div>
</template>
