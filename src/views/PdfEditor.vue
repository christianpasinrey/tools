<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { usePdfEditor } from '../composables/usePdfEditor'
import * as pdfjsLib from 'pdfjs-dist'
import PdfToolbar from '../components/pdf/PdfToolbar.vue'
import VaultSaveLoad from '../components/common/VaultSaveLoad.vue'
import PdfSidebar from '../components/pdf/PdfSidebar.vue'
import PdfThumbnail from '../components/pdf/PdfThumbnail.vue'
import PdfAnnotationPanel from '../components/pdf/PdfAnnotationPanel.vue'
import TbEmptyState from '../components/ui/TbEmptyState.vue'
import TbProgress from '../components/ui/TbProgress.vue'
import TbIconButton from '../components/ui/TbIconButton.vue'
import { toast } from '../composables/useToast'
import { usePendingLaunch } from '../composables/usePendingLaunch'
import { requestDeletePages, requestClose, requestSplitAll, requestClearAnnotations } from './pdfActions'

const editor = usePdfEditor()

// Archivo entregado desde la Home ("suelta un archivo")
usePendingLaunch('pdf', ({ file }) => { if (file) editor.loadFile(file) })
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

// Vault save/load
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB limit

const getPdfData = () => {
  if (!editor.pdfBytes.value) return null
  if (editor.pdfBytes.value.byteLength > MAX_PDF_SIZE) {
    toast('El PDF es demasiado grande para guardarlo en la bóveda (máx. 10 MB)', { tone: 'error' })
    return null
  }
  return {
    pdfBytes: Array.from(new Uint8Array(editor.pdfBytes.value)),
    pages: editor.pages.value.map(p => ({ id: p.id, pageIndex: p.pageIndex, rotation: p.rotation })),
    annotations: JSON.parse(JSON.stringify(editor.annotations.value)),
    fileName: editor.fileName.value
  }
}

const loadPdfData = async (data) => {
  if (!data.pdfBytes) return
  const bytes = new Uint8Array(data.pdfBytes)
  const file = new File([bytes], data.fileName || 'documento.pdf', { type: 'application/pdf' })
  await editor.loadFile(file)
  if (data.annotations) editor.annotations.value = data.annotations
}

// File handling
const openFilePicker = () => fileInput.value?.click()
const openAddFilePicker = () => addFileInput.value?.click()

const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)

// Carga o combina: sin documento abre el primero y añade el resto
const takeFiles = (list) => {
  const all = Array.from(list || [])
  const files = all.filter(isPdf)
  if (all.length && !files.length) {
    toast('El editor solo acepta archivos PDF', { tone: 'error' })
    return
  }
  if (!files.length) return
  if (editor.hasFile.value) {
    editor.addFiles(files)
  } else {
    editor.loadFile(files[0])
    if (files.length > 1) editor.addFiles(files.slice(1))
  }
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (isPdf(file)) editor.loadFile(file)
    else toast('El editor solo acepta archivos PDF', { tone: 'error' })
  }
  e.target.value = ''
}

const handleAddFiles = (e) => {
  takeFiles(e.target.files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  takeFiles(e.dataTransfer?.files)
}

// Acciones con confirmación (diálogo global)
const handleDelete = () => requestDeletePages(editor)
const handleClearFile = () => requestClose(editor)
const handleSplitAll = () => requestSplitAll(editor)
const handleClearAnnotations = () => requestClearAnnotations(editor)

// Preview navigation
const selectPreview = (index) => {
  previewIndex.value = index
}

// Zoom controls
const zoomIn = () => {
  previewZoom.value = Math.min(3, Math.round((previewZoom.value + 0.1) * 100) / 100)
}

const zoomOut = () => {
  const newZoom = Math.round((previewZoom.value - 0.1) * 100) / 100
  previewZoom.value = Math.max(0.1, newZoom)
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
  <div class="h-full flex flex-col bg-tb-bg text-tb-ink select-none" style="--cat: var(--cat-documents)">
    <!-- Carga y procesado -->
    <div v-if="editor.isLoading.value || editor.isProcessing.value" class="fixed inset-0 z-50 grid place-items-center p-4 bg-tb-bg/70 backdrop-blur-sm">
      <div class="w-full max-w-sm p-6 rounded-2xl border border-tb-line bg-tb-surface shadow-xl">
        <TbProgress
          :value="editor.isLoading.value ? editor.loadingProgress.value : null"
          :label="editor.isLoading.value ? (editor.loadingMessage.value || 'Cargando PDF…') : 'Procesando…'"
        />
      </div>
    </div>

    <!-- Barra -->
    <header class="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-tb-line bg-tb-surface">
      <PdfToolbar
        :has-file="editor.hasFile.value"
        :has-selection="editor.hasSelection.value"
        :all-selected="editor.allSelected.value"
        :selected-count="selectedCount"
        :page-count="editor.pageCount.value"
        :can-undo="editor.canUndo.value"
        :can-redo="editor.canRedo.value"
        :undo-action-name="editor.undoActionName.value"
        :redo-action-name="editor.redoActionName.value"
        :show-annotations="editor.showAnnotationPanel.value"
        :annotation-count="editor.annotations.value.length"
        :zoom="previewZoom"
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
        @undo="editor.undo"
        @redo="editor.redo"
        @toggle-annotations="editor.toggleAnnotationPanel"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @zoom-reset="resetZoom"
      />
      <div v-if="editor.hasFile.value" class="shrink-0">
        <VaultSaveLoad storeName="pdf-documents" :getData="getPdfData" label="documento" @load="loadPdfData" />
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden relative">
      <!-- Vacío -->
      <div v-if="!editor.hasFile.value && !editor.isLoading.value" class="flex-1 overflow-auto p-4 sm:p-8">
        <TbEmptyState
          class="max-w-2xl mx-auto"
          icon="file"
          title="Suelta un PDF aquí"
          accept="application/pdf,.pdf"
          multiple
          :chips="['Combinar', 'Dividir', 'Rotar', 'Extraer', 'Anotar']"
          formats="Todo se procesa en tu navegador: el PDF no sale de tu equipo"
          @files="takeFiles"
        />
      </div>

      <template v-if="editor.hasFile.value && !editor.isLoading.value">
        <!-- Miniaturas -->
        <nav class="w-44 shrink-0 flex flex-col border-r border-tb-line bg-tb-surface" aria-label="Páginas">
          <p class="px-3 pt-3 pb-2 font-code text-[11px] uppercase tracking-[.12em] text-tb-muted">
            {{ editor.pageCount.value }} {{ editor.pageCount.value === 1 ? 'página' : 'páginas' }}
          </p>
          <ol class="flex-1 overflow-y-auto px-3 pt-1 pb-3 space-y-3">
            <li
              v-for="(page, index) in editor.pages.value"
              :key="page.id"
              draggable="true"
              @dragstart="onDragStart($event, index)"
              @dragover="onDragOver($event, index)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, index)"
              @dragend="onDragEnd"
            >
              <PdfThumbnail
                :page="page"
                :index="index"
                :active="previewIndex === index"
                :checked="editor.selectedPages.value.has(page.id)"
                :drag-over="dragOverIndex === index"
                :dragging="draggedIndex === index"
                @select="selectPreview(index)"
                @toggle="editor.togglePageSelection(page.id)"
              />
            </li>
          </ol>
        </nav>

        <!-- Vista -->
        <section
          class="flex-1 flex flex-col overflow-hidden"
          :class="isDragging && 'bg-[color-mix(in_srgb,var(--cat)_6%,var(--tb-bg))]'"
          aria-label="Vista previa"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="flex items-center justify-center gap-1 py-1.5 border-b border-tb-line text-xs text-tb-muted">
            <TbIconButton size="sm" icon="chevron-up" label="Página anterior" :disabled="previewIndex === 0" @click="selectPreview(previewIndex - 1)" />
            <span class="font-code min-w-16 text-center">{{ previewIndex + 1 }} / {{ editor.pageCount.value }}</span>
            <TbIconButton size="sm" icon="chevron-down" label="Página siguiente" :disabled="previewIndex >= editor.pageCount.value - 1" @click="selectPreview(previewIndex + 1)" />
          </div>

          <div class="flex-1 overflow-auto p-6">
            <div class="min-h-full flex items-center justify-center">
              <div class="relative">
                <canvas
                  ref="previewCanvas"
                  class="bg-white rounded-sm shadow-[0_1px_2px_rgb(0_0_0/.08),0_18px_40px_-16px_rgb(0_0_0/.35)]"
                  :style="{ opacity: isRenderingPreview ? 0.5 : 1 }"
                />
                <div class="absolute inset-0 pointer-events-none">
                  <div
                    v-for="ann in currentPageAnnotations"
                    :key="ann.id"
                    class="absolute pointer-events-auto cursor-move select-none px-1 rounded outline-offset-1 hover:outline-2 hover:outline-[var(--cat)]"
                    :class="draggingAnnotation === ann.id && 'outline-2 outline-[var(--cat)]'"
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
                    @mousedown.stop="startDragAnnotation($event, ann)"
                  >
                    {{ ann.content }}
                  </div>
                </div>
                <div v-if="isRenderingPreview" class="absolute inset-0 grid place-items-center">
                  <span class="tb-spinner" aria-hidden="true"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PdfSidebar
          :file-name="editor.fileName.value"
          :page-count="editor.pageCount.value"
          :selected-count="selectedCount"
          @close="handleClearFile"
          @export="editor.exportPdf"
          @add-files="openAddFilePicker"
        />
      </template>

      <PdfAnnotationPanel
        :visible="editor.showAnnotationPanel.value"
        :annotations="editor.annotations.value"
        :selected-page-index="previewIndex"
        @close="editor.toggleAnnotationPanel"
        @add="editor.addAnnotation"
        @remove="editor.removeAnnotation"
        @update="editor.updateAnnotation"
        @clear="handleClearAnnotations"
      />
    </div>

    <input ref="fileInput" type="file" accept="application/pdf,.pdf" class="hidden" @change="handleFileSelect" />
    <input ref="addFileInput" type="file" accept="application/pdf,.pdf" multiple class="hidden" @change="handleAddFiles" />
  </div>
</template>
