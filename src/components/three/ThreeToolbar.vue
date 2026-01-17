<script setup>
import { ref } from 'vue'

const props = defineProps({
  hasObjects: Boolean,
  hasSelection: Boolean,
  bloomEnabled: Boolean,
  currentEnvironment: String,
  environmentPresets: Object,
  materialPresets: Object,
  isImporting: Boolean
})

const emit = defineEmits([
  'add-shape', 'add-spotlight', 'add-pointlight', 'clear', 'reset-camera',
  'delete-selected', 'duplicate-selected', 'deselect',
  'screenshot', 'export-gltf', 'export-glb', 'import',
  'toggle-bloom', 'environment-change', 'material-change'
])

const showShapes = ref(false)
const showExport = ref(false)
const showEnvironment = ref(false)
const showMaterials = ref(false)

const shapes = [
  { id: 'cube', name: 'Cubo' },
  { id: 'sphere', name: 'Esfera' },
  { id: 'torus', name: 'Toro' },
  { id: 'cone', name: 'Cono' },
  { id: 'cylinder', name: 'Cilindro' },
  { id: 'tetrahedron', name: 'Tetraedro' },
  { id: 'octahedron', name: 'Octaedro' },
  { id: 'dodecahedron', name: 'Dodecaedro' },
  { id: 'torusKnot', name: 'Nudo Torico' }
]

const closeAllMenus = () => {
  showShapes.value = false
  showExport.value = false
  showEnvironment.value = false
  showMaterials.value = false
}

const toggleMenu = (menu) => {
  const current = menu === 'shapes' ? showShapes.value :
                  menu === 'export' ? showExport.value :
                  menu === 'environment' ? showEnvironment.value :
                  showMaterials.value
  closeAllMenus()
  if (menu === 'shapes') showShapes.value = !current
  else if (menu === 'export') showExport.value = !current
  else if (menu === 'environment') showEnvironment.value = !current
  else if (menu === 'materials') showMaterials.value = !current
}
</script>

<template>
  <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-1 shrink-0">
    <!-- Add Shapes -->
    <div class="relative">
      <button
        @click="toggleMenu('shapes')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
        </svg>
        <span>Anadir</span>
        <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showShapes" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[160px]">
        <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Geometrias</div>
        <button
          v-for="shape in shapes"
          :key="shape.id"
          @click="emit('add-shape', shape.id); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          {{ shape.name }}
        </button>

        <div class="h-px bg-neutral-800 my-1"></div>
        <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Luces</div>
        <button
          @click="emit('add-spotlight'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <svg class="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7z"/>
          </svg>
          Foco
        </button>
        <button
          @click="emit('add-pointlight'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <svg class="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
          </svg>
          Luz Puntual
        </button>
      </div>
    </div>

    <div class="w-px h-6 bg-neutral-800"></div>

    <!-- Import/Export -->
    <div class="relative">
      <button
        @click="emit('import')"
        :disabled="isImporting"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
        title="Importar modelo 3D"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        Importar
      </button>
    </div>

    <div class="relative">
      <button
        @click="toggleMenu('export')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Exportar
        <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showExport" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[160px]">
        <button
          @click="emit('screenshot'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Captura PNG
        </button>
        <div class="h-px bg-neutral-800 my-1"></div>
        <button
          @click="emit('export-gltf'); closeAllMenus()"
          :disabled="!hasObjects"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          Exportar GLTF
        </button>
        <button
          @click="emit('export-glb'); closeAllMenus()"
          :disabled="!hasObjects"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          Exportar GLB
        </button>
      </div>
    </div>

    <div class="w-px h-6 bg-neutral-800"></div>

    <!-- Materials (when object selected) -->
    <div v-if="hasSelection" class="relative">
      <button
        @click="toggleMenu('materials')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
        </svg>
        Material
        <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showMaterials" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[160px]">
        <button
          v-for="(preset, key) in materialPresets"
          :key="key"
          @click="emit('material-change', key); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <span>{{ preset.icon }}</span>
          {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- Selection actions -->
    <div v-if="hasSelection" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('duplicate-selected')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Duplicar (Ctrl+D)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </button>

      <button
        @click="emit('delete-selected')"
        class="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
        title="Eliminar (Supr)"
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

    <!-- Environment -->
    <div class="relative">
      <button
        @click="toggleMenu('environment')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Entorno
        <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showEnvironment" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[160px]">
        <button
          v-for="(preset, key) in environmentPresets"
          :key="key"
          @click="emit('environment-change', key); closeAllMenus()"
          :class="['w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-800 transition-colors flex items-center gap-2', currentEnvironment === key ? 'text-green-400' : 'text-neutral-300']"
        >
          <span>{{ preset.icon }}</span>
          {{ preset.name }}
          <svg v-if="currentEnvironment === key" class="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Bloom Toggle -->
    <button
      @click="emit('toggle-bloom')"
      :class="['flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors', bloomEnabled ? 'text-purple-400 bg-purple-500/20' : 'text-neutral-400 hover:text-white hover:bg-neutral-800']"
      title="Efecto Bloom"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
      </svg>
      Bloom
    </button>

    <div class="w-px h-6 bg-neutral-800"></div>

    <!-- View Actions -->
    <div class="flex items-center gap-1">
      <button
        @click="emit('reset-camera')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Resetear camara"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        Camara
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
  </div>
</template>
