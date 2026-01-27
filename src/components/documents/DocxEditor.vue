<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
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

const createSuperdoc = (file = null) => {
  const config = {
    selector: editorContainerRef.value,
    toolbar: toolbarRef.value,
    documentMode: 'editing',
    role: 'editor',
    pagination: true,
    rulers: true,
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
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-950 docx-editor-wrapper">
    <!-- Custom toolbar row -->
    <div class="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-3 gap-2 shrink-0">
      <button
        @click="newDocument"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
        title="Nuevo documento"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <button
        @click="openFile"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
        title="Abrir archivo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      </button>

      <button
        @click="exportDocx"
        :disabled="!isReady"
        class="p-1.5 rounded transition-colors"
        :class="isReady ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10' : 'text-neutral-600 cursor-not-allowed'"
        title="Descargar DOCX"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      <div class="w-px h-5 bg-neutral-700 mx-1"></div>

      <span class="text-xs text-neutral-500 truncate max-w-[150px]" :title="currentFileName">
        {{ currentFileName }}
      </span>

      <div class="flex-1"></div>

      <VaultSaveLoad
        storeName="docx-documents"
        :getData="getDocumentData"
        label="documento DOCX"
        @load="loadDocument"
      />
    </div>

    <!-- SuperDoc toolbar -->
    <div ref="toolbarRef" class="superdoc-toolbar-container shrink-0"></div>

    <!-- Editor container -->
    <div ref="editorContainerRef" class="flex-1 overflow-auto superdoc-editor-container"></div>

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

<style scoped>
.docx-editor-wrapper {
  --toolbar-bg: #171717;
  --toolbar-border: #262626;
  --toolbar-button-hover: #262626;
}

.superdoc-toolbar-container {
  background: #171717;
  border-bottom: 1px solid #262626;
}

.superdoc-editor-container {
  background: #0a0a0a;
}
</style>
