<script setup>
import { ref } from 'vue'

const props = defineProps({
  hasFile: Boolean,
  canUndo: Boolean,
  canRedo: Boolean,
  zoom: Number,
  themeColor: String,
  isCropping: Boolean
})

const emit = defineEmits([
  'open', 'export', 'undo', 'redo',
  'rotate-left', 'rotate-right', 'flip-h', 'flip-v',
  'crop', 'apply-crop', 'cancel-crop',
  'filter', 'apply-adjustments', 'reset',
  'zoom', 'color-change'
])

const showFilters = ref(false)
const showColors = ref(false)

const colors = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f97316', '#eab308', '#14b8a6', '#ef4444'
]

const filters = [
  { id: 'grayscale', name: 'B/N' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'cold', name: 'Frío' },
  { id: 'warm', name: 'Cálido' },
  { id: 'invert', name: 'Invertir' }
]
</script>

<template>
  <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-1 shrink-0">
    <!-- File Actions -->
    <div class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('open')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
        title="Abrir imagen"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
        <span>Abrir</span>
      </button>

      <button
        v-if="hasFile"
        @click="emit('export')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
        :style="{ backgroundColor: themeColor + '20', color: themeColor }"
        title="Exportar imagen"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        <span>Exportar</span>
      </button>
    </div>

    <!-- History -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('undo')"
        :disabled="!canUndo"
        :class="['p-1.5 rounded transition-colors', canUndo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']"
        title="Deshacer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
        </svg>
      </button>
      <button
        @click="emit('redo')"
        :disabled="!canRedo"
        :class="['p-1.5 rounded transition-colors', canRedo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']"
        title="Rehacer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
        </svg>
      </button>
    </div>

    <!-- Transform Tools -->
    <div v-if="hasFile && !isCropping" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('rotate-left')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Rotar izquierda"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
      <button
        @click="emit('rotate-right')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Rotar derecha"
      >
        <svg class="w-4 h-4 scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
      <button
        @click="emit('flip-h')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Voltear horizontal"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21L3 12l4-9m10 18l4-9-4-9m-5 0v18"/>
        </svg>
      </button>
      <button
        @click="emit('flip-v')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Voltear vertical"
      >
        <svg class="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21L3 12l4-9m10 18l4-9-4-9m-5 0v18"/>
        </svg>
      </button>
      <button
        @click="emit('crop')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Recortar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 3v3M3 7h3m0 0v10a2 2 0 002 2h10m-12-12h12a2 2 0 012 2v10m0-12h3m-3 0V3m0 18v-3"/>
        </svg>
      </button>
    </div>

    <!-- Crop Actions -->
    <div v-if="isCropping" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('apply-crop')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
        :style="{ backgroundColor: themeColor + '20', color: themeColor }"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"/>
        </svg>
        Aplicar
      </button>
      <button
        @click="emit('cancel-crop')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        Cancelar
      </button>
    </div>

    <!-- Filters -->
    <div v-if="hasFile && !isCropping" class="flex items-center gap-1 pr-2 border-r border-neutral-800 relative">
      <button
        @click="showFilters = !showFilters"
        :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors', showFilters ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800']"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
        </svg>
        Filtros
      </button>

      <!-- Filters Dropdown -->
      <div v-if="showFilters" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1">
        <button
          v-for="filter in filters"
          :key="filter.id"
          @click="emit('filter', filter.id); showFilters = false"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          {{ filter.name }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="hasFile && !isCropping" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('apply-adjustments')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Aplicar ajustes permanentemente"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"/>
        </svg>
        Aplicar
      </button>
      <button
        @click="emit('reset')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Resetear ajustes"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9"/>
        </svg>
        Reset
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Zoom -->
    <div v-if="hasFile" class="flex items-center gap-2 px-2 border-l border-neutral-800">
      <span class="text-neutral-500 text-xs">Zoom</span>
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.1"
        :value="zoom"
        @input="emit('zoom', parseFloat($event.target.value))"
        class="w-20 h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-current"
        :style="{ accentColor: themeColor }"
      />
      <span class="text-neutral-400 text-xs font-mono w-10">{{ (zoom * 100).toFixed(0) }}%</span>
    </div>

    <!-- Color Picker -->
    <div class="relative pl-2 border-l border-neutral-800">
      <button
        @click="showColors = !showColors"
        class="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-neutral-800 transition-colors"
        title="Color del tema"
      >
        <div class="w-4 h-4 rounded" :style="{ backgroundColor: themeColor }"></div>
      </button>

      <div v-if="showColors" class="absolute top-full right-0 mt-1 p-2 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50">
        <div class="flex gap-1">
          <button
            v-for="color in colors"
            :key="color"
            @click="emit('color-change', color); showColors = false"
            :class="['w-6 h-6 rounded transition-transform hover:scale-110', color === themeColor ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900' : '']"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>
