<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import '@harbour-enterprises/superdoc/style.css'
import { useDocxEditor } from '../../composables/useDocxEditor'
import DocxToolbar from './DocxToolbar.vue'
import DocxSidebar from './DocxSidebar.vue'

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

// El editor de SuperDoc no es reactivo: se relee cada vez que cambia isReady
const activeEditor = computed(() => (isReady.value ? getActiveEditor() : null))

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
  <div class="h-full flex flex-col bg-tb-bg docx-editor-wrapper">
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
      <div class="docx-editor-scroll flex-1 overflow-auto">
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
/* Global SuperDoc overrides (no scoped): los colores salen de los tokens de El Taller */
.docx-editor-wrapper {
  --sd-toolbar-bg: var(--tb-surface);
  --sd-toolbar-border: var(--tb-line);
  --sd-editor-bg: var(--tb-bg);
  --sd-btn-color: var(--tb-muted);
  --sd-btn-hover-bg: var(--tb-surface-2);
  --sd-btn-hover-color: var(--tb-ink);
  --sd-dropdown-bg: var(--tb-surface);
  --sd-dropdown-border: var(--tb-line);
  --sd-page-shadow: 0 1px 2px rgb(0 0 0 / .08), 0 18px 40px -16px rgb(0 0 0 / .35);
  --docx-zoom: 1;
}

/* Scroll container */
.docx-editor-scroll {
  background: var(--sd-editor-bg);
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
  background: var(--sd-toolbar-bg) !important;
  border-bottom: 1px solid var(--sd-toolbar-border) !important;
  padding: 4px 8px !important;
}

.docx-editor-wrapper .superdoc-toolbar .toolbar-button,
.docx-editor-wrapper .superdoc-toolbar button,
.docx-editor-wrapper .superdoc-toolbar input {
  color: var(--sd-btn-color) !important;
  border-radius: 8px !important;
}

.docx-editor-wrapper .superdoc-toolbar .toolbar-button:not(.disabled):hover,
.docx-editor-wrapper .superdoc-toolbar button:hover {
  background: var(--sd-btn-hover-bg) !important;
  color: var(--sd-btn-hover-color) !important;
}

.docx-editor-wrapper .superdoc-toolbar .toolbar-button.disabled { opacity: .45; }

.docx-editor-wrapper .superdoc-toolbar .toolbar-button.active:not(.disabled),
.docx-editor-wrapper .superdoc-toolbar .toolbar-button[data-active="true"],
.docx-editor-wrapper .superdoc-toolbar button.active {
  background: color-mix(in srgb, var(--cat) 14%, transparent) !important;
  color: var(--cat) !important;
}

.docx-editor-wrapper .superdoc-toolbar .toolbar-separator { background: transparent !important; }
.docx-editor-wrapper .superdoc-toolbar .separator-inner { background: var(--tb-line-strong) !important; }

/* Document pages - white background */
.docx-editor-wrapper .superdoc-editor .ProseMirror,
.docx-editor-wrapper .superdoc-editor [class*="ProseMirror"] {
  background: #fff !important;
  color: #1c1a16 !important;
  width: 816px !important;
  min-width: 816px !important;
  max-width: 816px !important;
  margin: 0 auto !important;
  padding: 72px !important;
  box-shadow: var(--sd-page-shadow) !important;
  border-radius: 2px !important;
  min-height: 1056px !important;
}

/* SuperDoc page wrapper */
.docx-editor-wrapper .superdoc-page,
.docx-editor-wrapper [class*="superdoc-page"],
.docx-editor-wrapper [class*="page-container"] {
  background: #fff !important;
  box-shadow: var(--sd-page-shadow) !important;
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
  background: var(--sd-dropdown-bg) !important;
  border: 1px solid var(--sd-dropdown-border) !important;
  color: var(--sd-btn-color) !important;
  border-radius: 4px !important;
}

.docx-editor-wrapper .superdoc-toolbar .dropdown-menu,
.docx-editor-wrapper .superdoc-toolbar [class*="dropdown"] {
  background: var(--sd-dropdown-bg) !important;
  border: 1px solid var(--sd-dropdown-border) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
}

/* Color pickers and popovers */
.docx-editor-wrapper [class*="popover"],
.docx-editor-wrapper [class*="picker"] {
  background: var(--sd-dropdown-bg) !important;
  border: 1px solid var(--sd-dropdown-border) !important;
}
</style>
