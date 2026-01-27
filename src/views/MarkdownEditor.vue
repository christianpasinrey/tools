<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useDevice } from '../composables/useDevice'

const { isMobile } = useDevice()

// Modo móvil: 'edit' o 'preview'
const mobileMode = ref('edit')

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

¡Comienza a escribir! 🎨
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
    // Feedback visual (opcional)
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

const clearMarkdown = () => {
  if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
    markdown.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-950 relative overflow-x-hidden" style="z-index: 1;">
    <!-- Background Glows -->
    <div class="fixed top-20 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" style="z-index: 0;"></div>
    <div class="fixed bottom-40 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] animate-float pointer-events-none" style="z-index: 0;"></div>

    <!-- Header -->
    <div class="sticky top-0 z-50 border-b border-neutral-800/30 bg-gradient-to-b from-neutral-950 to-neutral-950/90 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-3">
          <svg class="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2m-2 11l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M9 12h4" />
          </svg>
          <h1 class="text-lg sm:text-2xl font-bold text-white">Markdown</h1>
        </div>
        <!-- Desktop buttons -->
        <div class="hidden sm:flex gap-3 items-center">
          <button
            @click="copyMarkdown"
            class="group px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300"
            title="Copiar Markdown"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copiar
            </span>
          </button>
          <button
            @click="downloadMarkdown"
            class="group px-4 py-2 text-sm font-medium rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300"
            title="Descargar como .md"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-4-2m4 2l4-2" /></svg>
              MD
            </span>
          </button>
          <button
            @click="downloadHTML"
            class="group px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300"
            title="Descargar como .html"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              HTML
            </span>
          </button>
          <button
            @click="clearMarkdown"
            class="group px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300"
            title="Limpiar todo"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Limpiar
            </span>
          </button>
        </div>
        <!-- Mobile buttons (icon only) -->
        <div class="flex sm:hidden gap-2 items-center">
          <button
            @click="copyMarkdown"
            class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            title="Copiar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          <button
            @click="downloadMarkdown"
            class="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400"
            title="Descargar MD"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
          <button
            @click="clearMarkdown"
            class="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
            title="Limpiar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Mode Toggle -->
    <div v-if="isMobile" class="sticky top-[73px] z-40 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800/30 px-4 py-3">
      <div class="flex gap-2 justify-center">
        <button
          @click="mobileMode = 'edit'"
          :class="[
            'flex-1 max-w-[150px] px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
            mobileMode === 'edit'
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              : 'bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:bg-neutral-800'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </span>
        </button>
        <button
          @click="mobileMode = 'preview'"
          :class="[
            'flex-1 max-w-[150px] px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
            mobileMode === 'preview'
              ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
              : 'bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 hover:bg-neutral-800'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative max-w-7xl mx-auto px-6 py-10" style="z-index: 1;">
      <!-- Desktop: Side by side -->
      <div v-if="!isMobile" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Editor -->
        <div class="flex flex-col">
          <label class="text-sm font-semibold text-neutral-300 mb-3 uppercase tracking-wide">Editor</label>
          <textarea
            v-model="markdown"
            class="flex-1 min-h-[600px] p-6 bg-neutral-900/40 border border-neutral-800/50 rounded-xl text-neutral-100 font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 backdrop-blur-sm transition-all duration-300"
            placeholder="Escribe tu Markdown aquí..."
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Preview -->
        <div class="flex flex-col">
          <label class="text-sm font-semibold text-neutral-300 mb-3 uppercase tracking-wide">Preview</label>
          <div class="flex-1 p-6 bg-neutral-900/40 border border-neutral-800/50 rounded-xl overflow-auto backdrop-blur-sm prose-dark scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
            <div class="prose prose-invert max-w-none" v-html="preview"></div>
          </div>
        </div>
      </div>

      <!-- Mobile: Toggle between edit and preview -->
      <div v-else class="flex flex-col">
        <!-- Editor (Mobile) -->
        <div v-if="mobileMode === 'edit'" class="flex flex-col">
          <textarea
            v-model="markdown"
            class="flex-1 min-h-[calc(100vh-220px)] p-4 bg-neutral-900/40 border border-neutral-800/50 rounded-xl text-neutral-100 font-mono text-sm resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 backdrop-blur-sm transition-all duration-300"
            placeholder="Escribe tu Markdown aquí..."
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Preview (Mobile) -->
        <div v-else class="flex flex-col">
          <div class="flex-1 min-h-[calc(100vh-220px)] p-4 bg-neutral-900/40 border border-neutral-800/50 rounded-xl overflow-auto backdrop-blur-sm prose-dark scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
            <div class="prose prose-invert max-w-none" v-html="preview"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos para el prose */
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

:deep(.prose h1) {
  font-size: 1.875em;
}

:deep(.prose h2) {
  font-size: 1.5em;
}

:deep(.prose h3) {
  font-size: 1.25em;
}

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
  font-family: 'Monaco', 'Menlo', monospace;
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
  text-decoration: underline;
}

:deep(.prose ul) {
  margin: 1em 0;
  padding-left: 2em;
  list-style-type: disc;
}

:deep(.prose ol) {
  margin: 1em 0;
  padding-left: 2em;
  list-style-type: decimal;
}

:deep(.prose li) {
  margin: 0.5em 0;
  color: #d1d5db;
}

:deep(.prose ul li) {
  list-style-type: disc;
}

:deep(.prose ol li) {
  list-style-type: decimal;
}

:deep(.prose hr) {
  border: none;
  border-top: 1px solid rgba(34, 197, 94, 0.2);
  margin: 2em 0;
}

:deep(.prose p) {
  margin: 0.75em 0;
}

:deep(.prose > *:first-child) {
  margin-top: 0;
}

:deep(.prose > *:last-child) {
  margin-bottom: 0;
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-20px) translateX(10px);
  }
  50% {
    transform: translateY(-10px) translateX(-10px);
  }
  75% {
    transform: translateY(-30px) translateX(5px);
  }
}

:deep(.animate-pulse-slow) {
  animation: pulse-slow 8s ease-in-out infinite;
}

:deep(.animate-float) {
  animation: float 12s ease-in-out infinite;
}
</style>
