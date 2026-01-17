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
  { id: 'cube', name: 'Cubo', icon: 'shape' },
  { id: 'sphere', name: 'Esfera', icon: 'shape' },
  { id: 'torus', name: 'Toro', icon: 'shape' },
  { id: 'cone', name: 'Cono', icon: 'shape' },
  { id: 'cylinder', name: 'Cilindro', icon: 'shape' },
  { id: 'tetrahedron', name: 'Tetraedro', icon: 'shape' },
  { id: 'octahedron', name: 'Octaedro', icon: 'shape' },
  { id: 'dodecahedron', name: 'Dodecaedro', icon: 'shape' },
  { id: 'torusKnot', name: 'Nudo Tórico', icon: 'shape' },
  { id: 'divider' },
  { id: 'spotlight', name: 'Foco', icon: 'light' },
  { id: 'pointlight', name: 'Luz Puntual', icon: 'light' }
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

      <div v-if="showShapes" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[160px]">
        <template v-for="shape in shapes" :key="shape.id">
          <!-- Divider -->
          <div v-if="shape.id === 'divider'" class="h-px bg-neutral-800 my-1"></div>
          <!-- Shape/Light button -->
          <button
            v-else
            @click="emit('add-shape', shape.id); showShapes = false"
            class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
          >
            <!-- Light icon -->
            <svg v-if="shape.icon === 'light'" class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7zm2 15h-4v-1h4v1zm0-3h-4v-1h4v1zM9 21a1 1 0 001 1h4a1 1 0 001-1v-1H9v1z"/>
            </svg>
            {{ shape.name }}
          </button>
        </template>
      </div>
    </div>

    <div class="w-px h-6 bg-neutral-800"></div>

    <!-- Transform Mode (when object selected) -->
    <div v-if="hasSelection" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('transform-mode', 'translate')"
        :class="['p-1.5 rounded transition-colors', transformMode === 'translate' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800']"
        title="Mover (G)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
        </svg>
      </button>
      <button
        @click="emit('transform-mode', 'rotate')"
        :class="['p-1.5 rounded transition-colors', transformMode === 'rotate' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800']"
        title="Rotar (R)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
      <button
        @click="emit('transform-mode', 'scale')"
        :class="['p-1.5 rounded transition-colors', transformMode === 'scale' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800']"
        title="Escalar (S)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4"/>
        </svg>
      </button>

      <div class="w-px h-4 bg-neutral-700 mx-1"></div>

      <button
        @click="emit('delete-selected')"
        class="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
        title="Eliminar seleccionado (Supr)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>

      <button
        @click="emit('deselect')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Deseleccionar (Esc)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12a9 9 0 1018 0 9 9 0 00-18 0zm9-4v4l3 3"/>
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
