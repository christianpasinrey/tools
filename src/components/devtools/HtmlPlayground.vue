<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  htmlCode: String,
  cssCode: String,
  jsCode: String,
  consoleOutput: Array,
  autoRun: Boolean,
  previewKey: Number,
  themeColor: String
})

const emit = defineEmits([
  'update:htmlCode',
  'update:cssCode',
  'update:jsCode',
  'update:autoRun',
  'run',
  'clear',
  'clear-console',
  'console-message',
  'load-template'
])

const showTemplates = ref(false)
const iframeSrc = ref('about:blank')
let debounceTimer = null
let currentBlobUrl = null

// Resizable panels state
const editorContainerRef = ref(null)
const previewContainerRef = ref(null)
const htmlWidth = ref(33.33)
const cssWidth = ref(33.33)
const jsWidth = computed(() => 100 - htmlWidth.value - cssWidth.value)
const editorsHeight = ref(35) // percentage of main area
const consoleHeight = ref(25) // percentage of main area
const previewHeight = computed(() => 100 - editorsHeight.value - consoleHeight.value)

let isResizing = ref(false)
let resizeType = ref(null) // 'html-css', 'css-js', 'editors-preview', 'preview-console'
let startX = 0
let startY = 0
let startWidth1 = 0
let startWidth2 = 0
let startHeight1 = 0
let startHeight2 = 0

const startHorizontalResize = (type, event) => {
  isResizing.value = true
  resizeType.value = type
  startX = event.clientX

  if (type === 'html-css') {
    startWidth1 = htmlWidth.value
    startWidth2 = cssWidth.value
  } else if (type === 'css-js') {
    startWidth1 = cssWidth.value
    startWidth2 = jsWidth.value
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

const startVerticalResize = (type, event) => {
  isResizing.value = true
  resizeType.value = type
  startY = event.clientY

  if (type === 'editors-preview') {
    startHeight1 = editorsHeight.value
    startHeight2 = previewHeight.value
  } else if (type === 'preview-console') {
    startHeight1 = previewHeight.value
    startHeight2 = consoleHeight.value
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

const handleMouseMove = (event) => {
  if (!isResizing.value) return

  if (resizeType.value === 'html-css' || resizeType.value === 'css-js') {
    const container = editorContainerRef.value
    if (!container) return

    const containerWidth = container.offsetWidth
    const deltaX = event.clientX - startX
    const deltaPercent = (deltaX / containerWidth) * 100

    if (resizeType.value === 'html-css') {
      const newHtmlWidth = Math.max(10, Math.min(80 - cssWidth.value, startWidth1 + deltaPercent))
      htmlWidth.value = newHtmlWidth
    } else if (resizeType.value === 'css-js') {
      const newCssWidth = Math.max(10, Math.min(80 - htmlWidth.value, startWidth1 + deltaPercent))
      cssWidth.value = newCssWidth
    }
  } else if (resizeType.value === 'editors-preview' || resizeType.value === 'preview-console') {
    const container = previewContainerRef.value
    if (!container) return

    const containerHeight = container.offsetHeight
    const deltaY = event.clientY - startY
    const deltaPercent = (deltaY / containerHeight) * 100

    if (resizeType.value === 'editors-preview') {
      const newEditorsHeight = Math.max(15, Math.min(70, startHeight1 + deltaPercent))
      editorsHeight.value = newEditorsHeight
    } else if (resizeType.value === 'preview-console') {
      const newPreviewHeight = startHeight1 + deltaPercent
      const newConsoleHeight = startHeight2 - deltaPercent
      if (newPreviewHeight >= 15 && newConsoleHeight >= 10) {
        // No need to set anything, the heights are computed
        // We need to adjust editorsHeight or consoleHeight
        consoleHeight.value = Math.max(10, Math.min(50, startHeight2 - deltaPercent))
      }
    }
  }
}

const stopResize = () => {
  isResizing.value = false
  resizeType.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

const templates = [
  { id: 'basic', name: 'Basic', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'bootstrap', name: 'Bootstrap 5', icon: 'M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z' },
  { id: 'tailwind', name: 'Tailwind CSS', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 7l9-5-9-5-9 5 9 5z' }
]

const updatePreview = () => {
  // Limpiar blob URL anterior para evitar memory leaks
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
  }

  const html = generateHtml()
  const blob = new Blob([html], { type: 'text/html' })
  currentBlobUrl = URL.createObjectURL(blob)
  iframeSrc.value = currentBlobUrl
}

const generateHtml = () => {
  const isBootstrap = props.cssCode.includes('Bootstrap loaded via CDN')
  const isTailwind = props.cssCode.includes('Tailwind loaded via CDN')

  let cdnLinks = ''
  if (isBootstrap) {
    cdnLinks = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">'
  } else if (isTailwind) {
    cdnLinks = '<script src="https://cdn.tailwindcss.com"><\/script>'
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${cdnLinks}
  <style>${props.cssCode}</style>
</head>
<body>
  ${props.htmlCode}
  <script>
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    const sendToParent = (type, args) => {
      window.parent.postMessage({
        type: 'console',
        method: type,
        args: args.map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          } catch (e) {
            return String(arg)
          }
        })
      }, '*');
    };

    console.log = (...args) => { originalConsole.log(...args); sendToParent('log', args); };
    console.error = (...args) => { originalConsole.error(...args); sendToParent('error', args); };
    console.warn = (...args) => { originalConsole.warn(...args); sendToParent('warn', args); };
    console.info = (...args) => { originalConsole.info(...args); sendToParent('info', args); };

    window.onerror = (msg, url, line, col, error) => {
      sendToParent('error', [\`Error: \${msg} (line \${line})\`]);
      return false;
    };

    try {
      ${props.jsCode}
    } catch (e) {
      console.error(e.message);
    }
  <\/script>
</body>
</html>`
}

const handleMessage = (event) => {
  // Validar que el mensaje viene del iframe (blob: URL tiene origen 'null')
  if (event.origin !== 'null' && !event.origin.startsWith('blob:')) {
    return
  }
  if (event.data && event.data.type === 'console') {
    emit('console-message', event.data.method, event.data.args)
  }
}

const debouncedUpdate = () => {
  if (props.autoRun) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      updatePreview()
    }, 500)
  }
}

watch(() => props.previewKey, () => {
  updatePreview()
})

watch([() => props.htmlCode, () => props.cssCode, () => props.jsCode], () => {
  debouncedUpdate()
})

onMounted(() => {
  window.addEventListener('message', handleMessage)
  updatePreview()
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  clearTimeout(debounceTimer)
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl)
  }
})

const consoleTypeStyles = {
  log: 'text-neutral-300',
  error: 'text-red-400',
  warn: 'text-amber-400',
  info: 'text-cyan-400'
}
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-2 select-none" :class="{ 'cursor-col-resize': resizeType === 'html-css' || resizeType === 'css-js', 'cursor-row-resize': resizeType === 'editors-preview' || resizeType === 'preview-console' }">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 flex-wrap shrink-0">
      <button
        @click="emit('run')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white transition-colors"
        :style="{ backgroundColor: themeColor }"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Run
      </button>

      <button
        @click="emit('clear')"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Clear
      </button>

      <div class="relative">
        <button
          @click="showTemplates = !showTemplates"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
          </svg>
          Templates
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>

        <div
          v-if="showTemplates"
          class="absolute left-0 top-full mt-1 py-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 min-w-[140px]"
        >
          <button
            v-for="template in templates"
            :key="template.id"
            @click="emit('load-template', template.id); showTemplates = false"
            class="w-full flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            {{ template.name }}
          </button>
        </div>
      </div>

      <div class="flex-1"></div>

      <label class="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
        <input
          type="checkbox"
          :checked="autoRun"
          @change="emit('update:autoRun', $event.target.checked)"
          class="rounded border-neutral-600 bg-neutral-800 text-cyan-500 focus:ring-cyan-500/50"
        />
        Auto-run
      </label>
    </div>

    <!-- Main content area -->
    <div ref="previewContainerRef" class="flex-1 min-h-0 flex flex-col">
      <!-- Editors Row -->
      <div
        ref="editorContainerRef"
        class="flex shrink-0"
        :style="{ height: editorsHeight + '%' }"
      >
        <!-- HTML Editor -->
        <div class="flex flex-col min-w-0" :style="{ width: htmlWidth + '%' }">
          <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 px-1 py-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-orange-500"></span>
            HTML
          </label>
          <textarea
            :value="htmlCode"
            @input="emit('update:htmlCode', $event.target.value)"
            class="flex-1 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-cyan-500/50"
            placeholder="<h1>Hello</h1>"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Resizer HTML-CSS -->
        <div
          class="w-2 shrink-0 cursor-col-resize flex items-center justify-center group hover:bg-cyan-500/10 transition-colors"
          @mousedown="startHorizontalResize('html-css', $event)"
        >
          <div class="w-0.5 h-8 bg-neutral-700 group-hover:bg-cyan-500 rounded-full transition-colors"></div>
        </div>

        <!-- CSS Editor -->
        <div class="flex flex-col min-w-0" :style="{ width: cssWidth + '%' }">
          <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 px-1 py-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            CSS
          </label>
          <textarea
            :value="cssCode"
            @input="emit('update:cssCode', $event.target.value)"
            class="flex-1 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-cyan-500/50"
            placeholder="body { color: white; }"
            spellcheck="false"
          ></textarea>
        </div>

        <!-- Resizer CSS-JS -->
        <div
          class="w-2 shrink-0 cursor-col-resize flex items-center justify-center group hover:bg-cyan-500/10 transition-colors"
          @mousedown="startHorizontalResize('css-js', $event)"
        >
          <div class="w-0.5 h-8 bg-neutral-700 group-hover:bg-cyan-500 rounded-full transition-colors"></div>
        </div>

        <!-- JavaScript Editor -->
        <div class="flex flex-col min-w-0" :style="{ width: jsWidth + '%' }">
          <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 px-1 py-1.5 shrink-0">
            <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
            JavaScript
          </label>
          <textarea
            :value="jsCode"
            @input="emit('update:jsCode', $event.target.value)"
            class="flex-1 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 font-mono text-xs resize-none outline-none focus:ring-1 focus:ring-cyan-500/50"
            placeholder="console.log('Hello!');"
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- Resizer Editors-Preview -->
      <div
        class="h-2 shrink-0 cursor-row-resize flex items-center justify-center group hover:bg-cyan-500/10 transition-colors"
        @mousedown="startVerticalResize('editors-preview', $event)"
      >
        <div class="h-0.5 w-12 bg-neutral-700 group-hover:bg-cyan-500 rounded-full transition-colors"></div>
      </div>

      <!-- Preview -->
      <div
        class="bg-white rounded-lg overflow-hidden shrink-0"
        :style="{ height: previewHeight + '%' }"
      >
        <iframe
          :src="iframeSrc"
          class="w-full h-full border-0"
          sandbox="allow-scripts allow-modals allow-same-origin"
          title="Preview"
        ></iframe>
      </div>

      <!-- Resizer Preview-Console -->
      <div
        class="h-2 shrink-0 cursor-row-resize flex items-center justify-center group hover:bg-cyan-500/10 transition-colors"
        @mousedown="startVerticalResize('preview-console', $event)"
      >
        <div class="h-0.5 w-12 bg-neutral-700 group-hover:bg-cyan-500 rounded-full transition-colors"></div>
      </div>

      <!-- Console -->
      <div
        class="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col min-h-0"
        :style="{ height: consoleHeight + '%' }"
      >
        <div class="flex items-center justify-between px-3 py-1.5 bg-neutral-800/50 border-b border-neutral-800 shrink-0">
          <span class="text-xs text-neutral-500 font-medium">Console</span>
          <button
            @click="emit('clear-console')"
            class="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Clear
          </button>
        </div>
        <div class="flex-1 overflow-auto p-2 font-mono text-xs space-y-1">
          <div
            v-for="(log, index) in consoleOutput"
            :key="index"
            class="flex items-start gap-2"
            :class="consoleTypeStyles[log.type]"
          >
            <span class="text-neutral-600 shrink-0">{{ log.timestamp }}</span>
            <span class="whitespace-pre-wrap break-all">{{ log.content }}</span>
          </div>
          <div v-if="!consoleOutput.length" class="text-neutral-600 italic">
            Console output will appear here...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
