import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { computeStats, extractOutline } from '@/lib/markdownEdit'

export const SAMPLE_MARKDOWN = `# Mi documento

Escribe a la izquierda y mira el resultado a la derecha. **Todo se guarda solo** en este navegador.

## Qué puedes usar

- **Negrita**, *cursiva* y ~~tachado~~
- [Enlaces](https://tools.tailor-bytes.com) e imágenes
- Listas de tareas:
  - [x] Escribir el borrador
  - [ ] Revisarlo

## Código

\`\`\`js
const saludo = (nombre) => \`Hola, \${nombre}\`
\`\`\`

## Tablas

| Herramienta | Categoría  |
|-------------|------------|
| Markdown    | Documentos |
| Kanban      | Apps       |

> Consejo: pulsa **Ctrl + F** para buscar y reemplazar.
`

// Borrador compartido entre el editor de escritorio y el móvil
const content = useStorage('tb:markdown:draft', SAMPLE_MARKDOWN, typeof localStorage !== 'undefined' ? localStorage : undefined, {
  onError: () => { /* sin almacenamiento: el texto vive solo en memoria */ }
})

marked.setOptions({ breaks: true, gfm: true })

function readText(file) {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function download(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

const EXPORT_CSS = `body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:760px;margin:0 auto;padding:48px 20px;line-height:1.7;color:#1c1a16;background:#fbf9f4}
h1,h2,h3,h4{line-height:1.25;margin:1.6em 0 .5em}h1{font-size:2.1em}a{color:#d63031}
code{background:#ece6da;padding:.1em .4em;border-radius:5px;font-size:.9em}
pre{background:#f3efe7;border:1px solid #e0d9cc;padding:14px 16px;border-radius:10px;overflow-x:auto}pre code{background:none;padding:0}
blockquote{margin:1.2em 0;padding:.6em 1em;border-left:3px solid #d63031;background:#f3efe7;border-radius:0 8px 8px 0}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #e0d9cc;padding:8px 12px;text-align:left}th{background:#f3efe7}
img{max-width:100%}hr{border:0;border-top:1px solid #e0d9cc;margin:2em 0}`

export function useMarkdownDocument() {
  const previewHtml = computed(() => DOMPurify.sanitize(marked.parse(content.value)))
  const stats = computed(() => computeStats(content.value))
  const outline = computed(() => extractOutline(content.value))

  async function openFile(file) {
    if (!file || !/\.(md|markdown|txt)$/i.test(file.name)) {
      return { ok: false, error: 'Elige un archivo Markdown (.md) o de texto (.txt).' }
    }
    try {
      content.value = await readText(file)
      return { ok: true }
    } catch {
      return { ok: false, error: 'No se ha podido leer el archivo.' }
    }
  }

  const downloadMarkdown = () => download(content.value, 'documento.md', 'text/markdown')
  const downloadHtml = () => download(
    `<!DOCTYPE html>\n<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Documento</title><style>${EXPORT_CSS}</style></head><body>\n${previewHtml.value}\n</body></html>`,
    'documento.html', 'text/html'
  )

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(content.value)
      return true
    } catch {
      return false
    }
  }

  const clear = () => { content.value = '' }
  const reset = () => { content.value = SAMPLE_MARKDOWN }

  return { content, previewHtml, stats, outline, openFile, downloadMarkdown, downloadHtml, copyToClipboard, clear, reset }
}
