<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThreePlayground } from '../composables/three/useThreePlayground'
import ThreeToolbar from '../components/three/ThreeToolbar.vue'
import ThreePropertiesPanel from '../components/three/ThreePropertiesPanel.vue'
import ThreeObjectsList from '../components/three/ThreeObjectsList.vue'

const playground = useThreePlayground()
const canvasContainer = ref(null)
const fileInput = ref(null)

// Computed
const hasObjects = computed(() => playground.objects.value.length > 0)

// Keyboard shortcuts
const handleKeydown = (e) => {
  if (e.target.tagName === 'INPUT') return

  switch (e.key.toLowerCase()) {
    case 'delete':
      playground.deleteSelected()
      break
    case 'escape':
      playground.deselectObject()
      break
    case 'd':
      if (e.ctrlKey) {
        e.preventDefault()
        playground.duplicateSelected()
      }
      break
  }
}

// Handle file import
const triggerImport = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (e) => {
  await playground.handleFileImport(e)
  e.target.value = '' // Reset input
}

// Handle object selection from list
const handleSelectFromList = (obj) => {
  playground.selectObject(obj)
}

// Handle object deletion from list
const handleDeleteFromList = (obj) => {
  playground.deleteObject(obj)
}

// Initialize on mount
onMounted(() => {
  if (canvasContainer.value) {
    playground.init(canvasContainer.value)
    // Add a default cube
    playground.addShape('cube')
  }
  window.addEventListener('keydown', handleKeydown)
})

// Cleanup
onUnmounted(() => {
  playground.destroy()
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-neutral-950 text-neutral-300 select-none">
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept=".gltf,.glb,.obj"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Toolbar -->
    <ThreeToolbar
      :has-objects="hasObjects"
      :has-selection="!!playground.selectedObject.value"
      :bloom-enabled="playground.bloomEnabled.value"
      :current-environment="playground.currentEnvironment.value"
      :environment-presets="playground.ENVIRONMENT_PRESETS"
      :material-presets="playground.MATERIAL_PRESETS"
      :is-importing="playground.isImporting.value"
      @add-shape="playground.addShape"
      @add-spotlight="playground.addSpotlight"
      @add-pointlight="playground.addPointLight"
      @clear="playground.quickActions.clearScene"
      @reset-camera="playground.resetCamera"
      @delete-selected="playground.deleteSelected"
      @duplicate-selected="playground.duplicateSelected"
      @deselect="playground.deselectObject"
      @screenshot="playground.quickActions.screenshot"
      @export-gltf="playground.quickActions.exportGLTF"
      @export-glb="playground.quickActions.exportGLB"
      @import="triggerImport"
      @toggle-bloom="playground.setBloomEnabled(!playground.bloomEnabled.value)"
      @environment-change="playground.loadEnvironment"
      @material-change="playground.applyMaterialToSelected"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden min-h-0">
      <!-- Objects List (left sidebar) -->
      <ThreeObjectsList
        :objects="playground.objects.value"
        :selected-object="playground.selectedObject.value"
        @select="handleSelectFromList"
        @delete="handleDeleteFromList"
      />

      <!-- Canvas Container -->
      <div class="flex-1 relative">
        <div
          ref="canvasContainer"
          class="absolute inset-0"
        ></div>

        <!-- Loading overlay -->
        <div v-if="playground.isImporting.value" class="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div class="bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-center">
            <div class="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div class="text-sm text-white">Importando modelo...</div>
            <div class="text-xs text-neutral-400 mt-1">{{ playground.importProgress.value.toFixed(0) }}%</div>
          </div>
        </div>

        <!-- Environment loading -->
        <div v-if="playground.isLoadingEnvironment.value" class="absolute top-4 right-4 bg-neutral-900/90 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-300 z-10">
          Cargando entorno...
        </div>

        <!-- Keyboard Controls Visual -->
        <div v-if="playground.selectedObject.value" class="absolute top-4 left-4 p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg">
          <div class="text-[10px] text-neutral-500 mb-2 text-center">Mover objeto</div>

          <!-- WASD + QE Layout -->
          <div class="flex flex-col items-center gap-1">
            <div class="flex gap-1">
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.q ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                Q
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.w ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                W
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.e ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                E
              </div>
            </div>
            <div class="flex gap-1">
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.a ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                A
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.s ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                S
              </div>
              <div :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-mono border transition-all', playground.keysPressed.value.d ? 'bg-green-500 border-green-400 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400']">
                D
              </div>
            </div>
          </div>

          <div class="flex flex-col text-[9px] text-neutral-600 mt-2 gap-0.5">
            <div class="flex justify-center gap-3">
              <span>W↑ S↓</span>
              <span>A← D→</span>
            </div>
            <div class="text-center">Q/E profundidad</div>
          </div>
        </div>

        <!-- General Controls Hint (when no selection) -->
        <div v-else class="absolute bottom-4 right-4 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs text-neutral-500">
          <span class="text-neutral-400">Click</span> Seleccionar &nbsp;
          <span class="text-neutral-400">Scroll</span> Zoom
        </div>

        <!-- Bloom indicator -->
        <div v-if="playground.bloomEnabled.value" class="absolute bottom-4 right-4 px-2 py-1 bg-purple-900/50 border border-purple-700 rounded text-[10px] text-purple-300">
          Bloom activo
        </div>
      </div>

      <!-- Properties Panel (right sidebar) -->
      <div class="w-56 bg-neutral-900 border-l border-neutral-800 shrink-0 overflow-y-auto">
        <ThreePropertiesPanel
          v-if="playground.selectedObject.value"
          :selected-object="playground.selectedObject.value"
          :material-presets="playground.MATERIAL_PRESETS"
          :material-properties="playground.getSelectedMaterialProperties.value"
          @color-change="playground.setSelectedColor"
          @material-change="playground.applyMaterialToSelected"
          @material-property-change="(prop, val) => playground.updateSelectedMaterialProperty(prop, val)"
        />
        <div v-else class="p-4 text-xs text-neutral-500 text-center">
          Selecciona un objeto
        </div>
      </div>
    </div>
  </div>
</template>
