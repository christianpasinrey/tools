<script setup>
defineProps({
  input: String,
  format: String,
  results: Object,
  error: String,
  themeColor: String
})

const emit = defineEmits(['update:input', 'update:format', 'convert', 'clear', 'copy'])

const formats = [
  { value: 'text', label: 'Texto', icon: 'A' },
  { value: 'hex', label: 'Hex', icon: '0x' },
  { value: 'binary', label: 'Binario', icon: '01' }
]
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Format selector -->
    <div class="flex items-center gap-4">
      <span class="text-sm text-neutral-400">Formato de entrada:</span>
      <div class="flex bg-neutral-800 rounded-lg p-1">
        <button
          v-for="fmt in formats"
          :key="fmt.value"
          @click="emit('update:format', fmt.value)"
          class="px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2"
          :class="format === fmt.value ? 'text-white' : 'text-neutral-400 hover:text-white'"
          :style="format === fmt.value ? { backgroundColor: themeColor } : {}"
        >
          <span class="font-mono text-xs opacity-70">{{ fmt.icon }}</span>
          {{ fmt.label }}
        </button>
      </div>

      <div class="flex-1" />

      <button
        @click="emit('convert')"
        :disabled="!input"
        class="px-6 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        :style="{ backgroundColor: themeColor, color: 'white' }"
      >
        Convertir
      </button>

      <button
        @click="emit('clear')"
        class="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
      >
        Limpiar
      </button>
    </div>

    <!-- Input -->
    <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
      <div class="px-4 py-2 border-b border-neutral-800">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Entrada ({{ formats.find(f => f.value === format)?.label }})
        </span>
      </div>
      <textarea
        :value="input"
        @input="emit('update:input', $event.target.value)"
        :placeholder="format === 'text' ? 'Escribe texto...' : format === 'hex' ? 'Ej: 48 65 6c 6c 6f' : 'Ej: 01001000 01100101'"
        rows="3"
        class="w-full p-4 bg-transparent text-neutral-300 text-sm font-mono resize-none focus:outline-none placeholder:text-neutral-600"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
      <span class="text-red-400 text-sm">{{ error }}</span>
    </div>

    <!-- Results grid -->
    <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
      <!-- ASCII -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">ASCII / Texto</span>
          <button
            v-if="results.ascii"
            @click="emit('copy', results.ascii)"
            class="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>
        <div class="flex-1 p-4 overflow-auto">
          <code v-if="results.ascii" class="text-sm text-neutral-300 font-mono break-all whitespace-pre-wrap">{{ results.ascii }}</code>
          <span v-else class="text-sm text-neutral-600">-</span>
        </div>
      </div>

      <!-- Hex -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Hexadecimal</span>
          <button
            v-if="results.hex"
            @click="emit('copy', results.hex)"
            class="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>
        <div class="flex-1 p-4 overflow-auto">
          <code v-if="results.hex" class="text-sm font-mono break-all" :style="{ color: themeColor }">{{ results.hex }}</code>
          <span v-else class="text-sm text-neutral-600">-</span>
        </div>
      </div>

      <!-- Binary -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Binario</span>
          <button
            v-if="results.binary"
            @click="emit('copy', results.binary)"
            class="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>
        <div class="flex-1 p-4 overflow-auto">
          <code v-if="results.binary" class="text-sm text-green-400 font-mono break-all">{{ results.binary }}</code>
          <span v-else class="text-sm text-neutral-600">-</span>
        </div>
      </div>

      <!-- Decimal -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Decimal</span>
          <button
            v-if="results.decimal"
            @click="emit('copy', results.decimal)"
            class="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>
        <div class="flex-1 p-4 overflow-auto">
          <code v-if="results.decimal" class="text-sm text-blue-400 font-mono break-all">{{ results.decimal }}</code>
          <span v-else class="text-sm text-neutral-600">-</span>
        </div>
      </div>

      <!-- Base64 -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex flex-col col-span-2">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Base64</span>
          <button
            v-if="results.base64"
            @click="emit('copy', results.base64)"
            class="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>
        <div class="p-4 overflow-auto">
          <code v-if="results.base64" class="text-sm text-yellow-400 font-mono break-all">{{ results.base64 }}</code>
          <span v-else class="text-sm text-neutral-600">-</span>
        </div>
      </div>
    </div>
  </div>
</template>
