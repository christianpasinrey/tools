<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TbToolbar from '../ui/TbToolbar.vue'
import TbToolbarGroup from '../ui/TbToolbarGroup.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbMenu from '../ui/TbMenu.vue'
import { toast } from '../../composables/useToast'
import { SuperDoc } from '@harbour-enterprises/superdoc'
import '@harbour-enterprises/superdoc/style.css'

const editorContainerRef = ref(null)
let superdoc = null

const isReady = ref(false)
const currentFileName = ref('documento.docx')
const fileInputRef = ref(null)

const showToast = (msg, tone = 'info') => toast(msg, { tone })

const createSuperdoc = (file = null) => {
  if (!editorContainerRef.value) return null

  const config = {
    selector: editorContainerRef.value,
    documentMode: 'editing',
    role: 'editor',
    pagination: false, // Better for mobile
    rulers: false,
    onReady: () => {
      isReady.value = true
    }
  }

  if (file) {
    config.document = file
  }

  return new SuperDoc(config)
}

// SuperDoc maqueta páginas de ancho fijo (8,5" = 816 px): en el móvil se escalan al ancho disponible
const PAGE_WIDTH = 816
const paperRef = ref(null)
const fit = ref(1)
let resizeObserver = null

onMounted(() => {
  superdoc = createSuperdoc()
  if (typeof ResizeObserver === 'undefined' || !paperRef.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    fit.value = Math.min(1, (entry.contentRect.width - 16) / PAGE_WIDTH)
  })
  resizeObserver.observe(paperRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  superdoc?.destroy()
  superdoc = null
})

const newDocument = () => {
  isReady.value = false
  superdoc?.destroy()
  superdoc = createSuperdoc()
  currentFileName.value = 'documento.docx'
  showToast('Nuevo documento')
}

const openFile = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.name.match(/\.docx?$/i)) {
    e.target.value = ''
    showToast('Solo se pueden abrir archivos .docx', 'error')
    return
  }

  currentFileName.value = file.name
  isReady.value = false
  superdoc?.destroy()
  superdoc = createSuperdoc(file)
  e.target.value = ''
  showToast('Documento abierto', 'success')
}

const downloadDocument = async () => {
  if (!superdoc) return

  try {
    const blob = await superdoc.export({
      isFinalDoc: true,
      commentsType: 'clean',
      // Solo queremos el Blob: la descarga la hacemos nosotros con el nombre del archivo
      triggerDownload: false
    })

    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentFileName.value
      a.click()
      URL.revokeObjectURL(url)
      showToast('Documento descargado', 'success')
    }
  } catch (err) {
    showToast('No se pudo descargar el documento', 'error')
  }
}

// Format commands
const execCommand = (cmd, value = null) => {
  const editor = superdoc?.activeEditor
  if (!editor) return

  switch (cmd) {
    case 'bold':
      editor.commands.toggleBold?.()
      break
    case 'italic':
      editor.commands.toggleItalic?.()
      break
    case 'underline':
      editor.commands.toggleUnderline?.()
      break
    case 'strike':
      editor.commands.toggleStrike?.()
      break
    case 'bulletList':
      editor.commands.toggleBulletList?.()
      break
    case 'orderedList':
      editor.commands.toggleOrderedList?.()
      break
    case 'alignLeft':
      editor.commands.setTextAlign?.('left')
      break
    case 'alignCenter':
      editor.commands.setTextAlign?.('center')
      break
    case 'alignRight':
      editor.commands.setTextAlign?.('right')
      break
    case 'undo':
      editor.commands.undo?.()
      break
    case 'redo':
      editor.commands.redo?.()
      break
  }
}

const menuItems = [
  { label: 'Nuevo documento', icon: 'file-plus', action: () => newDocument() },
  { label: 'Abrir .docx', icon: 'folder', action: () => openFile() },
  { label: 'Descargar .docx', icon: 'download', action: () => downloadDocument() }
]

const formatGroups = [
  { label: 'Texto', items: [
    { cmd: 'bold', label: 'Negrita', icon: 'bold' },
    { cmd: 'italic', label: 'Cursiva', icon: 'italic' },
    { cmd: 'underline', label: 'Subrayado', icon: 'underline' },
    { cmd: 'strike', label: 'Tachado', icon: 'strike' }
  ] },
  { label: 'Listas', items: [
    { cmd: 'bulletList', label: 'Lista', icon: 'list' },
    { cmd: 'orderedList', label: 'Lista numerada', icon: 'list-ordered' }
  ] },
  { label: 'Alineación', items: [
    { cmd: 'alignLeft', label: 'Alinear a la izquierda', icon: 'align-left' },
    { cmd: 'alignCenter', label: 'Centrar', icon: 'align-center' },
    { cmd: 'alignRight', label: 'Alinear a la derecha', icon: 'align-right' }
  ] }
]
</script>

<template>
  <div class="h-full flex flex-col bg-tb-bg text-tb-ink font-ui mobile-docx-editor" style="--cat: var(--cat-documents)">
    <div class="shrink-0 flex items-center gap-1 pl-4 pr-2 py-2 border-b border-tb-line bg-tb-surface">
      <p class="flex-1 min-w-0 text-sm font-medium text-tb-ink truncate" :title="currentFileName">
        {{ currentFileName }}<span v-if="!isReady" class="ml-2 text-xs font-normal text-tb-muted">cargando…</span>
      </p>
      <TbIconButton icon="undo" label="Deshacer" size="lg" :disabled="!isReady" @click="execCommand('undo')" />
      <TbIconButton icon="redo" label="Rehacer" size="lg" :disabled="!isReady" @click="execCommand('redo')" />
      <TbMenu label="Más opciones" icon="more-vertical" icon-only align="end" :items="menuItems" />
    </div>

    <TbToolbar label="Formato" class="shrink-0 px-2 py-1.5 border-b border-tb-line bg-tb-surface">
      <TbToolbarGroup v-for="group in formatGroups" :key="group.label" :label="group.label">
        <TbIconButton v-for="b in group.items" :key="b.cmd" :icon="b.icon" :label="b.label" size="lg" :disabled="!isReady" @click="execCommand(b.cmd)" />
      </TbToolbarGroup>
    </TbToolbar>

    <!-- El papel es blanco en ambos temas: su texto lleva color propio -->
    <div ref="paperRef" class="flex-1 overflow-auto bg-white" data-test="docx-paper" style="color: #1c1a16">
      <div ref="editorContainerRef" class="mobile-superdoc-container" :style="{ zoom: fit }"></div>
    </div>

    <input ref="fileInputRef" type="file" accept=".docx,.doc" class="hidden" @change="handleFileSelect" />
  </div>
</template>

<style>
.mobile-docx-editor .ProseMirror { color: #1c1a16; }
</style>
