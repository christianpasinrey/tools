<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThreePlayground } from '../composables/useThreePlayground'
import ThreeToolbar from '../components/three/ThreeToolbar.vue'

const playground = useThreePlayground()
const canvasContainer = ref(null)

// Computed
const hasObjects = computed(() => playground.objects.value.length > 0)

// Initialize on mount
onMounted(() => {
  if (canvasContainer.value) {
    playground.init(canvasContainer.value)
    // Load default scene
    playground.loadPreset('cube')
  }
})

// Cleanup
onUnmounted(() => {
  playground.destroy()
})
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-neutral-950 text-neutral-300 select-none">
    <!-- Toolbar -->
    <ThreeToolbar
      :theme-color="playground.themeColor.value"
      :has-objects="hasObjects"
      @add-shape="playground.addShape"
      @load-preset="playground.loadPreset"
      @clear="playground.clearScene"
      @reset-camera="playground.resetCamera"
      @toggle-wireframe="playground.toggleWireframe"
      @color-change="playground.setThemeColor"
    />

    <!-- Canvas Container -->
    <div class="flex-1 relative">
      <div
        ref="canvasContainer"
        class="absolute inset-0"
      ></div>

      <!-- Object Counter -->
      <div v-if="hasObjects" class="absolute bottom-4 left-4 px-3 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded text-xs text-neutral-400">
        {{ playground.objects.value.length }} objeto{{ playground.objects.value.length !== 1 ? 's' : '' }}
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
