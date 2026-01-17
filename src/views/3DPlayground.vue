<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThreePlayground } from '../composables/useThreePlayground'
import ThreeToolbar from '../components/three/ThreeToolbar.vue'

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

    <!-- Canvas Container -->
    <div class="flex-1 relative">
      <div
        ref="canvasContainer"
        class="absolute inset-0"
      ></div>

      <!-- Object Counter / Selection Info -->
      <div class="absolute bottom-4 left-4 flex flex-col gap-2">
        <div v-if="playground.selectedObject.value" class="px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs">
          <span class="text-neutral-500">Seleccionado:</span>
          <span class="text-white ml-1">{{ playground.selectedObject.value.userData?.type || 'Objeto' }}</span>
        </div>
        <div v-if="hasObjects" class="px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs text-neutral-400">
          {{ playground.objects.value.length }} objeto{{ playground.objects.value.length !== 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Controls Hint -->
      <div class="absolute bottom-4 right-4 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs text-neutral-500">
        <span class="text-neutral-400">LMB</span> Rotar &nbsp;
        <span class="text-neutral-400">RMB</span> Pan &nbsp;
        <span class="text-neutral-400">Scroll</span> Zoom
      </div>
    </div>
  </div>
</template>
