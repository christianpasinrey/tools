<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import VaultSaveLoad from '../common/VaultSaveLoad.vue'

defineProps({
  themeColor: {
    type: String,
    default: '#22c55e'
  }
})

const markdown = ref(`# Bienvenido al Editor de Markdown

## Prueba escribiendo aquí

Este editor soporta:

- **Negrita** con \`**texto**\`
- *Cursiva* con \`*texto*\`
- \`Código en línea\`
- [Enlaces](https://ejemplo.com)

### Listas numeradas

1. Primer elemento
2. Segundo elemento
3. Tercer elemento

### Bloques de código

\`\`\`javascript
const hola = "mundo";
console.log(hola);
\`\`\`

### Citas

> Esto es una cita interesante

---

`)

// Configurar marked
marked.setOptions({
  breaks: true,
  gfm: true
})

const preview = computed(() => {
  const html = marked(markdown.value)
  return DOMPurify.sanitize(html)
})

const copyMarkdown = async () => {
  try {
    await navigator.clipboard.writeText(markdown.value)
    alert('Markdown copiado al portapapeles')
  } catch (err) {
    console.error('Error al copiar:', err)
  }
}

const downloadMarkdown = () => {
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(markdown.value))
  element.setAttribute('download', 'documento.md')
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

const downloadHTML = () => {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento Markdown</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }
    h1, h2, h3 { margin-top: 1.5em; margin-bottom: 0.5em; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin-left: 0; color: #666; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  ${preview.value}
</body>
</html>`

  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(html))
  element.setAttribute('download', 'documento.html')
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

const getDocumentData = () => ({ content: markdown.value })

const loadDocument = (data) => {
  markdown.value = data.content || ''
}

const clearMarkdown = () => {
  if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
    markdown.value = ''
  }
}

const fileInput = ref(null)

const openFile = () => fileInput.value?.click()

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  if (!file.name.match(/\.(md|markdown|txt)$/i)) {
    alert('Por favor selecciona un archivo Markdown (.md) o texto (.txt)')
    return
  }

  try {
    const text = await file.text()
    markdown.value = text
  } catch (err) {
    console.error('Error al leer archivo:', err)
    alert('Error al leer el archivo')
  }

  e.target.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-950">
    <!-- Toolbar -->
    <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-2 gap-1 shrink-0">
      <div class="flex items-center gap-1 pr-2 border-r border-neutral-800">
        <button
          @click="openFile"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
          title="Abrir archivo Markdown"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <span>Abrir</span>
        </button>

        <button
          @click="copyMarkdown"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
          title="Copiar Markdown"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          <span>Copiar</span>
        </button>
      </div>

      <div class="flex items-center gap-1 pr-2 border-r border-neutral-800">
        <button
          @click="downloadMarkdown"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          title="Descargar como .md"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>MD</span>
        </button>

        <button
          @click="downloadHTML"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Descargar como .html"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          <span>HTML</span>
        </button>
      </div>

      <div class="flex items-center gap-1">
        <button
          @click="clearMarkdown"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
          title="Limpiar todo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          <span>Limpiar</span>
        </button>
      </div>

      <div class="ml-auto">
        <VaultSaveLoad storeName="markdown-documents" :getData="getDocumentData" label="documento" @load="loadDocument" />
      </div>
    </div>

    <!-- Editor and Preview -->
    <div class="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
      <!-- Editor -->
      <div class="flex flex-col border-r border-neutral-800">
        <div class="px-3 py-2 border-b border-neutral-800 bg-neutral-900/50">
          <span class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Editor</span>
        </div>
        <textarea
          v-model="markdown"
          class="flex-1 p-4 bg-neutral-950 text-neutral-100 font-mono text-sm resize-none focus:outline-none"
          placeholder="Escribe tu Markdown aquí..."
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Preview -->
      <div class="flex flex-col overflow-hidden">
        <div class="px-3 py-2 border-b border-neutral-800 bg-neutral-900/50">
          <span class="text-xs font-medium text-neutral-500 uppercase tracking-wide">Preview</span>
        </div>
        <div class="flex-1 p-4 overflow-auto prose-dark">
          <div class="prose prose-invert max-w-none" v-html="preview"></div>
        </div>
      </div>
    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept=".md,.markdown,.txt"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>

<style scoped>
/* Prose styles */
:deep(.prose) {
  color: #d1d5db;
  line-height: 1.6;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4) {
  color: #22c55e;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

:deep(.prose h1) { font-size: 1.875em; }
:deep(.prose h2) { font-size: 1.5em; }
:deep(.prose h3) { font-size: 1.25em; }

:deep(.prose strong) {
  color: #f3f4f6;
  font-weight: 600;
}

:deep(.prose em) {
  font-style: italic;
  color: #e5e7eb;
}

:deep(.prose code) {
  background: rgba(34, 197, 94, 0.1);
  color: #7dd3fc;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Monaco', 'Menlo', monospace;
}

:deep(.prose pre) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(34, 197, 94, 0.2);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

:deep(.prose pre code) {
  background: none;
  color: #7dd3fc;
  padding: 0;
}

:deep(.prose blockquote) {
  border-left: 4px solid #22c55e;
  color: #9ca3af;
  padding-left: 1em;
  margin-left: 0;
  margin-top: 1em;
  margin-bottom: 1em;
}

:deep(.prose a) {
  color: #22c55e;
  text-decoration: none;
  border-bottom: 1px solid rgba(34, 197, 94, 0.3);
}

:deep(.prose a:hover) {
  border-bottom-color: #22c55e;
}

:deep(.prose ul),
:deep(.prose ol) {
  margin: 1em 0;
  padding-left: 2em;
}

:deep(.prose ul) { list-style-type: disc; }
:deep(.prose ol) { list-style-type: decimal; }

:deep(.prose li) {
  margin: 0.5em 0;
  color: #d1d5db;
}

:deep(.prose hr) {
  border: none;
  border-top: 1px solid rgba(34, 197, 94, 0.2);
  margin: 2em 0;
}

:deep(.prose p) {
  margin: 0.75em 0;
}
</style>
