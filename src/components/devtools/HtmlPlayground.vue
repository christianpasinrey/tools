<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

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
const srcdocContent = ref('')
let debounceTimer = null

const templates = [
  { id: 'basic', name: 'Basic', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { id: 'bootstrap', name: 'Bootstrap 5', icon: 'M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z' },
  { id: 'tailwind', name: 'Tailwind CSS', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 7l9-5-9-5-9 5 9 5z' }
]

const updatePreview = () => {
  srcdocContent.value = generateHtml()
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
})

const consoleTypeStyles = {
  log: 'text-neutral-300',
  error: 'text-red-400',
  warn: 'text-amber-400',
  info: 'text-cyan-400'
}
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <div class="flex items-center gap-2 flex-wrap">
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

    <div class="grid grid-cols-3 gap-3 h-48">
      <div class="flex flex-col gap-1.5">
        <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
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

      <div class="flex flex-col gap-1.5">
        <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
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

      <div class="flex flex-col gap-1.5">
        <label class="text-neutral-500 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
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

    <div class="flex-1 min-h-0 grid grid-rows-[1fr,auto] gap-3">
      <div class="bg-white rounded-lg overflow-hidden">
        <iframe
          :srcdoc="srcdocContent"
          class="w-full h-full border-0"
          sandbox="allow-scripts allow-modals allow-same-origin"
          title="Preview"
        ></iframe>
      </div>

      <div class="h-32 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-3 py-1.5 bg-neutral-800/50 border-b border-neutral-800">
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
