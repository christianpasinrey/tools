<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { SuperDoc } from '@harbour-enterprises/superdoc'
import '@harbour-enterprises/superdoc/style.css'
import VaultSaveLoad from '../common/VaultSaveLoad.vue'

defineProps({
  themeColor: { type: String, default: '#22c55e' }
})

const editorContainerRef = ref(null)
const toolbarRef = ref(null)
const fileInputRef = ref(null)
let superdoc = null

const isReady = ref(false)
const currentFileName = ref('documento.docx')
const documentMode = ref('editing')
const zoom = ref(100)

// Toolbar configuration with ALL available buttons
const toolbarConfig = {
  groups: {
    left: [
      'undo', 'redo',
      'separator',
      'fontFamily', 'fontSize',
      'separator',
      'bold', 'italic', 'underline', 'strikethrough',
      'separator',
      'color', 'highlight'
    ],
    center: [
      'alignLeft', 'alignCenter', 'alignRight', 'justify',
      'separator',
      'list', 'numberedlist',
      'separator',
      'indentleft', 'indentright',
      'separator',
      'link', 'image'
    ],
    right: [
      'search',
      'separator',
      'ruler',
      'zoom'
    ]
  },
  // Custom buttons for tables
  customButtons: [
    {
      type: 'dropdown',
      name: 'insertTable',
      tooltip: 'Insertar tabla',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>',
      group: 'center',
      options: [
        { label: '2x2', key: '2x2' },
        { label: '3x3', key: '3x3' },
        { label: '4x4', key: '4x4' },
        { label: '5x5', key: '5x5' }
      ],
      command: ({ option, superdoc }) => {
        const editor = superdoc?.activeEditor
        if (editor && option) {
          const [rows, cols] = option.key.split('x').map(Number)
          editor.commands.insertTable({ rows, cols, withHeaderRow: true })
        }
      }
    },
    {
      type: 'button',
      name: 'pageBreak',
      tooltip: 'Salto de página',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="4 2"/><polyline points="6 8 3 12 6 16"/><polyline points="18 8 21 12 18 16"/></svg>',
      group: 'center',
      command: ({ superdoc }) => {
        const editor = superdoc?.activeEditor
        if (editor) {
          editor.commands.setHardBreak?.()
        }
      }
    }
  ]
}

const createSuperdoc = (file = null) => {
  const config = {
    selector: editorContainerRef.value,
    toolbar: toolbarRef.value,
    documentMode: documentMode.value,
    role: 'editor',
    pagination: true,
    rulers: false,
    modules: {
      toolbar: toolbarConfig
    },
    onReady: () => {
      isReady.value = true
    },
    onEditorUpdate: () => {}
  }

  if (file) {
    config.document = file
  }

  return new SuperDoc(config)
}

onMounted(() => {
  superdoc = createSuperdoc()
})

onBeforeUnmount(() => {
  superdoc?.destroy()
  superdoc = null
})

const openFile = () => fileInputRef.value?.click()

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file || !file.name.match(/\.docx?$/i)) return

  currentFileName.value = file.name
  isReady.value = false
  superdoc?.destroy()
  superdoc = createSuperdoc(file)
  e.target.value = ''
}

const exportDocx = async () => {
  if (!superdoc) return
  const blob = await superdoc.export({
    isFinalDoc: true,
    commentsType: 'clean'
  })
  if (blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentFileName.value
    a.click()
    URL.revokeObjectURL(url)
  }
}

const getDocumentData = () => {
  return (async () => {
    if (!superdoc) return null
    const blob = await superdoc.export({ isFinalDoc: true })
    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    return { content: base64, fileName: currentFileName.value }
  })()
}

const loadDocument = async (data) => {
  if (!data?.content) return

  const binary = atob(data.content)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  })
  const file = new File([blob], data.fileName || 'documento.docx', { type: blob.type })

  currentFileName.value = data.fileName || 'documento.docx'
  isReady.value = false
  superdoc?.destroy()
  superdoc = createSuperdoc(file)
}

const newDocument = () => {
  isReady.value = false
  superdoc?.destroy()
  superdoc = createSuperdoc()
  currentFileName.value = 'documento.docx'
}

const toggleMode = (mode) => {
  documentMode.value = mode
  superdoc?.setDocumentMode(mode)
}

const adjustZoom = (delta) => {
  zoom.value = Math.min(200, Math.max(50, zoom.value + delta))
}

const printDocument = () => {
  window.print()
}
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-900 docx-editor-wrapper">
    <!-- Top bar: File actions -->
    <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-3 shrink-0">
      <!-- File actions -->
      <div class="flex items-center gap-1">
        <button
          @click="newDocument"
          class="docx-btn"
          title="Nuevo documento"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        <button
          @click="openFile"
          class="docx-btn"
          title="Abrir archivo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </button>

        <button
          @click="exportDocx"
          :disabled="!isReady"
          class="docx-btn"
          :class="{ 'text-blue-400 hover:text-blue-300': isReady, 'opacity-40 cursor-not-allowed': !isReady }"
          title="Descargar DOCX"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>

        <button
          @click="printDocument"
          :disabled="!isReady"
          class="docx-btn"
          :class="{ 'opacity-40 cursor-not-allowed': !isReady }"
          title="Imprimir"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
      </div>

      <div class="w-px h-5 bg-neutral-700"></div>

      <!-- Document name -->
      <div class="flex items-center gap-2 min-w-0">
        <svg class="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-sm text-neutral-300 truncate max-w-[200px]" :title="currentFileName">
          {{ currentFileName }}
        </span>
        <span v-if="isReady" class="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
          Listo
        </span>
      </div>

      <div class="flex-1"></div>

      <!-- Zoom controls -->
      <div class="flex items-center gap-1 bg-neutral-800 rounded-lg px-1">
        <button @click="adjustZoom(-10)" class="docx-btn-sm" title="Reducir zoom">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>
        <span class="text-xs text-neutral-400 w-10 text-center">{{ zoom }}%</span>
        <button @click="adjustZoom(10)" class="docx-btn-sm" title="Aumentar zoom">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div class="w-px h-5 bg-neutral-700"></div>

      <!-- Mode toggle -->
      <div class="flex items-center bg-neutral-800 rounded-lg p-0.5">
        <button
          @click="toggleMode('editing')"
          class="px-2.5 py-1 text-xs rounded-md transition-colors"
          :class="documentMode === 'editing' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'"
          title="Modo edición"
        >
          Editar
        </button>
        <button
          @click="toggleMode('viewing')"
          class="px-2.5 py-1 text-xs rounded-md transition-colors"
          :class="documentMode === 'viewing' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'"
          title="Modo vista"
        >
          Ver
        </button>
      </div>

      <div class="w-px h-5 bg-neutral-700"></div>

      <!-- Vault -->
      <VaultSaveLoad
        storeName="docx-documents"
        :getData="getDocumentData"
        label="documento DOCX"
        @load="loadDocument"
      />
    </div>

    <!-- SuperDoc native toolbar -->
    <div ref="toolbarRef" class="superdoc-toolbar shrink-0"></div>

    <!-- Main editor area with centered document -->
    <div class="flex-1 overflow-auto bg-neutral-800/50">
      <div
        ref="editorContainerRef"
        class="superdoc-editor mx-auto"
        :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }"
      ></div>
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
}

/* Toolbar styling */
.superdoc-toolbar {
  background: #1a1a1a !important;
  border-bottom: 1px solid #2a2a2a !important;
  padding: 4px 8px !important;
}

.superdoc-toolbar button {
  color: #a3a3a3 !important;
  border-radius: 4px !important;
}

.superdoc-toolbar button:hover {
  background: #333 !important;
  color: #fff !important;
}

.superdoc-toolbar button.active,
.superdoc-toolbar button[data-active="true"] {
  background: rgba(34, 197, 94, 0.15) !important;
  color: #22c55e !important;
}

/* Editor area */
.superdoc-editor {
  min-height: 100%;
  padding: 40px 0;
}

/* Document pages - white background centered */
.superdoc-editor .ProseMirror {
  background: #fff !important;
  color: #1a1a1a !important;
  max-width: 816px !important; /* Letter width at 96dpi */
  margin: 0 auto !important;
  padding: 72px 72px !important; /* 1 inch margins */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
  border-radius: 2px !important;
  min-height: 1056px !important; /* Letter height */
}

/* Pagination pages */
.superdoc-editor .superdoc-page {
  background: #fff !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
  margin: 20px auto !important;
}

/* Dropdowns */
.superdoc-toolbar select,
.superdoc-toolbar .dropdown-trigger {
  background: #2a2a2a !important;
  border: 1px solid #3a3a3a !important;
  color: #d4d4d4 !important;
  border-radius: 4px !important;
}

.superdoc-toolbar .dropdown-menu,
.superdoc-toolbar [class*="dropdown"] {
  background: #1a1a1a !important;
  border: 1px solid #3a3a3a !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5) !important;
}
</style>

