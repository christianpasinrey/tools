<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  timestampInput: String,
  timestampUnit: String,
  dateInput: String,
  result: Object,
  currentTimestamp: Number,
  themeColor: String
})

const emit = defineEmits([
  'update:timestampInput',
  'update:timestampUnit',
  'update:dateInput',
  'timestamp-to-date',
  'date-to-timestamp',
  'set-current',
  'clear',
  'copy',
  'start-updater',
  'stop-updater'
])

onMounted(() => {
  emit('start-updater')
})

onUnmounted(() => {
  emit('stop-updater')
})
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Current timestamp display -->
    <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-xs text-neutral-500 uppercase tracking-wider">Timestamp actual</span>
          <div class="flex items-baseline gap-2 mt-1">
            <code class="text-2xl font-mono font-bold" :style="{ color: themeColor }">{{ currentTimestamp }}</code>
            <span class="text-sm text-neutral-500">segundos</span>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="emit('copy', currentTimestamp.toString())"
            class="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
          >
            Copiar
          </button>
          <button
            @click="emit('set-current')"
            class="px-4 py-2 text-sm rounded-lg transition-colors"
            :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          >
            Usar
          </button>
        </div>
      </div>
    </div>

    <!-- Conversion grid -->
    <div class="grid grid-cols-2 gap-4 flex-1">
      <!-- Timestamp to Date -->
      <div class="flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div class="px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Timestamp a Fecha</span>
        </div>
        <div class="p-4 flex-1 flex flex-col gap-4">
          <div class="flex gap-2">
            <input
              type="text"
              :value="timestampInput"
              @input="emit('update:timestampInput', $event.target.value)"
              placeholder="Ej: 1704067200"
              class="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-mono text-neutral-300 focus:outline-none focus:border-neutral-500"
            />
            <select
              :value="timestampUnit"
              @change="emit('update:timestampUnit', $event.target.value)"
              class="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 focus:outline-none"
            >
              <option value="seconds">Segundos</option>
              <option value="milliseconds">Milisegundos</option>
            </select>
          </div>
          <button
            @click="emit('timestamp-to-date')"
            :disabled="!timestampInput"
            class="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
            :style="{ backgroundColor: themeColor, color: 'white' }"
          >
            Convertir
          </button>

          <!-- Result for timestamp to date -->
          <div v-if="result && result.iso" class="mt-2 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-neutral-500">ISO 8601:</span>
              <code class="text-neutral-300 font-mono">{{ result.iso }}</code>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Local:</span>
              <code class="text-neutral-300 font-mono">{{ result.local }}</code>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">UTC:</span>
              <code class="text-neutral-300 font-mono">{{ result.utc }}</code>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">Relativo:</span>
              <code class="text-neutral-300 font-mono">{{ result.relative }}</code>
            </div>
          </div>
        </div>
      </div>

      <!-- Date to Timestamp -->
      <div class="flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div class="px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Fecha a Timestamp</span>
        </div>
        <div class="p-4 flex-1 flex flex-col gap-4">
          <input
            type="datetime-local"
            :value="dateInput"
            @input="emit('update:dateInput', $event.target.value)"
            class="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 focus:outline-none focus:border-neutral-500"
          />
          <button
            @click="emit('date-to-timestamp')"
            :disabled="!dateInput"
            class="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
            :style="{ backgroundColor: themeColor, color: 'white' }"
          >
            Convertir
          </button>

          <!-- Result for date to timestamp -->
          <div v-if="result && result.seconds" class="mt-2 space-y-2 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-neutral-500">Segundos:</span>
              <div class="flex items-center gap-2">
                <code class="text-neutral-300 font-mono">{{ result.seconds }}</code>
                <button
                  @click="emit('copy', result.seconds.toString())"
                  class="p-1 text-neutral-500 hover:text-white transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-neutral-500">Milisegundos:</span>
              <div class="flex items-center gap-2">
                <code class="text-neutral-300 font-mono">{{ result.milliseconds }}</code>
                <button
                  @click="emit('copy', result.milliseconds.toString())"
                  class="p-1 text-neutral-500 hover:text-white transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-500">ISO 8601:</span>
              <code class="text-neutral-300 font-mono">{{ result.iso }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error display -->
    <div v-if="result && result.error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
      <span class="text-red-400 text-sm">{{ result.error }}</span>
    </div>

    <!-- Quick reference -->
    <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
      <span class="text-xs text-neutral-500 uppercase tracking-wider block mb-2">Referencia rápida</span>
      <div class="grid grid-cols-4 gap-4 text-xs">
        <div>
          <span class="text-neutral-500">1 hora:</span>
          <code class="text-neutral-400 ml-1">3600</code>
        </div>
        <div>
          <span class="text-neutral-500">1 día:</span>
          <code class="text-neutral-400 ml-1">86400</code>
        </div>
        <div>
          <span class="text-neutral-500">1 semana:</span>
          <code class="text-neutral-400 ml-1">604800</code>
        </div>
        <div>
          <span class="text-neutral-500">1 año:</span>
          <code class="text-neutral-400 ml-1">31536000</code>
        </div>
      </div>
    </div>
  </div>
</template>
