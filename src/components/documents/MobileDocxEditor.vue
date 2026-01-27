<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { SuperDoc } from '@harbour-enterprises/superdoc'
import '@harbour-enterprises/superdoc/style.css'

const editorContainerRef = ref(null)
let superdoc = null

const isReady = ref(false)
const currentFileName = ref('documento.docx')
const showMenu = ref(false)
const showFormatBar = ref(false)
const toastMessage = ref('')
const toastVisible = ref(false)
const fileInputRef = ref(null)

function showToast(msg) {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 2000)
}

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

onMounted(() => {
  superdoc = createSuperdoc()
})

onBeforeUnmount(() => {
  superdoc?.destroy()
  superdoc = null
})

const newDocument = () => {
  isReady.value = false
  superdoc?.destroy()
  superdoc = createSuperdoc()
  currentFileName.value = 'documento.docx'
  showMenu.value = false
  showToast('Nuevo documento')
}

const openFile = () => {
  fileInputRef.value?.click()
  showMenu.value = false
}

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file || !file.name.match(/\.docx?$/i)) {
    showToast('Archivo no válido')
    return
  }

  currentFileName.value = file.name
  isReady.value = false
  superdoc?.destroy()
  superdoc = createSuperdoc(file)
  e.target.value = ''
  showToast('Archivo cargado')
}

const downloadDocument = async () => {
  if (!superdoc) return

  try {
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
      showToast('Descargado')
    }
  } catch (err) {
    showToast('Error al descargar')
  }
  showMenu.value = false
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
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-950 mobile-docx-editor">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 shrink-0">
      <div class="flex items-center gap-2 min-w-0">
        <svg class="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span class="text-sm font-medium text-white truncate">{{ currentFileName }}</span>
        <span v-if="isReady" class="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
          Listo
        </span>
      </div>
      <button @click="showMenu = !showMenu" class="p-2 text-neutral-400 active:text-white" style="touch-action: manipulation;">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
        </svg>
      </button>
    </div>

    <!-- Menu Dropdown -->
    <Transition name="fade">
      <div v-if="showMenu" class="absolute top-14 right-4 z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden">
        <button @click="newDocument" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo
        </button>
        <button @click="openFile" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700 border-t border-neutral-700">
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          Abrir archivo
        </button>
        <button @click="downloadDocument" :disabled="!isReady" class="w-full px-4 py-3 text-left text-sm flex items-center gap-3 active:bg-neutral-700 border-t border-neutral-700" :class="isReady ? 'text-white' : 'text-neutral-500'">
          <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Descargar .docx
        </button>
      </div>
    </Transition>

    <!-- Click outside to close menu -->
    <div v-if="showMenu" class="fixed inset-0 z-40" @click="showMenu = false"></div>

    <!-- Editor Area -->
    <div class="flex-1 overflow-auto bg-white">
      <div ref="editorContainerRef" class="mobile-superdoc-container"></div>
    </div>

    <!-- Bottom Format Bar -->
    <div class="bg-neutral-900 border-t border-neutral-800 px-2 py-2 mb-14">
      <!-- Undo/Redo row -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-1">
          <button @click="execCommand('undo')" class="mobile-docx-btn" :disabled="!isReady">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
            </svg>
          </button>
          <button @click="execCommand('redo')" class="mobile-docx-btn" :disabled="!isReady">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
            </svg>
          </button>
        </div>
        <button @click="showFormatBar = !showFormatBar" class="px-3 py-1.5 text-xs rounded-lg" :class="showFormatBar ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'">
          {{ showFormatBar ? 'Ocultar' : 'Formato' }}
        </button>
      </div>

      <!-- Format buttons (expandable) -->
      <Transition name="slide">
        <div v-if="showFormatBar" class="flex flex-wrap gap-1">
          <!-- Text format -->
          <button @click="execCommand('bold')" class="mobile-docx-btn" :disabled="!isReady" title="Negrita">
            <span class="font-bold text-sm">B</span>
          </button>
          <button @click="execCommand('italic')" class="mobile-docx-btn" :disabled="!isReady" title="Cursiva">
            <span class="italic text-sm">I</span>
          </button>
          <button @click="execCommand('underline')" class="mobile-docx-btn" :disabled="!isReady" title="Subrayado">
            <span class="underline text-sm">U</span>
          </button>
          <button @click="execCommand('strike')" class="mobile-docx-btn" :disabled="!isReady" title="Tachado">
            <span class="line-through text-sm">S</span>
          </button>

          <div class="w-px h-8 bg-neutral-700 mx-1"></div>

          <!-- Lists -->
          <button @click="execCommand('bulletList')" class="mobile-docx-btn" :disabled="!isReady" title="Lista">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <button @click="execCommand('orderedList')" class="mobile-docx-btn" :disabled="!isReady" title="Lista numerada">
            <span class="text-xs font-mono">1.</span>
          </button>

          <div class="w-px h-8 bg-neutral-700 mx-1"></div>

          <!-- Alignment -->
          <button @click="execCommand('alignLeft')" class="mobile-docx-btn" :disabled="!isReady" title="Izquierda">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16"/>
            </svg>
          </button>
          <button @click="execCommand('alignCenter')" class="mobile-docx-btn" :disabled="!isReady" title="Centro">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16"/>
            </svg>
          </button>
          <button @click="execCommand('alignRight')" class="mobile-docx-btn" :disabled="!isReady" title="Derecha">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16"/>
            </svg>
          </button>
        </div>
      </Transition>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".docx,.doc" class="hidden" @change="handleFileSelect" />

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastVisible" class="fixed bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-neutral-800 text-white text-sm rounded-full shadow-lg z-50">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>
