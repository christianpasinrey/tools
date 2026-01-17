<script setup>
import { ref } from 'vue'

defineProps({
  hasFile: Boolean,
  hasSelection: Boolean,
  canUndo: Boolean,
  canRedo: Boolean,
  zoomLevel: Number,
  themeColor: String,
  visualStyle: String
})

const emit = defineEmits([
  'open', 'export', 'undo', 'redo',
  'trim', 'delete', 'silence',
  'fadeIn', 'fadeOut', 'normalize',
  'zoom', 'colorChange', 'styleChange'
])

const showColors = ref(false)

const styles = [
  { id: 'line', icon: 'M2 12h4l3-9 4 18 3-9h4' }, // Line wave
  { id: 'bars', icon: 'M4 8v8M8 5v14M12 7v10M16 5v14M20 8v8' }, // Bars centered
  { id: 'equalizer', icon: 'M4 20v-8M8 20v-14M12 20v-10M16 20v-14M20 20v-8' } // Bars from bottom
]

const colors = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f97316', '#eab308', '#14b8a6', '#ef4444'
]

const handleZoom = (e) => emit('zoom', parseInt(e.target.value))
</script>

<template>
  <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-1 shrink-0">
    <!-- File -->
    <div class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button @click="emit('open')" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
        <span>Abrir</span>
      </button>
      <button v-if="hasFile" @click="emit('export')" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors" :style="{ backgroundColor: themeColor + '20', color: themeColor }">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        <span>Exportar</span>
      </button>
    </div>

    <!-- History -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button @click="emit('undo')" :disabled="!canUndo" :class="['p-1.5 rounded transition-colors', canUndo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
        </svg>
      </button>
      <button @click="emit('redo')" :disabled="!canRedo" :class="['p-1.5 rounded transition-colors', canRedo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
        </svg>
      </button>
    </div>

    <!-- Edit -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button @click="emit('trim')" :disabled="!hasSelection" :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors', hasSelection ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
        Recortar
      </button>
      <button @click="emit('delete')" :disabled="!hasSelection" :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors', hasSelection ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Eliminar
      </button>
      <button @click="emit('silence')" :disabled="!hasSelection" :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors', hasSelection ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
        Silencio
      </button>
    </div>

    <!-- FX -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button @click="emit('fadeIn')" :disabled="!hasSelection" :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors', hasSelection ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']">
        Fade In
      </button>
      <button @click="emit('fadeOut')" :disabled="!hasSelection" :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors', hasSelection ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed']">
        Fade Out
      </button>
      <button @click="emit('normalize')" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
        Normalizar
      </button>
    </div>

    <!-- Style -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        v-for="style in styles"
        :key="style.id"
        @click="emit('styleChange', style.id)"
        :class="['w-7 h-7 rounded flex items-center justify-center transition-colors', visualStyle === style.id ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300']"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path :d="style.icon" />
        </svg>
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Zoom -->
    <div v-if="hasFile" class="flex items-center gap-2 px-2 border-l border-neutral-800">
      <span class="text-neutral-500 text-xs">Zoom</span>
      <input
        type="range"
        min="1"
        max="500"
        :value="zoomLevel"
        @input="handleZoom"
        class="w-20 h-1 bg-neutral-700 rounded appearance-none cursor-pointer accent-current"
        :style="{ accentColor: themeColor }"
      />
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
            @click="emit('colorChange', color); showColors = false"
            :class="['w-6 h-6 rounded transition-transform hover:scale-110', color === themeColor ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900' : '']"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>
