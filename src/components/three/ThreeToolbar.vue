<script setup>
import { ref } from 'vue'

const props = defineProps({
  hasObjects: Boolean,
  hasSelection: Boolean,
  bloomEnabled: Boolean,
  currentEnvironment: String,
  currentLighting: String,
  environmentPresets: Object,
  lightingPresets: Object,
  lightTypes: Object,
  scenePresets: Object,
  materialPresets: Object,
  isImporting: Boolean,
  isPresetActive: Boolean,
  isAnimationPlaying: Boolean,
  isRecording: Boolean,
  savedScenes: Array
})

const emit = defineEmits([
  'add-shape', 'add-spotlight', 'add-pointlight', 'add-arealight', 'add-hemisphere', 'add-directional',
  'clear', 'reset-camera', 'delete-selected', 'duplicate-selected', 'deselect',
  'screenshot', 'export-gltf', 'export-glb', 'import', 'import-human', 'load-scene-preset',
  'toggle-bloom', 'environment-change', 'lighting-change', 'material-change', 'load-preset',
  'toggle-animation', 'toggle-recording', 'load-saved-scene', 'delete-saved-scene'
])

const showSavedScenes = ref(false)

const showPresets = ref(false)
const showShapes = ref(false)
const showExport = ref(false)
const showEnvironment = ref(false)
const showLighting = ref(false)
const showMaterials = ref(false)
const showScenePresets = ref(false)

const presets = [
  { id: 'empty', name: 'Vacio' },
  { id: 'cube', name: 'Cubo Rotativo' },
  { id: 'spheres', name: 'Orbita de Esferas' },
  { id: 'particles', name: 'Sistema de Particulas' },
  { id: 'waves', name: 'Ondas' }
]

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
  showPresets.value = false
  showShapes.value = false
  showExport.value = false
  showEnvironment.value = false
  showLighting.value = false
  showMaterials.value = false
  showSavedScenes.value = false
  showScenePresets.value = false
}

const toggleMenu = (menu) => {
  const current = menu === 'presets' ? showPresets.value :
                  menu === 'shapes' ? showShapes.value :
                  menu === 'export' ? showExport.value :
                  menu === 'environment' ? showEnvironment.value :
                  menu === 'lighting' ? showLighting.value :
                  menu === 'saved' ? showSavedScenes.value :
                  menu === 'scenePresets' ? showScenePresets.value :
                  showMaterials.value
  closeAllMenus()
  if (menu === 'presets') showPresets.value = !current
  else if (menu === 'shapes') showShapes.value = !current
  else if (menu === 'export') showExport.value = !current
  else if (menu === 'environment') showEnvironment.value = !current
  else if (menu === 'lighting') showLighting.value = !current
  else if (menu === 'saved') showSavedScenes.value = !current
  else if (menu === 'scenePresets') showScenePresets.value = !current
  else if (menu === 'materials') showMaterials.value = !current
}
</script>

<template>
  <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-1 shrink-0">
    <!-- Presets / Escenas -->
    <div class="relative">
      <button
        @click="toggleMenu('presets')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <span>Escenas</span>
        <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showPresets" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[180px]">
        <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Plantillas</div>
        <button
          v-for="preset in presets"
          :key="preset.id"
          @click="emit('load-preset', preset.id); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <!-- Play/Pause for presets OR Record/Stop for manual mode -->
    <div v-if="isPresetActive" class="flex items-center">
      <button
        @click="emit('toggle-animation')"
        :class="[
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
          isAnimationPlaying
            ? 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20'
            : 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
        ]"
        :title="isAnimationPlaying ? 'Pausar animación' : 'Reproducir animación'"
      >
        <!-- Pause icon -->
        <svg v-if="isAnimationPlaying" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
        </svg>
        <!-- Play icon -->
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        {{ isAnimationPlaying ? 'Pausar' : 'Play' }}
      </button>
    </div>

    <div v-else class="flex items-center gap-1">
      <button
        @click="emit('toggle-recording')"
        :class="[
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors',
          isRecording
            ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30 animate-pulse'
            : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
        ]"
        :title="isRecording ? 'Detener grabación' : 'Grabar escena'"
      >
        <!-- Stop icon -->
        <svg v-if="isRecording" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="1"/>
        </svg>
        <!-- Record icon -->
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6"/>
        </svg>
        {{ isRecording ? 'Detener' : 'Grabar' }}
      </button>

      <!-- Saved Scenes dropdown -->
      <div v-if="savedScenes?.length > 0" class="relative">
        <button
          @click="toggleMenu('saved')"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          title="Escenas guardadas"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
          </svg>
          <span>Mis Escenas</span>
          <span class="bg-blue-500/30 text-blue-300 text-[10px] px-1.5 rounded-full">{{ savedScenes.length }}</span>
        </button>

        <div v-if="showSavedScenes" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[200px]">
          <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Escenas Guardadas</div>
          <div
            v-for="scene in savedScenes"
            :key="scene.id"
            class="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-800 group"
          >
            <button
              @click="emit('load-saved-scene', scene); closeAllMenus()"
              class="flex-1 text-left text-xs text-neutral-300 hover:text-white"
            >
              <div class="font-medium">{{ scene.name }}</div>
              <div class="text-[10px] text-neutral-500">
                {{ scene.objects?.length || 0 }} objetos · {{ scene.duration?.toFixed(1) || 0 }}s · {{ scene.timestamp }}
              </div>
            </button>
            <button
              @click.stop="emit('delete-saved-scene', scene.id)"
              class="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 text-neutral-500 transition-all"
              title="Eliminar"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="w-px h-6 bg-neutral-800"></div>

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
          <span class="text-sm">🔦</span>
          Foco
        </button>
        <button
          @click="emit('add-pointlight'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <span class="text-sm">💡</span>
          Punto
        </button>
        <button
          @click="emit('add-arealight'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <span class="text-sm">📦</span>
          Softbox
        </button>
        <button
          @click="emit('add-hemisphere'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <span class="text-sm">🌤️</span>
          Hemisferio
        </button>
        <button
          @click="emit('add-directional'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <span class="text-sm">☀️</span>
          Direccional
        </button>

        <div class="h-px bg-neutral-800 my-1"></div>
        <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Modelos</div>
        <button
          @click="emit('import-human'); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <span class="text-sm">🧑</span>
          Modelo Humano
        </button>

        <div class="h-px bg-neutral-800 my-1"></div>
        <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Escenas con Textura</div>
        <button
          v-for="(scene, key) in scenePresets"
          :key="key"
          @click="emit('load-scene-preset', key); closeAllMenus()"
          class="w-full px-3 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800 transition-colors flex items-center gap-2"
        >
          <span class="text-sm">{{ scene.icon }}</span>
          <div class="flex-1">
            <div>{{ scene.name }}</div>
            <div class="text-[10px] text-neutral-500">{{ scene.description }}</div>
          </div>
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

    <!-- Lighting Presets -->
    <div class="relative">
      <button
        @click="toggleMenu('lighting')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        Iluminacion
        <svg class="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div v-if="showLighting" class="absolute top-full left-0 mt-1 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50 py-1 min-w-[200px] max-h-[400px] overflow-y-auto">
        <div class="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500">Esquemas Cinematograficos</div>
        <button
          v-for="(preset, key) in lightingPresets"
          :key="key"
          @click="emit('lighting-change', key); closeAllMenus()"
          :class="['w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-800 transition-colors flex items-center gap-2', currentLighting === key ? 'text-yellow-400' : 'text-neutral-300']"
        >
          <span>{{ preset.icon }}</span>
          <div class="flex-1">
            <div>{{ preset.name }}</div>
            <div class="text-[10px] text-neutral-500">{{ preset.description }}</div>
          </div>
          <svg v-if="currentLighting === key" class="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
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
