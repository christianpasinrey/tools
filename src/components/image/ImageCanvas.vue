<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  hasFile: Boolean,
  isLoading: Boolean,
  isDragging: Boolean,
  zoom: Number,
  themeColor: String,
  isCropping: Boolean,
  cropRect: Object
})

const emit = defineEmits(['drop', 'dragover', 'dragleave', 'click', 'canvas-ready', 'crop-update'])

const canvasRef = ref(null)
const containerRef = ref(null)

// Crop dragging state
const cropDragging = ref(null) // 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'
const cropStart = ref({ x: 0, y: 0 })
const cropRectStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// Watch for canvas to appear when hasFile becomes true
watch(
  () => props.hasFile,
  async (hasFile) => {
    if (hasFile) {
      await nextTick()
      if (canvasRef.value) {
        emit('canvas-ready', canvasRef.value)
      }
    }
  },
  { immediate: true }
)

// Crop handlers
const getMousePos = (e) => {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return {
    x: (e.clientX - rect.left) / props.zoom,
    y: (e.clientY - rect.top) / props.zoom
  }
}

const startCropDrag = (e, handle) => {
  e.preventDefault()
  cropDragging.value = handle
  cropStart.value = getMousePos(e)
  cropRectStart.value = { ...props.cropRect }
  window.addEventListener('mousemove', onCropDrag)
  window.addEventListener('mouseup', stopCropDrag)
}

const onCropDrag = (e) => {
  if (!cropDragging.value) return

  const pos = getMousePos(e)
  const dx = pos.x - cropStart.value.x
  const dy = pos.y - cropStart.value.y
  const r = cropRectStart.value

  let newRect = { ...r }

  switch (cropDragging.value) {
    case 'move':
      newRect.x = r.x + dx
      newRect.y = r.y + dy
      break
    case 'nw':
      newRect.x = r.x + dx
      newRect.y = r.y + dy
      newRect.width = r.width - dx
      newRect.height = r.height - dy
      break
    case 'ne':
      newRect.y = r.y + dy
      newRect.width = r.width + dx
      newRect.height = r.height - dy
      break
    case 'sw':
      newRect.x = r.x + dx
      newRect.width = r.width - dx
      newRect.height = r.height + dy
      break
    case 'se':
      newRect.width = r.width + dx
      newRect.height = r.height + dy
      break
    case 'n':
      newRect.y = r.y + dy
      newRect.height = r.height - dy
      break
    case 's':
      newRect.height = r.height + dy
      break
    case 'e':
      newRect.width = r.width + dx
      break
    case 'w':
      newRect.x = r.x + dx
      newRect.width = r.width - dx
      break
  }

  // Ensure minimum size
  if (newRect.width < 20) newRect.width = 20
  if (newRect.height < 20) newRect.height = 20

  emit('crop-update', newRect)
}

const stopCropDrag = () => {
  cropDragging.value = null
  window.removeEventListener('mousemove', onCropDrag)
  window.removeEventListener('mouseup', stopCropDrag)
}
</script>

<template>
  <div
    ref="containerRef"
    class="flex-1 relative bg-neutral-900/50 border-y border-neutral-800 overflow-auto"
    @dragover.prevent="emit('dragover')"
    @dragleave="emit('dragleave')"
    @drop.prevent="emit('drop', $event)"
  >
    <!-- Empty State -->
    <div
      v-if="!hasFile"
      @click="emit('click')"
      :class="['absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors', isDragging ? 'bg-green-500/5' : 'hover:bg-neutral-900/50']"
    >
      <div class="w-16 h-16 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <p class="text-neutral-400 text-sm mb-1">Drop image file here</p>
      <p class="text-neutral-600 text-xs">JPG, PNG, GIF, WebP, BMP</p>
    </div>

    <!-- Canvas Container -->
    <div v-else class="absolute inset-0 flex items-center justify-center p-4">
      <!-- Checkered background -->
      <div
        class="relative shadow-2xl"
        :style="{
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
          backgroundImage: 'linear-gradient(45deg, #262626 25%, transparent 25%), linear-gradient(-45deg, #262626 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #262626 75%), linear-gradient(-45deg, transparent 75%, #262626 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: '#171717'
        }"
      >
        <canvas ref="canvasRef" class="block"></canvas>

        <!-- Crop Overlay -->
        <div v-if="isCropping" class="absolute inset-0">
          <!-- Dark overlay outside crop -->
          <div class="absolute inset-0 bg-black/60"></div>

          <!-- Crop selection -->
          <div
            class="absolute border-2 bg-transparent cursor-move"
            :style="{
              left: cropRect.x + 'px',
              top: cropRect.y + 'px',
              width: cropRect.width + 'px',
              height: cropRect.height + 'px',
              borderColor: themeColor,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
            }"
            @mousedown="startCropDrag($event, 'move')"
          >
            <!-- Grid lines -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute left-1/3 top-0 bottom-0 w-px bg-white/30"></div>
              <div class="absolute left-2/3 top-0 bottom-0 w-px bg-white/30"></div>
              <div class="absolute top-1/3 left-0 right-0 h-px bg-white/30"></div>
              <div class="absolute top-2/3 left-0 right-0 h-px bg-white/30"></div>
            </div>

            <!-- Resize handles -->
            <div
              class="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white border-2 cursor-nw-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 'nw')"
            ></div>
            <div
              class="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white border-2 cursor-ne-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 'ne')"
            ></div>
            <div
              class="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 cursor-sw-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 'sw')"
            ></div>
            <div
              class="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border-2 cursor-se-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 'se')"
            ></div>
            <!-- Edge handles -->
            <div
              class="absolute left-1/2 -translate-x-1/2 -top-1.5 w-6 h-3 bg-white border-2 cursor-n-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 'n')"
            ></div>
            <div
              class="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-6 h-3 bg-white border-2 cursor-s-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 's')"
            ></div>
            <div
              class="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-6 bg-white border-2 cursor-w-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 'w')"
            ></div>
            <div
              class="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-6 bg-white border-2 cursor-e-resize"
              :style="{ borderColor: themeColor }"
              @mousedown.stop="startCropDrag($event, 'e')"
            ></div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="absolute inset-0 bg-neutral-950/80 flex items-center justify-center z-20">
        <div class="flex items-center gap-3">
          <div class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" :style="{ borderColor: themeColor }"></div>
          <span class="text-neutral-400 text-sm">Cargando imagen...</span>
        </div>
      </div>
    </div>
  </div>
</template>
