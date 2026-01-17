<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThreePlayground } from '../composables/useThreePlayground'
import ThreeToolbar from '../components/three/ThreeToolbar.vue'
import ThreePropertiesPanel from '../components/three/ThreePropertiesPanel.vue'

const playground = useThreePlayground()
const canvasContainer = ref(null)

// Computed
const hasObjects = computed(() => playground.objects.value.length > 0)

// Keyboard shortcuts
const handleKeydown = (e) => {
  if (e.target.tagName === 'INPUT') return

  switch (e.key.toLowerCase()) {
    case 'g':
      playground.setTransformMode('translate')
      break
    case 'r':
      playground.setTransformMode('rotate')
      break
    case 's':
      playground.setTransformMode('scale')
      break
    case 'delete':
      playground.deleteSelected()
      break
    case 'escape':
      playground.deselectObject()
      break
  }
}

// Initialize on mount
onMounted(() => {
  if (canvasContainer.value) {
    playground.init(canvasContainer.value)
    // Load default scene
    playground.loadPreset('cube')
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
    <!-- Toolbar -->
    <ThreeToolbar
      :theme-color="playground.themeColor.value"
      :has-objects="hasObjects"
      :has-selection="!!playground.selectedObject.value"
      :transform-mode="playground.transformMode.value"
      @add-shape="playground.addShape"
      @load-preset="playground.loadPreset"
      @clear="playground.clearScene"
      @reset-camera="playground.resetCamera"
      @toggle-wireframe="playground.toggleWireframe"
      @color-change="playground.setThemeColor"
      @transform-mode="playground.setTransformMode"
      @delete-selected="playground.deleteSelected"
      @deselect="playground.deselectObject"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Canvas Container -->
      <div class="flex-1 relative">
        <div
          ref="canvasContainer"
          class="absolute inset-0"
        ></div>

      <!-- Object Counter / Selection Info -->
      <div class="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
        <div v-if="playground.selectedObject.value" class="px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs flex items-center gap-2">
          <!-- Light icon if it's a light -->
          <svg v-if="playground.selectedObject.value.userData?.light" class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7zm2 15h-4v-1h4v1zm0-3h-4v-1h4v1zM9 21a1 1 0 001 1h4a1 1 0 001-1v-1H9v1z"/>
          </svg>
          <span class="text-neutral-500">Seleccionado:</span>
          <span class="text-white">{{ playground.selectedObject.value.userData?.type || 'Objeto' }}</span>
        </div>
        <div v-if="hasObjects" class="px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs text-neutral-400">
          {{ playground.objects.value.length }} objeto{{ playground.objects.value.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Keyboard Controls Visual -->
      <div v-if="playground.selectedObject.value" class="absolute top-4 left-4 p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg">
        <div class="text-[10px] text-neutral-500 mb-2 text-center">Mover objeto</div>

        <!-- WASD + QE Layout -->
        <div class="flex flex-col items-center gap-1">
          <!-- Top row: Q W E -->
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
          <!-- Bottom row: A S D -->
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

        <!-- Labels -->
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
      </div>

      <!-- Properties Panel (right sidebar) -->
      <div class="w-56 bg-neutral-900 border-l border-neutral-800 shrink-0">
        <ThreePropertiesPanel
          v-if="playground.selectedObject.value"
          :selected-object="playground.selectedObject.value"
          :theme-color="playground.themeColor.value"
        />
        <div v-else class="p-4 text-xs text-neutral-500 text-center">
          Selecciona un objeto
        </div>
      </div>
    </div>
  </div>
</template>
