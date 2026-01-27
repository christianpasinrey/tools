<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import '@harbour-enterprises/superdoc/style.css'
import { useDocxEditor } from '../../composables/useDocxEditor'
import DocxToolbar from './DocxToolbar.vue'
import DocxSidebar from './DocxSidebar.vue'

defineProps({
  themeColor: { type: String, default: '#22c55e' }
})

const {
  editorContainerRef,
  toolbarRef,
  isReady,
  currentFileName,
  documentMode,
  zoom,
  init,
  destroy,
  loadFile,
  newDocument,
  downloadDocument,
  setDocumentMode,
  adjustZoom,
  serialize,
  deserialize,
  getActiveEditor
} = useDocxEditor()

// Computed for sidebar
const activeEditor = computed(() => getActiveEditor())

// File input ref (local to this component)
const fileInputRef = ref(null)

onMounted(() => {
  init()
})

onBeforeUnmount(() => {
  destroy()
})

const openFile = () => fileInputRef.value?.click()

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (loadFile(file)) {
    e.target.value = ''
  }
}

const printDocument = () => {
  window.print()
}

const handleModeChange = (mode) => {
  setDocumentMode(mode)
}

const handleZoomChange = (delta) => {
  adjustZoom(delta)
}

const handleLoad = async (data) => {
  await deserialize(data)
}

// getData for VaultSaveLoad
const getDocumentData = () => serialize()
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-900 docx-editor-wrapper">
    <!-- Top bar: File actions -->
    <DocxToolbar
      :file-name="currentFileName"
      :is-ready="isReady"
      :document-mode="documentMode"
      :zoom="zoom"
      :get-data="getDocumentData"
      @new="newDocument"
      @open="openFile"
      @download="downloadDocument"
      @print="printDocument"
      @mode-change="handleModeChange"
      @zoom-change="handleZoomChange"
      @load="handleLoad"
    />

    <!-- SuperDoc native toolbar -->
    <div ref="toolbarRef" class="superdoc-toolbar shrink-0"></div>

    <!-- Main content area with editor and sidebar -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Editor area with centered document -->
      <div class="docx-editor-scroll flex-1 overflow-auto bg-neutral-800/50">
        <div class="docx-editor-container" :style="{ '--docx-zoom': zoom / 100 }">
          <div
            ref="editorContainerRef"
            class="superdoc-editor"
          ></div>
        </div>
      </div>

      <!-- Contextual sidebar -->
      <DocxSidebar
        :editor="activeEditor"
        :is-ready="isReady"
      />
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".docx,.doc"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>

<style>
/* Global SuperDoc overrides (no scoped) */
.docx-editor-wrapper {
  --sd-toolbar-bg: #1a1a1a;
  --sd-toolbar-border: #2a2a2a;
  --sd-editor-bg: #262626;
  --docx-zoom: 1;
}

/* Scroll container */
.docx-editor-scroll {
  background: #262626;
}

/* Zoom container - centers content */
.docx-editor-container {
  display: flex;
  justify-content: center;
  min-height: 100%;
  padding: 40px 20px;
}

/* Editor wrapper */
.superdoc-editor {
  zoom: var(--docx-zoom, 1);
  width: 100%;
  max-width: 900px;
}

/* Toolbar styling */
.docx-editor-wrapper .superdoc-toolbar {
  background: #1a1a1a !important;
  border-bottom: 1px solid #2a2a2a !important;
  padding: 4px 8px !important;
}

.docx-editor-wrapper .superdoc-toolbar button {
  color: #a3a3a3 !important;
  border-radius: 4px !important;
}

.docx-editor-wrapper .superdoc-toolbar button:hover {
  background: #333 !important;
  color: #fff !important;
}

.docx-editor-wrapper .superdoc-toolbar button.active,
.docx-editor-wrapper .superdoc-toolbar button[data-active="true"] {
  background: rgba(34, 197, 94, 0.15) !important;
  color: #22c55e !important;
}

/* Document pages - white background */
.docx-editor-wrapper .superdoc-editor .ProseMirror,
.docx-editor-wrapper .superdoc-editor [class*="ProseMirror"] {
  background: #fff !important;
  color: #1a1a1a !important;
  width: 816px !important;
  min-width: 816px !important;
  max-width: 816px !important;
  margin: 0 auto !important;
  padding: 72px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
  border-radius: 2px !important;
  min-height: 1056px !important;
}

/* SuperDoc page wrapper */
.docx-editor-wrapper .superdoc-page,
.docx-editor-wrapper [class*="superdoc-page"],
.docx-editor-wrapper [class*="page-container"] {
  background: #fff !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
  margin: 0 auto 20px auto !important;
  width: 816px !important;
}

/* SuperDoc internal containers - force centering */
.docx-editor-wrapper .superdoc-editor > div,
.docx-editor-wrapper .superdoc-editor > div > div {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  width: 100% !important;
}

/* Target SuperDoc's editor wrapper */
.docx-editor-wrapper .super-editor-wrapper,
.docx-editor-wrapper [class*="super-editor"],
.docx-editor-wrapper [class*="editor-wrapper"] {
  display: flex !important;
  justify-content: center !important;
  width: 100% !important;
}

/* Page content centering */
.docx-editor-wrapper .page-content,
.docx-editor-wrapper [class*="page-content"] {
  margin: 0 auto !important;
}

/* Dropdowns */
.docx-editor-wrapper .superdoc-toolbar select,
.docx-editor-wrapper .superdoc-toolbar .dropdown-trigger {
  background: #2a2a2a !important;
  border: 1px solid #3a3a3a !important;
  color: #d4d4d4 !important;
  border-radius: 4px !important;
}

.docx-editor-wrapper .superdoc-toolbar .dropdown-menu,
.docx-editor-wrapper .superdoc-toolbar [class*="dropdown"] {
  background: #1a1a1a !important;
  border: 1px solid #3a3a3a !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
}

/* Color pickers and popovers */
.docx-editor-wrapper [class*="popover"],
.docx-editor-wrapper [class*="picker"] {
  background: #1a1a1a !important;
  border: 1px solid #3a3a3a !important;
}
</style>
