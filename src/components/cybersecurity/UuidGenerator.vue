<script setup>
defineProps({
  version: String,
  uuids: Array,
  count: Number,
  themeColor: String
})

const emit = defineEmits(['update:version', 'update:count', 'generate', 'clear', 'copy'])
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Controls -->
    <div class="flex items-center gap-4">
      <!-- Version selector -->
      <div class="flex bg-neutral-800 rounded-lg p-1">
        <button
          @click="emit('update:version', 'v4')"
          class="px-4 py-1.5 text-sm rounded-md transition-colors"
          :class="version === 'v4' ? 'text-white' : 'text-neutral-400 hover:text-white'"
          :style="version === 'v4' ? { backgroundColor: themeColor } : {}"
        >
          UUID v4
        </button>
        <button
          @click="emit('update:version', 'v7')"
          class="px-4 py-1.5 text-sm rounded-md transition-colors"
          :class="version === 'v7' ? 'text-white' : 'text-neutral-400 hover:text-white'"
          :style="version === 'v7' ? { backgroundColor: themeColor } : {}"
        >
          UUID v7
        </button>
      </div>

      <!-- Count selector -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-neutral-400">Cantidad:</span>
        <select
          :value="count"
          @change="emit('update:count', parseInt($event.target.value))"
          class="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 focus:outline-none focus:border-neutral-500"
        >
          <option :value="1">1</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </div>

      <div class="flex-1" />

      <button
        @click="emit('generate')"
        class="px-6 py-2 text-sm font-medium rounded-lg transition-colors"
        :style="{ backgroundColor: themeColor, color: 'white' }"
      >
        Generar
      </button>

      <button
        v-if="uuids.length > 0"
        @click="emit('copy', uuids.join('\n'))"
        class="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
      >
        Copiar todos
      </button>

      <button
        v-if="uuids.length > 0"
        @click="emit('clear')"
        class="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
      >
        Limpiar
      </button>
    </div>

    <!-- Info boxes -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div class="flex items-center gap-2 mb-2">
          <span
            class="px-2 py-0.5 text-xs font-medium rounded"
            :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          >
            v4
          </span>
          <span class="text-sm font-medium text-neutral-300">Random</span>
        </div>
        <p class="text-xs text-neutral-500">
          UUID v4 usa 122 bits aleatorios. Ideal para la mayoría de casos. Probabilidad de colisión extremadamente baja.
        </p>
      </div>
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div class="flex items-center gap-2 mb-2">
          <span
            class="px-2 py-0.5 text-xs font-medium rounded"
            :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          >
            v7
          </span>
          <span class="text-sm font-medium text-neutral-300">Timestamp-based</span>
        </div>
        <p class="text-xs text-neutral-500">
          UUID v7 incluye timestamp. Son ordenables cronológicamente. Mejor para bases de datos (índices más eficientes).
        </p>
      </div>
    </div>

    <!-- Results -->
    <div class="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden min-h-0">
      <div class="px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          UUIDs generados ({{ uuids.length }})
        </span>
      </div>

      <div v-if="uuids.length > 0" class="overflow-auto h-full max-h-[calc(100%-2.5rem)]">
        <div
          v-for="(uuid, idx) in uuids"
          :key="idx"
          class="flex items-center gap-4 px-4 py-2 hover:bg-neutral-800/50 transition-colors border-b border-neutral-800/50 last:border-0"
        >
          <span class="text-xs text-neutral-600 w-6">{{ idx + 1 }}</span>
          <code class="flex-1 text-sm text-neutral-300 font-mono select-all">{{ uuid }}</code>
          <button
            @click="emit('copy', uuid)"
            class="p-1.5 text-neutral-500 hover:text-white transition-colors"
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          <p class="text-sm">Haz clic en "Generar" para crear UUIDs</p>
        </div>
      </div>
    </div>
  </div>
</template>
