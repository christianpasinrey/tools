import { ref, computed, watch } from 'vue'
import * as yaml from 'js-yaml'

export function useDevTools() {
  // ==========================================
  // Estado General
  // ==========================================
  const activeTab = ref('json')
  const themeColor = ref('#06b6d4')

  // ==========================================
  // JSON Tools State
  // ==========================================
  const jsonInput = ref('')
  const jsonOutput = ref('')
  const jsonError = ref(null)

  // ==========================================
  // JSON Methods
  // ==========================================
  const formatJson = () => {
    jsonError.value = null
    try {
      const parsed = JSON.parse(jsonInput.value)
      jsonOutput.value = JSON.stringify(parsed, null, 2)
    } catch (e) {
      jsonError.value = `Error de sintaxis: ${e.message}`
      jsonOutput.value = ''
    }
  }

  const minifyJson = () => {
    jsonError.value = null
    try {
      const parsed = JSON.parse(jsonInput.value)
      jsonOutput.value = JSON.stringify(parsed)
    } catch (e) {
      jsonError.value = `Error de sintaxis: ${e.message}`
      jsonOutput.value = ''
    }
  }

  const validateJson = () => {
    jsonError.value = null
    jsonOutput.value = ''
    try {
      JSON.parse(jsonInput.value)
      jsonOutput.value = '✓ JSON válido'
    } catch (e) {
      jsonError.value = `JSON inválido: ${e.message}`
    }
  }

  const jsonToYaml = () => {
    jsonError.value = null
    try {
      const parsed = JSON.parse(jsonInput.value)
      jsonOutput.value = yaml.dump(parsed, { indent: 2 })
    } catch (e) {
      jsonError.value = `Error: ${e.message}`
      jsonOutput.value = ''
    }
  }

  const yamlToJson = () => {
    jsonError.value = null
    try {
      const parsed = yaml.load(jsonInput.value)
      jsonOutput.value = JSON.stringify(parsed, null, 2)
    } catch (e) {
      jsonError.value = `Error YAML: ${e.message}`
      jsonOutput.value = ''
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      console.error('Failed to copy:', e)
      return false
    }
  }

  const clearJson = () => {
    jsonInput.value = ''
    jsonOutput.value = ''
    jsonError.value = null
  }

  // ==========================================
  // HTML Playground State
  // ==========================================
  const htmlCode = ref('<h1>Hello World</h1>\n<p>Start coding!</p>')
  const cssCode = ref('body {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n  background: #1a1a2e;\n  color: #eee;\n}\n\nh1 {\n  color: #06b6d4;\n}')
  const jsCode = ref('console.log("Hello from JS!");')
  const consoleOutput = ref([])
  const autoRun = ref(true)
  const previewKey = ref(0)

  // Templates
  const templates = {
    basic: {
      html: '<h1>Hello World</h1>\n<p>Start coding!</p>',
      css: 'body {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n  background: #1a1a2e;\n  color: #eee;\n}\n\nh1 {\n  color: #06b6d4;\n}',
      js: 'console.log("Hello from JS!");'
    },
    bootstrap: {
      html: '<div class="container py-5">\n  <h1 class="text-primary">Bootstrap 5</h1>\n  <p class="lead">Ready to use!</p>\n  <button class="btn btn-primary">Click me</button>\n</div>',
      css: '/* Bootstrap loaded via CDN */\nbody {\n  background: #212529;\n}',
      js: 'document.querySelector(".btn").addEventListener("click", () => {\n  alert("Button clicked!");\n});'
    },
    tailwind: {
      html: '<div class="min-h-screen bg-gray-900 flex items-center justify-center">\n  <div class="text-center">\n    <h1 class="text-4xl font-bold text-cyan-400 mb-4">Tailwind CSS</h1>\n    <p class="text-gray-300">Ready to use!</p>\n    <button class="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition">\n      Click me\n    </button>\n  </div>\n</div>',
      css: '/* Tailwind loaded via CDN */\n/* Add custom styles here */',
      js: 'document.querySelector("button").addEventListener("click", () => {\n  alert("Button clicked!");\n});'
    }
  }

  const loadTemplate = (name) => {
    const template = templates[name]
    if (template) {
      htmlCode.value = template.html
      cssCode.value = template.css
      jsCode.value = template.js
      consoleOutput.value = []
      previewKey.value++
    }
  }

  const generatePreviewHtml = () => {
    const isBootstrap = cssCode.value.includes('Bootstrap loaded via CDN')
    const isTailwind = cssCode.value.includes('Tailwind loaded via CDN')

    let cdnLinks = ''
    if (isBootstrap) {
      cdnLinks = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">'
    } else if (isTailwind) {
      cdnLinks = '<script src="https://cdn.tailwindcss.com"></script>'
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${cdnLinks}
  <style>${cssCode.value}</style>
</head>
<body>
  ${htmlCode.value}
  <script>
    // Console capture
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
      ${jsCode.value}
    } catch (e) {
      console.error(e.message);
    }
  </script>
</body>
</html>`
  }

  const runCode = () => {
    consoleOutput.value = []
    previewKey.value++
  }

  const clearPlayground = () => {
    htmlCode.value = ''
    cssCode.value = ''
    jsCode.value = ''
    consoleOutput.value = []
    previewKey.value++
  }

  const addConsoleMessage = (method, args) => {
    consoleOutput.value.push({
      type: method,
      content: args.join(' '),
      timestamp: new Date().toLocaleTimeString()
    })
  }

  const clearConsole = () => {
    consoleOutput.value = []
  }

  // ==========================================
  // Theme
  // ==========================================
  const setThemeColor = (color) => {
    themeColor.value = color
  }

  return {
    // State
    activeTab,
    themeColor,

    // JSON
    jsonInput,
    jsonOutput,
    jsonError,

    // JSON Methods
    formatJson,
    minifyJson,
    validateJson,
    jsonToYaml,
    yamlToJson,
    copyToClipboard,
    clearJson,

    // Playground State
    htmlCode,
    cssCode,
    jsCode,
    consoleOutput,
    autoRun,
    previewKey,

    // Playground Methods
    loadTemplate,
    generatePreviewHtml,
    runCode,
    clearPlayground,
    addConsoleMessage,
    clearConsole,

    // Theme
    setThemeColor
  }
}
