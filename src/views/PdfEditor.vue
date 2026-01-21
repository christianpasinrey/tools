<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { usePdfEditor } from '../composables/usePdfEditor'
import * as pdfjsLib from 'pdfjs-dist'
import PdfToolbar from '../components/pdf/PdfToolbar.vue'
import PdfSidebar from '../components/pdf/PdfSidebar.vue'
import PdfToast from '../components/pdf/PdfToast.vue'
import PdfConfirmDialog from '../components/pdf/PdfConfirmDialog.vue'
import PdfProgressBar from '../components/pdf/PdfProgressBar.vue'
import PdfAnnotationPanel from '../components/pdf/PdfAnnotationPanel.vue'

const editor = usePdfEditor()
const previewCanvas = ref(null)
const isRenderingPreview = ref(false)
const fileInput = ref(null)
const addFileInput = ref(null)
const isDragging = ref(false)
const previewIndex = ref(0)
const previewZoom = ref(0.4)

// Drag reorder state
const draggedIndex = ref(null)
const dragOverIndex = ref(null)

// Confirm dialog state
const confirmDialog = ref({
  visible: false,
  title: '',
  message: '',
  type: 'warning',
  onConfirm: null
})

// Computed
const showSidebar = computed(() => editor.hasFile.value && !editor.isLoading.value)
const selectedCount = computed(() => editor.selectedPages.value.size)
const selectedPageIndex = computed(() => {
  if (editor.selectedPages.value.size === 1) {
    const selectedId = Array.from(editor.selectedPages.value)[0]
    return editor.pages.value.findIndex(p => p.id === selectedId)
  }
  return null
})
const currentPreviewPage = computed(() => editor.pages.value[previewIndex.value] || null)
const currentPageAnnotations = computed(() =>
  editor.annotations.value.filter(a => a.pageIndex === previewIndex.value)
)

// Auto-select first page when PDF loads
watch(() => editor.pages.value.length, (len) => {
  if (len > 0 && previewIndex.value >= len) {
    previewIndex.value = 0
  }
})

// File handling
const openFilePicker = () => fileInput.value?.click()
const openAddFilePicker = () => addFileInput.value?.click()

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file && file.type === 'application/pdf') {
    editor.loadFile(file)
  }
  e.target.value = ''
}

const handleAddFiles = (e) => {
  const files = Array.from(e.target.files).filter(f => f.type === 'application/pdf')
  if (files.length > 0) {
    editor.addFiles(files)
  }
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type === 'application/pdf')
  if (files.length > 0) {
    if (editor.hasFile.value) {
      editor.addFiles(files)
    } else {
      editor.loadFile(files[0])
      if (files.length > 1) {
        editor.addFiles(files.slice(1))
      }
    }
  }
}

// Confirm dialog helpers
const showConfirm = (title, message, type, onConfirm) => {
  confirmDialog.value = {
    visible: true,
    title,
    message,
    type,
    onConfirm
  }
}

const closeConfirm = () => {
  confirmDialog.value.visible = false
  confirmDialog.value.onConfirm = null
}

const handleConfirm = () => {
  if (confirmDialog.value.onConfirm) {
    confirmDialog.value.onConfirm()
  }
  closeConfirm()
}

// Actions with confirmation
const handleDelete = () => {
  const count = editor.selectedPages.value.size
  if (count === 0) return

  showConfirm(
    'Eliminar páginas',
    `¿Eliminar ${count} página${count > 1 ? 's' : ''} seleccionada${count > 1 ? 's' : ''}? Esta acción se puede deshacer.`,
    'danger',
    () => editor.deleteSelected()
  )
}

const handleClearFile = () => {
  showConfirm(
    'Cerrar documento',
    '¿Cerrar el documento actual? Se perderán los cambios no guardados.',
    'warning',
    () => {
      editor.clearFile()
      editor.clearHistory()
    }
  )
}

const handleSplitAll = () => {
  showConfirm(
    'Dividir PDF',
    `Se descargarán ${editor.pageCount.value} archivos PDF individuales. ¿Continuar?`,
    'info',
    () => editor.splitAll()
  )
}

// Preview navigation
const selectPreview = (index) => {
  previewIndex.value = index
}

// Zoom controls
const zoomIn = () => {
  previewZoom.value = Math.round((previewZoom.value + 0.1) * 100) / 100
}

const zoomOut = () => {
  const newZoom = Math.round((previewZoom.value - 0.1) * 100) / 100
  previewZoom.value = Math.max(0.01, newZoom)
}

const resetZoom = () => {
  previewZoom.value = 0.4
}

// Render preview at high resolution
const renderPreview = async () => {
  if (!editor.pdfBytes.value || !previewCanvas.value || previewIndex.value === null) return

  isRenderingPreview.value = true

  try {
    const pdfJsDoc = await pdfjsLib.getDocument({ data: editor.pdfBytes.value.slice() }).promise
    const page = await pdfJsDoc.getPage(previewIndex.value + 1)

    // High resolution render (base scale 2 * zoom)
    const scale = 2 * previewZoom.value
    const viewport = page.getViewport({ scale })

    const canvas = previewCanvas.value
    canvas.width = viewport.width
    canvas.height = viewport.height

    // Apply rotation from our page data
    const currentPage = editor.pages.value[previewIndex.value]
    if (currentPage?.rotation) {
      const rotation = currentPage.rotation
      const rotatedViewport = page.getViewport({ scale, rotation })
      canvas.width = rotatedViewport.width
      canvas.height = rotatedViewport.height

      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport: rotatedViewport }).promise
    } else {
      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise
    }

    pdfJsDoc.destroy()
  } catch (error) {
    console.error('Error rendering preview:', error)
  } finally {
    isRenderingPreview.value = false
  }
}

// Re-render when page or zoom changes
watch([previewIndex, previewZoom, () => editor.pages.value], async () => {
  if (editor.hasFile.value) {
    await nextTick()
    renderPreview()
  }
}, { immediate: true })

// Drag and drop reordering
const onDragStart = (e, index) => {
  draggedIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
}

const onDragOver = (e, index) => {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const onDragLeave = () => {
  dragOverIndex.value = null
}

const onDrop = async (e, index) => {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    await editor.reorderPages(draggedIndex.value, index)
    previewIndex.value = index
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

const onDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Annotation dragging
const draggingAnnotation = ref(null)
const annotationOffset = ref({ x: 0, y: 0 })

const startDragAnnotation = (e, annotation) => {
  draggingAnnotation.value = annotation.id
  const rect = e.target.getBoundingClientRect()
  annotationOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  document.addEventListener('mousemove', dragAnnotation)
  document.addEventListener('mouseup', stopDragAnnotation)
}

const dragAnnotation = (e) => {
  if (!draggingAnnotation.value || !previewCanvas.value) return

  const canvas = previewCanvas.value
  const rect = canvas.getBoundingClientRect()

  // Calculate new position as percentage
  const x = ((e.clientX - rect.left - annotationOffset.value.x) / rect.width) * 100
  const y = ((e.clientY - rect.top - annotationOffset.value.y) / rect.height) * 100

  // Update annotation position
  const ann = editor.annotations.value.find(a => a.id === draggingAnnotation.value)
  if (ann) {
    ann.x = Math.max(0, Math.min(100, x))
    ann.y = Math.max(0, Math.min(100, y))
  }
}

const stopDragAnnotation = () => {
  draggingAnnotation.value = null
  document.removeEventListener('mousemove', dragAnnotation)
  document.removeEventListener('mouseup', stopDragAnnotation)
}
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-950 text-neutral-300 select-none">
    <!-- Processing Overlay -->
    <div v-if="editor.isProcessing.value" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="flex items-center gap-3 px-5 py-3 bg-neutral-900 border border-neutral-800 rounded">
        <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" :style="{ borderColor: editor.themeColor.value, borderTopColor: 'transparent' }"></div>
        <span class="text-sm">Procesando...</span>
      </div>
    </div>

    <!-- Loading Progress Overlay -->
    <div v-if="editor.isLoading.value" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="w-80 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
        <PdfProgressBar
          :progress="editor.loadingProgress.value"
          :message="editor.loadingMessage.value"
          :theme-color="editor.themeColor.value"
        />
      </div>
    </div>

    <!-- Toast Notifications -->
    <PdfToast
      :toasts="editor.toasts.value"
      :theme-color="editor.themeColor.value"
      @dismiss="editor.dismissToast"
    />

    <!-- Confirm Dialog -->
    <PdfConfirmDialog
      :visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :type="confirmDialog.type"
      :theme-color="editor.themeColor.value"
      @confirm="handleConfirm"
      @cancel="closeConfirm"
    />


    <!-- Toolbar -->
    <PdfToolbar
      :has-file="editor.hasFile.value"
      :has-selection="editor.hasSelection.value"
      :all-selected="editor.allSelected.value"
      :selected-count="selectedCount"
      :page-count="editor.pageCount.value"
      :theme-color="editor.themeColor.value"
      :can-undo="editor.canUndo.value"
      :can-redo="editor.canRedo.value"
      :undo-action-name="editor.undoActionName.value"
      :redo-action-name="editor.redoActionName.value"
      :show-annotations="editor.showAnnotationPanel.value"
      :annotation-count="editor.annotations.value.length"
      @open="openFilePicker"
      @add-files="openAddFilePicker"
      @export="editor.exportPdf"
      @select-all="editor.selectAll"
      @deselect-all="editor.deselectAll"
      @rotate-left="editor.rotateSelected(-90)"
      @rotate-right="editor.rotateSelected(90)"
      @delete="handleDelete"
      @extract="editor.extractSelected"
      @split-all="handleSplitAll"
      @color-change="editor.setThemeColor"
      @undo="editor.undo"
      @redo="editor.redo"
      @toggle-annotations="editor.toggleAnnotationPanel"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Empty State -->
      <div
        v-if="!editor.hasFile.value && !editor.isLoading.value"
        @click="openFilePicker"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
        :class="['flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors border-2 border-dashed m-4 rounded-lg', isDragging ? 'border-green-500/50 bg-green-500/5' : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50']"
      >
        <div class="w-16 h-16 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4">
          <svg class="w-7 h-7 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <p class="text-neutral-400 text-sm mb-1">Arrastra un PDF aquí</p>
        <p class="text-neutral-600 text-xs">o haz clic para buscar</p>
      </div>

      <!-- PDF Loaded: Pages Sidebar + Preview -->
      <template v-if="editor.hasFile.value && !editor.isLoading.value">
        <!-- Pages Sidebar (Left) -->
        <div class="w-48 bg-neutral-900 border-r border-neutral-800 flex flex-col">
          <div class="p-2 border-b border-neutral-800">
            <span class="text-xs text-neutral-500">{{ editor.pageCount.value }} {{ editor.pageCount.value === 1 ? 'página' : 'páginas' }}</span>
          </div>
          <div class="flex-1 overflow-y-auto p-2 space-y-2">
            <div
              v-for="(page, index) in editor.pages.value"
              :key="page.id"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragover="onDragOver($event, index)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, index)"
              @dragend="onDragEnd"
              @click="selectPreview(index)"
              :class="[
                'relative cursor-pointer rounded overflow-hidden transition-all group',
                previewIndex === index ? 'ring-2 ring-offset-2 ring-offset-neutral-900' : 'hover:ring-1 hover:ring-neutral-600',
                dragOverIndex === index ? 'ring-2 ring-dashed' : '',
                draggedIndex === index ? 'opacity-50' : ''
              ]"
              :style="previewIndex === index ? { ringColor: editor.themeColor.value } : {}"
            >
              <!-- Thumbnail -->
              <div class="bg-white aspect-[3/4] flex items-center justify-center overflow-hidden">
                <img
                  :src="page.thumbnail"
                  :alt="`Página ${index + 1}`"
                  class="max-w-full max-h-full object-contain"
                  :style="{ transform: `rotate(${page.rotation}deg)` }"
                />
              </div>
              <!-- Page Number -->
              <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
                <span class="text-white text-xs font-medium">{{ index + 1 }}</span>
              </div>
              <!-- Selection Checkbox -->
              <div
                @click.stop="editor.togglePageSelection(page.id)"
                :class="[
                  'absolute top-1 left-1 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer',
                  editor.selectedPages.value.has(page.id) ? 'border-transparent' : 'border-white/50 bg-black/30 hover:border-white'
                ]"
                :style="editor.selectedPages.value.has(page.id) ? { backgroundColor: editor.themeColor.value } : {}"
              >
                <svg v-if="editor.selectedPages.value.has(page.id)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <!-- Rotation indicator -->
              <div v-if="page.rotation !== 0" class="absolute top-1 right-1 px-1 py-0.5 bg-black/60 rounded text-[9px] text-white">
                {{ page.rotation }}°
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Panel (Center) -->
        <div
          class="flex-1 flex flex-col bg-neutral-950 overflow-hidden"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <!-- Zoom Controls Bar -->
          <div class="flex items-center justify-center gap-2 py-2 border-b border-neutral-800 bg-neutral-900/50">
            <button
              @click="zoomOut"
              :disabled="previewZoom <= 0.01"
              class="p-1.5 rounded hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Reducir zoom (-10%)"
            >
              <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            <button
              @click="resetZoom"
              class="px-3 py-1 rounded text-xs font-mono text-neutral-300 hover:bg-neutral-800 transition-colors min-w-[60px]"
              title="Restablecer zoom (40%)"
            >
              {{ Math.round(previewZoom * 100) }}%
            </button>
            <button
              @click="zoomIn"
              class="p-1.5 rounded hover:bg-neutral-800 transition-colors"
              title="Aumentar zoom (+10%)"
            >
              <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span class="text-xs text-neutral-600 ml-4">
              Página {{ previewIndex + 1 }} / {{ editor.pageCount.value }}
            </span>
          </div>

          <!-- Preview Area -->
          <div class="flex-1 overflow-auto p-4">
            <div class="min-h-full flex items-center justify-center">
              <div class="relative">
                <canvas
                  ref="previewCanvas"
                  class="shadow-2xl bg-white"
                  :style="{ opacity: isRenderingPreview ? 0.5 : 1 }"
                />
                <!-- Annotations Overlay -->
                <div class="absolute inset-0 pointer-events-none">
                  <div
                    v-for="ann in currentPageAnnotations"
                    :key="ann.id"
                    @mousedown.stop="startDragAnnotation($event, ann)"
                    class="absolute pointer-events-auto cursor-move select-none px-1 rounded hover:ring-2 hover:ring-offset-1"
                    :class="draggingAnnotation === ann.id ? 'ring-2 ring-blue-500' : 'hover:ring-blue-400'"
                    :style="{
                      left: ann.x + '%',
                      top: ann.y + '%',
                      color: ann.color,
                      fontSize: ann.size * previewZoom * 2 + 'px',
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      backgroundColor: ann.hasBg ? ann.bgColor : 'transparent',
                      padding: ann.hasBg ? '1px 3px' : '0 2px',
                      textShadow: ann.hasBg ? 'none' : '0 0 2px white, 0 0 2px white'
                    }"
                  >
                    {{ ann.content }}
                  </div>
                </div>
                <div v-if="isRenderingPreview" class="absolute inset-0 flex items-center justify-center">
                  <div
                    class="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                    :style="{ borderColor: editor.themeColor.value, borderTopColor: 'transparent' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Sidebar (Right) -->
        <PdfSidebar
          :file-name="editor.fileName.value"
          :page-count="editor.pageCount.value"
          :selected-count="selectedCount"
          :theme-color="editor.themeColor.value"
          @close="handleClearFile"
          @export="editor.exportPdf"
          @add-files="openAddFilePicker"
        />
      </template>

      <!-- Annotation Panel -->
      <PdfAnnotationPanel
        :visible="editor.showAnnotationPanel.value"
        :annotations="editor.annotations.value"
        :selected-page-index="previewIndex"
        :theme-color="editor.themeColor.value"
        @close="editor.toggleAnnotationPanel"
        @add="editor.addAnnotation"
        @remove="editor.removeAnnotation"
        @update="editor.updateAnnotation"
        @clear="editor.clearAnnotations"
      />
    </div>

    <!-- Hidden File Inputs -->
    <input
      ref="fileInput"
      type="file"
      accept="application/pdf"
      class="hidden"
      @change="handleFileSelect"
    />
    <input
      ref="addFileInput"
      type="file"
      accept="application/pdf"
      multiple
      class="hidden"
      @change="handleAddFiles"
    />
  </div>
</template>
