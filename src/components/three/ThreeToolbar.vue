<script setup>
import { ref } from 'vue'

const props = defineProps({
  themeColor: String,
  hasObjects: Boolean,
  hasSelection: Boolean,
  transformMode: String
})

const emit = defineEmits([
  'add-shape', 'load-preset', 'clear', 'reset-camera',
  'toggle-wireframe', 'color-change', 'transform-mode', 'delete-selected', 'deselect'
])

const showShapes = ref(false)
const showPresets = ref(false)
const showColors = ref(false)

const shapes = [
  { id: 'cube', name: 'Cubo' },
  { id: 'sphere', name: 'Esfera' },
  { id: 'torus', name: 'Toro' },
  { id: 'cone', name: 'Cono' },
  { id: 'cylinder', name: 'Cilindro' },
  { id: 'tetrahedron', name: 'Tetraedro' },
  { id: 'octahedron', name: 'Octaedro' },
  { id: 'dodecahedron', name: 'Dodecaedro' },
  { id: 'torusKnot', name: 'Nudo Tórico' }
]

const presets = [
  { id: 'empty', name: 'Vacío' },
  { id: 'cube', name: 'Cubo Rotativo' },
  { id: 'spheres', name: 'Órbita de Esferas' },
  { id: 'particles', name: 'Sistema de Partículas' },
  { id: 'waves', name: 'Ondas' }
]

const colors = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f97316', '#eab308', '#14b8a6', '#ef4444'
]
</script>

<template>
  <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-1 shrink-0">
    <!-- Presets -->
    <div class="relative">
      <button
        @click="showPresets = !showPresets"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        </svg>
        <span>Escenas</span>
        <svg class="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showPresets" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[160px]">
        <button
          v-for="preset in presets"
          :key="preset.id"
          @click="emit('load-preset', preset.id); showPresets = false"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <div class="w-px h-6 bg-neutral-800"></div>

    <!-- Add Shapes -->
    <div class="relative">
      <button
        @click="showShapes = !showShapes"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
        :style="{ backgroundColor: themeColor + '20', color: themeColor }"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
        </svg>
        <span>Añadir</span>
        <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showShapes" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[140px]">
        <button
          v-for="shape in shapes"
          :key="shape.id"
          @click="emit('add-shape', shape.id); showShapes = false"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          {{ shape.name }}
        </button>
      </div>
    </div>

    <div class="w-px h-6 bg-neutral-800"></div>

    <!-- View Actions -->
    <div class="flex items-center gap-1">
      <button
        @click="emit('reset-camera')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Resetear cámara"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l-4 4m0 0l-4-4m4 4V3m0 17a9 9 0 110-18"/>
        </svg>
        Cámara
      </button>

      <button
        @click="emit('toggle-wireframe')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Alternar wireframe"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
        </svg>
        Wireframe
      </button>

      <button
        v-if="hasObjects"
        @click="emit('clear')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
        title="Limpiar escena"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Limpiar
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Info -->
    <div class="px-3 text-xs text-neutral-500">
      Arrastra para rotar | Scroll para zoom
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
