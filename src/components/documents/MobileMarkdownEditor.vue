<script setup>
import { ref, computed, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const mode = ref('edit') // 'edit' | 'preview'
const markdown = ref(`# Bienvenido

Escribe tu **Markdown** aqui.

- Lista uno
- Lista dos

\`codigo\`
`)

const textareaRef = ref(null)
const fileInput = ref(null)
const showExportMenu = ref(false)
const toastMessage = ref('')
const toastVisible = ref(false)

marked.setOptions({ breaks: true, gfm: true })

const preview = computed(() => DOMPurify.sanitize(marked(markdown.value)))

const stats = computed(() => {
  const text = markdown.value.trim()
  const words = text ? text.split(/\s+/).length : 0
  const chars = text.length
  return { words, chars }
})

function showToast(msg) {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 2000)
}

function insertFormat(before, after = '') {
  const ta = textareaRef.value
  if (!ta) return

  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = markdown.value.substring(start, end)
  const replacement = before + selected + after

  markdown.value = markdown.value.substring(0, start) + replacement + markdown.value.substring(end)

  nextTick(() => {
    ta.focus()
    const newPos = start + before.length + selected.length + after.length
    ta.setSelectionRange(newPos, newPos)
  })
}

function insertHeading() {
  const ta = textareaRef.value
  if (!ta) return

  const start = ta.selectionStart
  const lineStart = markdown.value.lastIndexOf('\n', start - 1) + 1
  const lineText = markdown.value.substring(lineStart, start)

  // Count existing #
  const match = lineText.match(/^(#{0,5})\s*/)
  const currentLevel = match ? match[1].length : 0
  const newLevel = currentLevel >= 6 ? 1 : currentLevel + 1
  const prefix = '#'.repeat(newLevel) + ' '

  // Remove old heading markers
  const cleanLine = lineText.replace(/^#{1,6}\s*/, '')
  markdown.value = markdown.value.substring(0, lineStart) + prefix + cleanLine + markdown.value.substring(start)

  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(lineStart + prefix.length + cleanLine.length, lineStart + prefix.length + cleanLine.length)
  })
}

function insertList(ordered = false) {
  const ta = textareaRef.value
  if (!ta) return

  const start = ta.selectionStart
  const lineStart = markdown.value.lastIndexOf('\n', start - 1) + 1
  const prefix = ordered ? '1. ' : '- '

  markdown.value = markdown.value.substring(0, lineStart) + prefix + markdown.value.substring(lineStart)

  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length)
  })
}

function insertLink() {
  insertFormat('[', '](url)')
}

function insertCodeBlock() {
  insertFormat('\n```\n', '\n```\n')
}

function insertQuote() {
  const ta = textareaRef.value
  if (!ta) return

  const start = ta.selectionStart
  const lineStart = markdown.value.lastIndexOf('\n', start - 1) + 1

  markdown.value = markdown.value.substring(0, lineStart) + '> ' + markdown.value.substring(lineStart)

  nextTick(() => {
    ta.focus()
  })
}

async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(markdown.value)
    showToast('Copiado')
  } catch (err) {
    console.error(err)
  }
  showExportMenu.value = false
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  showExportMenu.value = false
  showToast('Descargado')
}

function downloadMarkdown() {
  downloadFile(markdown.value, 'documento.md', 'text/markdown')
}

function downloadHTML() {
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Documento</title>
<style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:20px;line-height:1.6}
code{background:#f4f4f4;padding:2px 6px;border-radius:3px}
pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto}
blockquote{border-left:4px solid #ddd;padding-left:1em;margin-left:0;color:#666}</style>
</head><body>${preview.value}</body></html>`
  downloadFile(html, 'documento.html', 'text/html')
}

function openFile() {
  fileInput.value?.click()
}

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!file.name.match(/\.(md|markdown|txt)$/i)) {
    showToast('Archivo no valido')
    return
  }

  try {
    markdown.value = await file.text()
    showToast('Archivo cargado')
  } catch (err) {
    showToast('Error al leer')
  }
  e.target.value = ''
}

function clearAll() {
  if (confirm('Limpiar todo?')) {
    markdown.value = ''
    showToast('Limpiado')
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-950">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        <span class="text-sm font-medium text-white">Markdown</span>
      </div>
      <div class="flex items-center gap-1">
        <button @click="openFile" class="p-2 text-neutral-400 active:text-white" style="touch-action: manipulation;">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </button>
        <button @click="showExportMenu = !showExportMenu" class="p-2 text-neutral-400 active:text-white relative" style="touch-action: manipulation;">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Export Menu Dropdown -->
    <Transition name="fade">
      <div v-if="showExportMenu" class="absolute top-14 right-4 z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden">
        <button @click="copyMarkdown" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Copiar
        </button>
        <button @click="downloadMarkdown" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700 border-t border-neutral-700">
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Descargar .md
        </button>
        <button @click="downloadHTML" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700 border-t border-neutral-700">
          <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Descargar .html
        </button>
        <button @click="clearAll" class="w-full px-4 py-3 text-left text-sm text-red-400 flex items-center gap-3 active:bg-neutral-700 border-t border-neutral-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Limpiar
        </button>
      </div>
    </Transition>

    <!-- Click outside to close menu -->
    <div v-if="showExportMenu" class="fixed inset-0 z-40" @click="showExportMenu = false"></div>

    <!-- Mode Toggle -->
    <div class="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 border-b border-neutral-800">
      <button
        @click="mode = 'edit'"
        :class="[
          'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
          mode === 'edit' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-neutral-500 border border-transparent'
        ]"
        style="touch-action: manipulation;"
      >
        Editar
      </button>
      <button
        @click="mode = 'preview'"
        :class="[
          'flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
          mode === 'preview' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-neutral-500 border border-transparent'
        ]"
        style="touch-action: manipulation;"
      >
        Preview
      </button>
    </div>

    <!-- Format Toolbar (only in edit mode) -->
    <div v-if="mode === 'edit'" class="flex items-center gap-1 px-3 py-2 bg-neutral-900/30 border-b border-neutral-800 overflow-x-auto">
      <button @click="insertFormat('**', '**')" class="md-mobile-format-btn" title="Negrita">
        <span class="font-bold">B</span>
      </button>
      <button @click="insertFormat('*', '*')" class="md-mobile-format-btn" title="Cursiva">
        <span class="italic">I</span>
      </button>
      <button @click="insertFormat('~~', '~~')" class="md-mobile-format-btn" title="Tachado">
        <span class="line-through">S</span>
      </button>
      <div class="w-px h-5 bg-neutral-700 mx-1"></div>
      <button @click="insertHeading" class="md-mobile-format-btn" title="Heading">
        <span class="text-xs font-bold">H</span>
      </button>
      <button @click="insertList(false)" class="md-mobile-format-btn" title="Lista">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <button @click="insertList(true)" class="md-mobile-format-btn" title="Lista numerada">
        <span class="text-xs font-mono">1.</span>
      </button>
      <div class="w-px h-5 bg-neutral-700 mx-1"></div>
      <button @click="insertFormat('`', '`')" class="md-mobile-format-btn" title="Codigo inline">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
        </svg>
      </button>
      <button @click="insertCodeBlock" class="md-mobile-format-btn" title="Bloque de codigo">
        <span class="text-[10px] font-mono">{}</span>
      </button>
      <button @click="insertQuote" class="md-mobile-format-btn" title="Cita">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      </button>
      <button @click="insertLink" class="md-mobile-format-btn" title="Enlace">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
      </button>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-hidden relative">
      <!-- Editor -->
      <textarea
        v-show="mode === 'edit'"
        ref="textareaRef"
        v-model="markdown"
        class="absolute inset-0 w-full h-full p-4 bg-transparent text-neutral-100 font-mono text-[15px] leading-relaxed resize-none focus:outline-none"
        placeholder="Escribe tu Markdown aqui..."
        spellcheck="false"
      ></textarea>

      <!-- Preview -->
      <div
        v-show="mode === 'preview'"
        class="absolute inset-0 w-full h-full p-4 overflow-y-auto prose-mobile"
      >
        <div class="prose prose-invert max-w-none" v-html="preview"></div>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="flex items-center justify-between px-4 py-2 bg-neutral-900/80 border-t border-neutral-800 text-xs text-neutral-500 mb-14">
      <span>{{ stats.words }} palabras</span>
      <span>{{ stats.chars }} caracteres</span>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept=".md,.markdown,.txt" class="hidden" @change="handleFileSelect" />

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastVisible" class="fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-neutral-800 text-white text-sm rounded-full shadow-lg">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Prose mobile styles */
:deep(.prose) {
  color: #d1d5db;
  line-height: 1.7;
  font-size: 15px;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3) {
  color: #22c55e;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
  font-weight: 600;
}

:deep(.prose h1) { font-size: 1.5em; }
:deep(.prose h2) { font-size: 1.3em; }
:deep(.prose h3) { font-size: 1.1em; }

:deep(.prose strong) { color: #f3f4f6; }
:deep(.prose em) { color: #e5e7eb; }

:deep(.prose code) {
  background: rgba(34, 197, 94, 0.15);
  color: #7dd3fc;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

:deep(.prose pre) {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(34, 197, 94, 0.2);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
}

:deep(.prose pre code) {
  background: none;
  padding: 0;
}

:deep(.prose blockquote) {
  border-left: 3px solid #22c55e;
  color: #9ca3af;
  padding-left: 1em;
  margin: 1em 0;
}

:deep(.prose a) {
  color: #22c55e;
  text-decoration: underline;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin: 0.8em 0;
  padding-left: 1.5em;
}

:deep(.prose ul) { list-style-type: disc; }
:deep(.prose ol) { list-style-type: decimal; }

:deep(.prose li) {
  margin: 0.3em 0;
}

:deep(.prose hr) {
  border: none;
  border-top: 1px solid rgba(34, 197, 94, 0.3);
  margin: 1.5em 0;
}

:deep(.prose p) {
  margin: 0.6em 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
