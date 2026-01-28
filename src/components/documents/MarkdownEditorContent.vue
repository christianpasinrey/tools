<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import VaultSaveLoad from '../common/VaultSaveLoad.vue'

defineProps({
  themeColor: { type: String, default: '#22c55e' }
})

const markdown = ref(`# Editor de Markdown Profesional

## Caracteristicas

Este editor incluye:

- **Toolbar de formato** con atajos de teclado
- **Vista dividida** ajustable
- **Outline** de navegacion
- **Estadisticas** en tiempo real
- Soporte para **GFM** (GitHub Flavored Markdown)

### Bloques de codigo

\`\`\`javascript
function saludo(nombre) {
  return \`Hola, \${nombre}!\`;
}

console.log(saludo('Mundo'));
\`\`\`

### Tablas

| Columna 1 | Columna 2 | Columna 3 |
|-----------|-----------|-----------|
| Dato A    | Dato B    | Dato C    |
| Dato D    | Dato E    | Dato F    |

### Citas

> "El mejor momento para plantar un arbol fue hace 20 anos.
> El segundo mejor momento es ahora."

### Checklists

- [x] Tarea completada
- [ ] Tarea pendiente
- [ ] Otra tarea

---

Comienza a escribir!
`)

// Refs
const editorRef = ref(null)
const previewRef = ref(null)
const fileInput = ref(null)
const searchInput = ref(null)

// State
const viewMode = ref('split') // 'editor' | 'split' | 'preview'
const splitRatio = ref(50)
const isDragging = ref(false)
const showOutline = ref(true)
const showSearch = ref(false)
const searchQuery = ref('')
const replaceQuery = ref('')
const syncScroll = ref(true)
const isScrolling = ref(false)

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: true
})

// Computed
const preview = computed(() => DOMPurify.sanitize(marked(markdown.value)))

const stats = computed(() => {
  const text = markdown.value.trim()
  const words = text ? text.split(/\s+/).length : 0
  const chars = text.length
  const lines = markdown.value.split('\n').length
  const readTime = Math.max(1, Math.ceil(words / 200))
  return { words, chars, lines, readTime }
})

const outline = computed(() => {
  const headings = []
  const lines = markdown.value.split('\n')
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/[*_`]/g, ''),
        line: index
      })
    }
  })
  return headings
})

const lineNumbers = computed(() => {
  return markdown.value.split('\n').map((_, i) => i + 1)
})

const searchMatches = computed(() => {
  if (!searchQuery.value) return []
  const matches = []
  const regex = new RegExp(searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  let match
  while ((match = regex.exec(markdown.value)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length })
  }
  return matches
})

// Methods
function insertFormat(before, after = '', placeholder = '') {
  const ta = editorRef.value
  if (!ta) return

  const start = ta.selectionStart
  const end = ta.selectionEnd
  const selected = markdown.value.substring(start, end) || placeholder

  markdown.value = markdown.value.substring(0, start) + before + selected + after + markdown.value.substring(end)

  nextTick(() => {
    ta.focus()
    if (selected === placeholder) {
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    } else {
      ta.setSelectionRange(start + before.length + selected.length + after.length, start + before.length + selected.length + after.length)
    }
  })
}

function insertAtLineStart(prefix) {
  const ta = editorRef.value
  if (!ta) return

  const start = ta.selectionStart
  const lineStart = markdown.value.lastIndexOf('\n', start - 1) + 1

  markdown.value = markdown.value.substring(0, lineStart) + prefix + markdown.value.substring(lineStart)

  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(start + prefix.length, start + prefix.length)
  })
}

function insertTable() {
  const table = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`
  insertFormat(table)
}

function insertImage() {
  insertFormat('![', '](url)', 'Alt text')
}

function insertLink() {
  insertFormat('[', '](url)', 'Link text')
}

function insertHorizontalRule() {
  insertFormat('\n\n---\n\n')
}

function insertCheckbox() {
  insertAtLineStart('- [ ] ')
}

const formatActions = [
  { icon: 'B', title: 'Negrita (Ctrl+B)', action: () => insertFormat('**', '**', 'texto') },
  { icon: 'I', title: 'Cursiva (Ctrl+I)', action: () => insertFormat('*', '*', 'texto'), italic: true },
  { icon: 'S', title: 'Tachado', action: () => insertFormat('~~', '~~', 'texto'), strike: true },
  { type: 'divider' },
  { icon: 'H1', title: 'Heading 1', action: () => insertAtLineStart('# ') },
  { icon: 'H2', title: 'Heading 2', action: () => insertAtLineStart('## ') },
  { icon: 'H3', title: 'Heading 3', action: () => insertAtLineStart('### ') },
  { type: 'divider' },
  { icon: 'list', title: 'Lista', action: () => insertAtLineStart('- ') },
  { icon: 'list-ol', title: 'Lista numerada', action: () => insertAtLineStart('1. ') },
  { icon: 'checkbox', title: 'Checkbox', action: insertCheckbox },
  { type: 'divider' },
  { icon: 'code', title: 'Codigo inline', action: () => insertFormat('`', '`', 'codigo') },
  { icon: 'code-block', title: 'Bloque de codigo', action: () => insertFormat('\n```\n', '\n```\n', 'codigo') },
  { icon: 'quote', title: 'Cita', action: () => insertAtLineStart('> ') },
  { type: 'divider' },
  { icon: 'link', title: 'Enlace (Ctrl+K)', action: insertLink },
  { icon: 'image', title: 'Imagen', action: insertImage },
  { icon: 'table', title: 'Tabla', action: insertTable },
  { icon: 'hr', title: 'Linea horizontal', action: insertHorizontalRule },
]

function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault()
        insertFormat('**', '**', 'texto')
        break
      case 'i':
        e.preventDefault()
        insertFormat('*', '*', 'texto')
        break
      case 'k':
        e.preventDefault()
        insertLink()
        break
      case 'f':
        e.preventDefault()
        showSearch.value = !showSearch.value
        if (showSearch.value) {
          nextTick(() => searchInput.value?.focus())
        }
        break
    }
  }
  if (e.key === 'Escape') {
    showSearch.value = false
  }
}

function handleEditorScroll() {
  if (!syncScroll.value || isScrolling.value || viewMode.value !== 'split') return

  isScrolling.value = true
  const editor = editorRef.value
  const preview = previewRef.value

  if (editor && preview) {
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
  }

  setTimeout(() => { isScrolling.value = false }, 50)
}

function goToLine(lineIndex) {
  const ta = editorRef.value
  if (!ta) return

  const lines = markdown.value.split('\n')
  let pos = 0
  for (let i = 0; i < lineIndex; i++) {
    pos += lines[i].length + 1
  }

  ta.focus()
  ta.setSelectionRange(pos, pos)

  // Scroll to line
  const lineHeight = 24
  ta.scrollTop = lineIndex * lineHeight - ta.clientHeight / 2
}

function replaceNext() {
  if (!searchQuery.value || searchMatches.value.length === 0) return

  const ta = editorRef.value
  const start = ta.selectionStart

  // Find next match after cursor
  const match = searchMatches.value.find(m => m.start >= start) || searchMatches.value[0]

  markdown.value = markdown.value.substring(0, match.start) + replaceQuery.value + markdown.value.substring(match.end)

  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(match.start + replaceQuery.value.length, match.start + replaceQuery.value.length)
  })
}

function replaceAll() {
  if (!searchQuery.value) return
  const regex = new RegExp(searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  markdown.value = markdown.value.replace(regex, replaceQuery.value)
}

// Drag resize
function startDrag(e) {
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (!isDragging.value) return
  const container = document.querySelector('.editor-container')
  if (!container) return

  const rect = container.getBoundingClientRect()
  const newRatio = ((e.clientX - rect.left) / rect.width) * 100
  splitRatio.value = Math.max(20, Math.min(80, newRatio))
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// File handling
async function openFile() {
  fileInput.value?.click()
}

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!file.name.match(/\.(md|markdown|txt)$/i)) {
    alert('Por favor selecciona un archivo Markdown (.md) o texto (.txt)')
    return
  }

  try {
    markdown.value = await file.text()
  } catch (err) {
    console.error('Error al leer archivo:', err)
    alert('Error al leer el archivo')
  }
  e.target.value = ''
}

function downloadMarkdown() {
  const blob = new Blob([markdown.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'documento.md'
  a.click()
  URL.revokeObjectURL(url)
}

function downloadHTML() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento Markdown</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; color: #333; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; color: #111; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', Monaco, monospace; font-size: 0.9em; }
    pre { background: #f8f8f8; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #e5e5e5; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #10b981; padding-left: 1em; margin-left: 0; color: #666; background: #f9fafb; padding: 1em; border-radius: 0 8px 8px 0; }
    a { color: #10b981; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #e5e5e5; padding: 12px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    img { max-width: 100%; border-radius: 8px; }
    hr { border: none; border-top: 2px solid #e5e5e5; margin: 2em 0; }
    input[type="checkbox"] { margin-right: 8px; }
  </style>
</head>
<body>
  ${preview.value}
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'documento.html'
  a.click()
  URL.revokeObjectURL(url)
}

async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(markdown.value)
  } catch (err) {
    console.error(err)
  }
}

function clearAll() {
  if (confirm('Limpiar todo el contenido?')) {
    markdown.value = ''
  }
}

const getDocumentData = () => ({ content: markdown.value })
const loadDocument = (data) => { markdown.value = data.content || '' }

// Lifecycle
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="h-full flex flex-col app-bg">
    <!-- Toolbar -->
    <div class="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-0.5 shrink-0">
      <!-- File actions -->
      <div class="flex items-center gap-0.5 pr-2 border-r border-neutral-700/50">
        <button @click="openFile" class="md-toolbar-btn" title="Abrir archivo">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </button>
        <button @click="copyMarkdown" class="md-toolbar-btn" title="Copiar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
        <button @click="downloadMarkdown" class="md-toolbar-btn text-emerald-400" title="Descargar .md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        </button>
        <button @click="downloadHTML" class="md-toolbar-btn" title="Descargar .html">
          <span class="text-[10px] font-medium">HTML</span>
        </button>
      </div>

      <!-- Format actions -->
      <div class="flex items-center gap-0.5 px-2 border-r border-neutral-700/50 overflow-x-auto">
        <template v-for="(action, i) in formatActions" :key="i">
          <div v-if="action.type === 'divider'" class="w-px h-4 bg-neutral-700/50 mx-0.5"></div>
          <button v-else @click="action.action" class="md-toolbar-btn" :title="action.title">
            <span v-if="action.icon === 'B'" class="font-bold text-xs">B</span>
            <span v-else-if="action.icon === 'I'" class="italic text-xs">I</span>
            <span v-else-if="action.icon === 'S'" class="line-through text-xs">S</span>
            <span v-else-if="action.icon.startsWith('H')" class="text-[10px] font-bold">{{ action.icon }}</span>
            <svg v-else-if="action.icon === 'list'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else-if="action.icon === 'list-ol'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01"/>
            </svg>
            <svg v-else-if="action.icon === 'checkbox'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <svg v-else-if="action.icon === 'code'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
            <span v-else-if="action.icon === 'code-block'" class="text-[9px] font-mono">{}</span>
            <svg v-else-if="action.icon === 'quote'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            <svg v-else-if="action.icon === 'link'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            <svg v-else-if="action.icon === 'image'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <svg v-else-if="action.icon === 'table'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span v-else-if="action.icon === 'hr'" class="w-4 h-0.5 bg-current rounded"></span>
          </button>
        </template>
      </div>

      <!-- View mode -->
      <div class="flex items-center gap-0.5 px-2 border-r border-neutral-700/50">
        <button
          @click="viewMode = 'editor'"
          :class="['md-toolbar-btn', viewMode === 'editor' && 'bg-neutral-700 text-white']"
          title="Solo editor"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button
          @click="viewMode = 'split'"
          :class="['md-toolbar-btn', viewMode === 'split' && 'bg-neutral-700 text-white']"
          title="Vista dividida"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
          </svg>
        </button>
        <button
          @click="viewMode = 'preview'"
          :class="['md-toolbar-btn', viewMode === 'preview' && 'bg-neutral-700 text-white']"
          title="Solo preview"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </button>
      </div>

      <!-- Toggle options -->
      <div class="flex items-center gap-0.5 px-2">
        <button
          @click="showOutline = !showOutline"
          :class="['md-toolbar-btn', showOutline && 'bg-neutral-700 text-white']"
          title="Mostrar outline"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
        </button>
        <button
          @click="syncScroll = !syncScroll"
          :class="['md-toolbar-btn', syncScroll && 'bg-neutral-700 text-white']"
          title="Sync scroll"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        </button>
        <button
          @click="showSearch = !showSearch"
          :class="['md-toolbar-btn', showSearch && 'bg-neutral-700 text-white']"
          title="Buscar (Ctrl+F)"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </button>
        <button @click="clearAll" class="md-toolbar-btn text-red-400 hover:text-red-300" title="Limpiar">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>

      <!-- Vault save/load -->
      <div class="ml-auto">
        <VaultSaveLoad storeName="markdown-documents" :getData="getDocumentData" label="documento" @load="loadDocument" />
      </div>
    </div>

    <!-- Search bar -->
    <Transition name="slide">
      <div v-if="showSearch" class="h-10 bg-neutral-900/80 border-b border-neutral-800 flex items-center px-3 gap-2">
        <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Buscar..."
          class="flex-1 max-w-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
        />
        <input
          v-model="replaceQuery"
          type="text"
          placeholder="Reemplazar..."
          class="flex-1 max-w-xs bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
        />
        <button @click="replaceNext" class="px-2 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded">
          Siguiente
        </button>
        <button @click="replaceAll" class="px-2 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded">
          Todos
        </button>
        <span class="text-xs text-neutral-500">{{ searchMatches.length }} resultados</span>
        <button @click="showSearch = false" class="p-1 text-neutral-500 hover:text-white">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Outline sidebar -->
      <Transition name="slide-left">
        <div v-if="showOutline && outline.length > 0" class="w-52 bg-neutral-900/50 border-r border-neutral-800 overflow-y-auto shrink-0">
          <div class="px-3 py-2 border-b border-neutral-800">
            <span class="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Outline</span>
          </div>
          <div class="py-1">
            <button
              v-for="(heading, i) in outline"
              :key="i"
              @click="goToLine(heading.line)"
              class="w-full text-left px-3 py-1.5 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/50 truncate transition-colors"
              :style="{ paddingLeft: `${8 + (heading.level - 1) * 12}px` }"
            >
              {{ heading.text }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- Editor container -->
      <div class="flex-1 flex editor-container overflow-hidden">
        <!-- Editor pane -->
        <div
          v-show="viewMode !== 'preview'"
          class="flex flex-col overflow-hidden bg-neutral-950"
          :style="viewMode === 'split' ? { width: `${splitRatio}%` } : { width: '100%' }"
        >
          <div class="px-3 py-1.5 border-b border-neutral-800 bg-neutral-900/30 flex items-center justify-between">
            <span class="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Editor</span>
            <span class="text-[10px] text-neutral-600">Linea {{ stats.lines }}</span>
          </div>
          <div class="flex-1 flex overflow-hidden">
            <!-- Line numbers -->
            <div class="w-10 bg-neutral-900/30 border-r border-neutral-800/50 py-4 overflow-hidden select-none">
              <div class="text-right pr-2 font-mono text-[11px] text-neutral-600 leading-6">
                <div v-for="num in lineNumbers" :key="num">{{ num }}</div>
              </div>
            </div>
            <!-- Textarea -->
            <textarea
              ref="editorRef"
              v-model="markdown"
              @scroll="handleEditorScroll"
              class="flex-1 p-4 bg-transparent text-neutral-100 font-mono text-sm leading-6 resize-none focus:outline-none"
              placeholder="Escribe tu Markdown aqui..."
              spellcheck="false"
            ></textarea>
          </div>
        </div>

        <!-- Resize handle -->
        <div
          v-if="viewMode === 'split'"
          @mousedown="startDrag"
          class="w-1 bg-neutral-800 hover:bg-emerald-500/50 cursor-col-resize transition-colors shrink-0"
        ></div>

        <!-- Preview pane -->
        <div
          v-show="viewMode !== 'editor'"
          class="flex flex-col overflow-hidden bg-neutral-950"
          :style="viewMode === 'split' ? { width: `${100 - splitRatio}%` } : { width: '100%' }"
        >
          <div class="px-3 py-1.5 border-b border-neutral-800 bg-neutral-900/30">
            <span class="text-[10px] font-medium text-neutral-500 uppercase tracking-wide">Preview</span>
          </div>
          <div ref="previewRef" class="flex-1 p-6 overflow-y-auto prose-container">
            <div class="prose prose-invert max-w-none" v-html="preview"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status bar -->
    <div class="h-6 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between px-3 text-[10px] text-neutral-500 shrink-0">
      <div class="flex items-center gap-4">
        <span>{{ stats.words }} palabras</span>
        <span>{{ stats.chars }} caracteres</span>
        <span>{{ stats.lines }} lineas</span>
        <span>~{{ stats.readTime }} min lectura</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-neutral-600">Markdown</span>
        <span class="text-emerald-500">GFM</span>
      </div>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" accept=".md,.markdown,.txt" class="hidden" @change="handleFileSelect" />
  </div>
</template>

<style scoped>

/* Prose styles */
:deep(.prose) {
  color: #d1d5db;
  line-height: 1.7;
  font-size: 15px;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  color: #22c55e;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

:deep(.prose h1) { font-size: 2em; border-bottom: 1px solid rgba(34, 197, 94, 0.2); padding-bottom: 0.3em; }
:deep(.prose h2) { font-size: 1.5em; }
:deep(.prose h3) { font-size: 1.25em; }
:deep(.prose h4) { font-size: 1.1em; }

:deep(.prose strong) { color: #f3f4f6; font-weight: 600; }
:deep(.prose em) { color: #e5e7eb; }

:deep(.prose code) {
  background: rgba(34, 197, 94, 0.1);
  color: #7dd3fc;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

:deep(.prose pre) {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(34, 197, 94, 0.15);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5em 0;
}

:deep(.prose pre code) {
  background: none;
  color: #a5f3fc;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.6;
}

:deep(.prose blockquote) {
  border-left: 4px solid #22c55e;
  color: #9ca3af;
  padding: 0.5em 1em;
  margin: 1.5em 0;
  background: rgba(34, 197, 94, 0.05);
  border-radius: 0 8px 8px 0;
}

:deep(.prose blockquote p) {
  margin: 0.5em 0;
}

:deep(.prose a) {
  color: #22c55e;
  text-decoration: none;
  border-bottom: 1px solid rgba(34, 197, 94, 0.3);
  transition: border-color 0.2s;
}

:deep(.prose a:hover) {
  border-bottom-color: #22c55e;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin: 1em 0;
  padding-left: 1.5em;
}

:deep(.prose ul) { list-style-type: disc; }
:deep(.prose ol) { list-style-type: decimal; }

:deep(.prose li) {
  margin: 0.4em 0;
}

:deep(.prose li > ul),
:deep(.prose li > ol) {
  margin: 0.3em 0;
}

:deep(.prose hr) {
  border: none;
  border-top: 2px solid rgba(34, 197, 94, 0.15);
  margin: 2em 0;
}

:deep(.prose p) {
  margin: 1em 0;
}

:deep(.prose table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
}

:deep(.prose th),
:deep(.prose td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75em 1em;
  text-align: left;
}

:deep(.prose th) {
  background: rgba(34, 197, 94, 0.1);
  font-weight: 600;
  color: #22c55e;
}

:deep(.prose tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.02);
}

:deep(.prose img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 1.5em 0;
}

:deep(.prose input[type="checkbox"]) {
  margin-right: 0.5em;
  accent-color: #22c55e;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.2s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
