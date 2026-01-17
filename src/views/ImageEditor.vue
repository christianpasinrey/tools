<script setup>
import { ref, computed, watch } from 'vue'
import { useImageEditor } from '../composables/useImageEditor'
import ImageToolbar from '../components/image/ImageToolbar.vue'
import ImageCanvas from '../components/image/ImageCanvas.vue'
import ImageSidebar from '../components/image/ImageSidebar.vue'

const editor = useImageEditor()
const fileInput = ref(null)
const isDragging = ref(false)

// Computed
const showSidebar = computed(() => editor.hasFile.value && !editor.isLoading.value)
const adjustments = computed(() => ({
  brightness: editor.brightness.value,
  contrast: editor.contrast.value,
  saturation: editor.saturation.value,
  exposure: editor.exposure.value,
  highlights: editor.highlights.value,
  shadows: editor.shadows.value,
  temperature: editor.temperature.value,
  sharpness: editor.sharpness.value,
  blur: editor.blur.value
}))

// File handling
const openFilePicker = () => fileInput.value?.click()

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) loadFile(file)
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length > 0 && files[0].type.startsWith('image/')) {
    loadFile(files[0])
  }
}

const loadFile = async (file) => {
  await editor.loadFile(file)
}

// Canvas ready
const onCanvasReady = (canvas) => {
  editor.initCanvas(canvas)
  if (editor.originalImage.value) {
    editor.renderImage()
  }
}

// Watch for needing to re-render after canvas is ready
watch(() => editor.originalImage.value, (img) => {
  if (img && editor.canvas.value) {
    editor.renderImage()
  }
})

// Crop update
const onCropUpdate = (rect) => {
  editor.cropRect.value = rect
}

// Export modal
const showExportModal = ref(false)
const exportFormat = ref('png')
const exportQuality = ref(92)

const openExportModal = () => {
  showExportModal.value = true
}

const doExport = () => {
  editor.exportImage(exportFormat.value, exportQuality.value / 100)
  showExportModal.value = false
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-neutral-950 text-neutral-300 select-none">
    <!-- Processing Overlay -->
    <div v-if="editor.isProcessing.value" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="flex items-center gap-3 px-5 py-3 bg-neutral-900 border border-neutral-800 rounded">
        <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" :style="{ borderColor: editor.themeColor.value, borderTopColor: 'transparent' }"></div>
        <span class="text-sm">Procesando...</span>
      </div>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" @click.self="showExportModal = false">
      <div class="bg-neutral-900 border border-neutral-800 rounded-lg p-5 w-80">
        <h3 class="text-white font-medium mb-4">Exportar imagen</h3>

        <div class="space-y-4">
          <div>
            <label class="text-neutral-400 text-xs mb-2 block">Formato</label>
            <div class="flex gap-2">
              <button
                v-for="fmt in ['png', 'jpg', 'webp']"
                :key="fmt"
                @click="exportFormat = fmt"
                :class="['px-3 py-1.5 rounded text-xs font-medium transition-colors', exportFormat === fmt ? 'text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white']"
                :style="exportFormat === fmt ? { backgroundColor: editor.themeColor.value } : {}"
              >
                {{ fmt.toUpperCase() }}
              </button>
            </div>
          </div>

          <div v-if="exportFormat !== 'png'">
            <label class="text-neutral-400 text-xs mb-2 block">Calidad: {{ exportQuality }}%</label>
            <input
              type="range"
              min="10"
              max="100"
              v-model="exportQuality"
              class="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer"
              :style="{ accentColor: editor.themeColor.value }"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              @click="showExportModal = false"
              class="flex-1 px-3 py-2 rounded text-sm font-medium text-neutral-400 hover:bg-neutral-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="doExport"
              class="flex-1 px-3 py-2 rounded text-sm font-medium text-white transition-colors"
              :style="{ backgroundColor: editor.themeColor.value }"
            >
              Descargar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <ImageToolbar
      :has-file="editor.hasFile.value"
      :can-undo="editor.canUndo.value"
      :can-redo="editor.canRedo.value"
      :zoom="editor.zoom.value"
      :theme-color="editor.themeColor.value"
      :is-cropping="editor.isCropping.value"
      @open="openFilePicker"
      @export="openExportModal"
      @undo="editor.undo"
      @redo="editor.redo"
      @rotate-left="editor.rotate(-90)"
      @rotate-right="editor.rotate(90)"
      @flip-h="editor.flipHorizontal"
      @flip-v="editor.flipVertical"
      @crop="editor.startCrop"
      @apply-crop="editor.applyCrop"
      @cancel-crop="editor.cancelCrop"
      @filter="(f) => editor.applyFilter(f)"
      @apply-adjustments="editor.applyAdjustments"
      @reset="editor.resetAdjustments(); editor.renderImage()"
      @zoom="(v) => editor.setZoom(v)"
      @color-change="editor.setThemeColor"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Canvas Area -->
      <ImageCanvas
        :has-file="editor.hasFile.value"
        :is-loading="editor.isLoading.value"
        :is-dragging="isDragging"
        :zoom="editor.zoom.value"
        :theme-color="editor.themeColor.value"
        :is-cropping="editor.isCropping.value"
        :crop-rect="editor.cropRect.value"
        @canvas-ready="onCanvasReady"
        @drop="handleDrop"
        @dragover="isDragging = true"
        @dragleave="isDragging = false"
        @click="openFilePicker"
        @crop-update="onCropUpdate"
      />

      <!-- Sidebar -->
      <ImageSidebar
        v-if="showSidebar"
        :file-name="editor.imageFileName.value"
        :file-info="editor.fileInfo.value"
        :history-index="editor.historyIndex.value"
        :history-length="editor.history.value.length"
        :theme-color="editor.themeColor.value"
        :adjustments="adjustments"
        @close="editor.clearFile"
        @export="openExportModal"
        @adjustment="(name, value) => editor.setAdjustment(name, value)"
      />
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>
