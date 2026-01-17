<script setup>
import { ref, computed } from 'vue'
import { usePdfEditor } from '../composables/usePdfEditor'
import PdfToolbar from '../components/pdf/PdfToolbar.vue'
import PdfPagesGrid from '../components/pdf/PdfPagesGrid.vue'
import PdfSidebar from '../components/pdf/PdfSidebar.vue'

const editor = usePdfEditor()
const fileInput = ref(null)
const addFileInput = ref(null)
const isDragging = ref(false)

// Computed
const showSidebar = computed(() => editor.hasFile.value && !editor.isLoading.value)
const selectedCount = computed(() => editor.selectedPages.value.size)

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

    <!-- Toolbar -->
    <PdfToolbar
      :has-file="editor.hasFile.value"
      :has-selection="editor.hasSelection.value"
      :all-selected="editor.allSelected.value"
      :selected-count="selectedCount"
      :page-count="editor.pageCount.value"
      :theme-color="editor.themeColor.value"
      @open="openFilePicker"
      @add-files="openAddFilePicker"
      @export="editor.exportPdf"
      @select-all="editor.selectAll"
      @deselect-all="editor.deselectAll"
      @rotate-left="editor.rotateSelected(-90)"
      @rotate-right="editor.rotateSelected(90)"
      @delete="editor.deleteSelected"
      @extract="editor.extractSelected"
      @split-all="editor.splitAll"
      @color-change="editor.setThemeColor"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Pages Grid -->
      <PdfPagesGrid
        :pages="editor.pages.value"
        :selected-pages="editor.selectedPages.value"
        :theme-color="editor.themeColor.value"
        :is-loading="editor.isLoading.value"
        :has-file="editor.hasFile.value"
        :is-dragging="isDragging"
        @drop="handleDrop"
        @dragover="isDragging = true"
        @dragleave="isDragging = false"
        @click="openFilePicker"
        @toggle-select="editor.togglePageSelection"
        @reorder="editor.reorderPages"
      />

      <!-- Sidebar -->
      <PdfSidebar
        v-if="showSidebar"
        :file-name="editor.fileName.value"
        :page-count="editor.pageCount.value"
        :selected-count="selectedCount"
        :theme-color="editor.themeColor.value"
        @close="editor.clearFile"
        @export="editor.exportPdf"
        @add-files="openAddFilePicker"
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
