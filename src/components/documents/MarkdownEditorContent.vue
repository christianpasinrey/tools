<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import VaultSaveLoad from '../common/VaultSaveLoad.vue'
import TbToolbar from '../ui/TbToolbar.vue'
import TbToolbarGroup from '../ui/TbToolbarGroup.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbSegmented from '../ui/TbSegmented.vue'
import TbMenu from '../ui/TbMenu.vue'
import TbInput from '../ui/TbInput.vue'
import TbButton from '../ui/TbButton.vue'
import Icon from '../icons/Icon.vue'
import { useMarkdownDocument, SAMPLE_MARKDOWN } from '@/composables/useMarkdownDocument'
import * as md from '@/lib/markdownEdit'
import { toast } from '@/composables/useToast'
import { confirmAction } from '@/composables/useConfirm'

const LINE_HEIGHT = 24

const doc = useMarkdownDocument()
const { content, persisted, previewHtml, stats, outline } = doc

const editor = ref(null)
const gutter = ref(null)
const preview = ref(null)
const body = ref(null)
const fileInput = ref(null)
const findInput = ref(null)

const mode = ref('split')
const splitRatio = ref(50)
const showOutline = ref(true)
const syncScroll = ref(true)
const showSearch = ref(false)
const query = ref('')
const replacement = ref('')
const activeMatch = ref(0)
const cursor = ref({ line: 1, col: 1 })

// Números de línea que respetan el ajuste de línea: una capa espejo con el mismo ancho y
// tipografía que el textarea reproduce cada línea (invisible) y pinta su número a la izquierda.
const lines = computed(() => content.value.split('\n'))
const mirrorWidth = ref(0)
let resizeObs
onMounted(() => {
  mirrorWidth.value = editor.value?.clientWidth || 0
  if (typeof ResizeObserver === 'undefined' || !editor.value) return
  resizeObs = new ResizeObserver(() => { mirrorWidth.value = editor.value?.clientWidth || 0 })
  resizeObs.observe(editor.value)
})
onUnmounted(() => resizeObs?.disconnect())

// ---------- Formato ----------
function apply(op) {
  const ta = editor.value
  if (!ta) return
  const r = op(content.value, { start: ta.selectionStart, end: ta.selectionEnd })
  content.value = r.text
  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(r.sel.start, r.sel.end)
    updateCursor()
  })
}
const bold = () => apply((t, s) => md.wrapSelection(t, s, '**', '**', 'texto'))
const italic = () => apply((t, s) => md.wrapSelection(t, s, '*', '*', 'texto'))
const strike = () => apply((t, s) => md.wrapSelection(t, s, '~~', '~~', 'texto'))
const inlineCode = () => apply((t, s) => md.wrapSelection(t, s, '`', '`', 'código'))
const heading = (n) => apply((t, s) => md.setHeading(t, s, n))
const list = () => apply((t, s) => md.toggleLinePrefix(t, s, '- '))
const orderedList = () => apply((t, s) => md.toggleLinePrefix(t, s, '1. '))
const task = () => apply((t, s) => md.toggleLinePrefix(t, s, '- [ ] '))
const quote = () => apply((t, s) => md.toggleLinePrefix(t, s, '> '))
const codeBlock = () => apply((t, s) => md.wrapSelection(t, s, '```\n', '\n```', 'código'))
const link = () => apply((t, s) => md.wrapSelection(t, s, '[', '](https://)', 'texto'))
const image = () => apply((t, s) => md.wrapSelection(t, s, '![', '](https://)', 'descripción'))
const table = () => apply((t, s) => md.insertBlock(t, s, '| Columna 1 | Columna 2 |\n| --- | --- |\n| Dato | Dato |'))
const rule = () => apply((t, s) => md.insertBlock(t, s, '---'))

// Atajos solo dentro del editor: preventDefault marca el evento como tratado (la paleta lo ignora)
// Tab indenta; para salir del editor con el teclado: Esc y después Tab (como en otros editores de código)
let releaseTab = false
function onEditorKeydown(e) {
  if (e.key === 'Escape') {
    if (showSearch.value) { e.preventDefault(); showSearch.value = false } else releaseTab = true
    return
  }
  if (e.key === 'Tab' && releaseTab) { releaseTab = false; return }
  releaseTab = false
  const mod = e.ctrlKey || e.metaKey
  const k = e.key.toLowerCase()
  if (mod && k === 'b') { e.preventDefault(); bold() }
  else if (mod && k === 'i') { e.preventDefault(); italic() }
  else if (mod && k === 'k') { e.preventDefault(); link() }
  else if (mod && k === 'f') { e.preventDefault(); openSearch() }
  else if (e.key === 'Tab') { e.preventDefault(); apply((t, s) => md.indentLines(t, s, e.shiftKey)) }
}

// ---------- Cursor, índice y scroll ----------
function updateCursor() {
  const ta = editor.value
  if (ta) cursor.value = md.cursorPosition(content.value, ta.selectionStart)
}
const activeHeadingLine = computed(() => [...outline.value].reverse().find(h => h.line < cursor.value.line)?.line)

function onEditorScroll() {
  const ta = editor.value
  if (!ta) return
  if (gutter.value) gutter.value.style.transform = `translateY(${-ta.scrollTop}px)`
  mirrorWidth.value = ta.clientWidth
  if (!syncScroll.value || mode.value !== 'split' || !preview.value) return
  const max = ta.scrollHeight - ta.clientHeight
  const ratio = max > 0 ? ta.scrollTop / max : 0
  preview.value.scrollTop = ratio * (preview.value.scrollHeight - preview.value.clientHeight)
}

function lineTop(line) {
  const el = gutter.value?.children[line]
  return el ? el.offsetTop : line * LINE_HEIGHT
}

function goToLine(line) {
  const ta = editor.value
  const pos = md.offsetOfLine(content.value, line)
  ta.focus()
  ta.setSelectionRange(pos, pos)
  ta.scrollTop = Math.max(0, lineTop(line) - ta.clientHeight / 3)
  onEditorScroll()
  updateCursor()
}

// ---------- Buscar y reemplazar ----------
const matches = computed(() => md.findMatches(content.value, query.value))
watch(query, () => { activeMatch.value = 0; selectMatch() })
watch(matches, (m) => { if (activeMatch.value >= m.length) activeMatch.value = Math.max(0, m.length - 1) })

// Coincidencia activa pintada en la capa espejo (el textarea no muestra la selección sin foco)
const activeMark = computed(() => {
  const m = showSearch.value && matches.value[activeMatch.value]
  if (!m) return null
  const { line, col } = md.cursorPosition(content.value, m.start)
  return { line: line - 1, from: col - 1, to: col - 1 + (m.end - m.start) }
})

function openSearch() {
  showSearch.value = true
  nextTick(() => findInput.value?.$el?.querySelector('input')?.focus())
}
function selectMatch() {
  const m = matches.value[activeMatch.value]
  const ta = editor.value
  if (!m || !ta) return
  ta.setSelectionRange(m.start, m.end)
  const line = md.cursorPosition(content.value, m.start).line
  ta.scrollTop = Math.max(0, lineTop(line - 1) - ta.clientHeight / 3)
  onEditorScroll()
}
function step(delta) {
  if (!matches.value.length) return
  activeMatch.value = (activeMatch.value + delta + matches.value.length) % matches.value.length
  selectMatch()
}
function replaceCurrent() {
  const m = matches.value[activeMatch.value]
  if (!m) return
  content.value = md.replaceAt(content.value, m, replacement.value)
  const after = m.start + replacement.value.length
  const next = matches.value.findIndex(x => x.start >= after)
  activeMatch.value = next === -1 ? 0 : next
  nextTick(selectMatch)
}
function replaceEverything() {
  const { text, count } = md.replaceAll(content.value, query.value, replacement.value)
  content.value = text
  toast(count ? `${count} ${count === 1 ? 'reemplazo' : 'reemplazos'}` : 'Sin coincidencias')
}

// ---------- Divisor ----------
function startResize(e) {
  const rect = body.value.getBoundingClientRect()
  const outlineWidth = showOutline.value ? 224 : 0
  const move = (ev) => {
    const ratio = ((ev.clientX - rect.left - outlineWidth) / (rect.width - outlineWidth)) * 100
    splitRatio.value = Math.min(80, Math.max(20, ratio))
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  e.preventDefault()
}
function onResizeKey(e) {
  if (e.key === 'ArrowLeft') { e.preventDefault(); splitRatio.value = Math.max(20, splitRatio.value - 5) }
  if (e.key === 'ArrowRight') { e.preventDefault(); splitRatio.value = Math.min(80, splitRatio.value + 5) }
}

// ---------- Archivo ----------
// Abrir un archivo o un guardado sustituye el único borrador: se pide confirmación si es texto propio
async function confirmReplace() {
  const text = content.value.trim()
  if (!text || content.value === SAMPLE_MARKDOWN) return true
  return confirmAction({
    title: '¿Sustituir el documento actual?',
    message: 'El texto que tienes ahora se perderá. Si lo quieres conservar, expórtalo o guárdalo antes.',
    confirmLabel: 'Sustituir',
    tone: 'danger'
  })
}

async function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (/\.(md|markdown|txt)$/i.test(file.name) && !(await confirmReplace())) return
  const res = await doc.openFile(file)
  toast(res.ok ? `«${file.name}» abierto` : res.error, { tone: res.ok ? 'success' : 'error' })
}
async function copy() {
  const ok = await doc.copyToClipboard()
  toast(ok ? 'Copiado al portapapeles' : 'No se ha podido copiar', { tone: ok ? 'success' : 'error' })
}
async function clearDoc() {
  const ok = await confirmAction({
    title: '¿Vaciar el documento?',
    message: 'Se borrará todo el texto. No se puede deshacer.',
    confirmLabel: 'Vaciar',
    tone: 'danger'
  })
  if (ok) doc.clear()
}

const exportItems = [
  { label: 'Markdown (.md)', icon: 'download', action: doc.downloadMarkdown },
  { label: 'HTML (.html)', icon: 'download', action: doc.downloadHtml },
  { label: 'Copiar al portapapeles', icon: 'copy', action: copy }
]
const headingItems = [1, 2, 3].map(n => ({ label: `Título ${n}`, action: () => heading(n) }))
const modes = [
  { value: 'edit', icon: 'edit', title: 'Editor' },
  { value: 'split', icon: 'split', title: 'Dividido' },
  { value: 'preview', icon: 'eye', title: 'Vista' }
]

const getDocumentData = () => ({ content: content.value })
const loadDocument = async (data) => {
  if (await confirmReplace()) content.value = data.content || ''
}
</script>

<template>
  <div class="h-full flex flex-col bg-tb-bg text-tb-ink font-ui" style="--cat: var(--cat-documents)">
    <!-- Barra única -->
    <header class="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-tb-line bg-tb-surface">
      <TbToolbar label="Editor Markdown" class="flex-1">
        <TbToolbarGroup label="Archivo">
          <TbIconButton label="Abrir archivo" icon="folder" @click="fileInput.click()" />
          <TbMenu label="Exportar" icon="download" icon-only :items="exportItems" />
        </TbToolbarGroup>
        <TbToolbarGroup label="Texto">
          <TbIconButton label="Negrita (Ctrl+B)" icon="bold" @click="bold" />
          <TbIconButton label="Cursiva (Ctrl+I)" icon="italic" @click="italic" />
          <TbIconButton label="Tachado" icon="strike" @click="strike" />
          <TbIconButton label="Código en línea" icon="code" @click="inlineCode" />
        </TbToolbarGroup>
        <TbToolbarGroup label="Bloques">
          <TbMenu label="Título" :items="headingItems" />
          <TbIconButton label="Lista" icon="list" @click="list" />
          <TbIconButton label="Lista numerada" icon="list-ordered" @click="orderedList" />
          <TbIconButton label="Tarea" icon="checkbox" @click="task" />
          <TbIconButton label="Cita" icon="quote" @click="quote" />
          <TbIconButton label="Bloque de código" icon="code-block" @click="codeBlock" />
        </TbToolbarGroup>
        <TbToolbarGroup label="Insertar">
          <TbIconButton label="Enlace (Ctrl+K)" icon="link" @click="link" />
          <TbIconButton label="Imagen" icon="image" @click="image" />
          <TbIconButton label="Tabla" icon="table" @click="table" />
          <TbIconButton label="Separador" icon="minus" @click="rule" />
        </TbToolbarGroup>
      </TbToolbar>
      <div class="flex items-center gap-1 shrink-0">
        <TbSegmented v-model="mode" :options="modes" label="Modo de vista" size="sm" />
        <TbIconButton label="Índice" icon="outline" :active="showOutline" @click="showOutline = !showOutline" />
        <TbIconButton label="Scroll sincronizado" icon="sync-scroll" :active="syncScroll" @click="syncScroll = !syncScroll" />
        <TbIconButton label="Buscar (Ctrl+F)" icon="search" :active="showSearch" @click="showSearch ? (showSearch = false) : openSearch()" />
        <span class="w-px h-5 mx-1 bg-tb-line" aria-hidden="true"></span>
        <VaultSaveLoad store-name="markdown-documents" :get-data="getDocumentData" label="documento" @load="loadDocument" />
        <TbIconButton label="Vaciar documento" icon="trash" tone="danger" @click="clearDoc" />
      </div>
    </header>

    <!-- Buscar y reemplazar -->
    <Transition name="tb-pop">
      <div v-if="showSearch" class="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-tb-line bg-tb-surface">
        <TbInput ref="findInput" v-model="query" icon="search" size="sm" placeholder="Buscar" class="w-72"
                 @keydown.enter.prevent="step($event.shiftKey ? -1 : 1)" @keydown.esc="showSearch = false">
          <template #end>
            <span data-test="search-count" class="text-xs text-tb-muted font-code whitespace-nowrap">
              {{ query ? (matches.length ? `${activeMatch + 1} de ${matches.length}` : 'Sin resultados') : '' }}
            </span>
          </template>
        </TbInput>
        <TbIconButton label="Anterior (Mayús+Intro)" icon="chevron-up" size="sm" :disabled="!matches.length" @click="step(-1)" />
        <TbIconButton label="Siguiente (Intro)" icon="chevron-down" size="sm" :disabled="!matches.length" @click="step(1)" />
        <TbInput v-model="replacement" icon="replace" size="sm" placeholder="Reemplazar por" class="w-60" />
        <TbButton size="sm" :disabled="!matches.length" @click="replaceCurrent">Reemplazar</TbButton>
        <TbButton size="sm" :disabled="!matches.length" @click="replaceEverything">Reemplazar todo</TbButton>
        <TbIconButton label="Cerrar búsqueda" icon="x" size="sm" class="ml-auto" @click="showSearch = false" />
      </div>
    </Transition>

    <!-- Cuerpo -->
    <div ref="body" class="flex-1 min-h-0 flex">
      <nav v-if="showOutline && mode !== 'preview'" aria-label="Índice del documento"
           class="w-56 shrink-0 overflow-y-auto border-r border-tb-line bg-tb-surface py-3">
        <p class="px-4 pb-2 text-[11px] font-code uppercase tracking-[.12em] text-tb-muted">Índice</p>
        <p v-if="!outline.length" class="px-4 text-sm text-tb-muted">Añade títulos con # para verlos aquí.</p>
        <button v-for="h in outline" :key="h.line" type="button" data-test="outline-item"
                class="block w-full text-left truncate py-1.5 pr-3 text-sm hover:bg-tb-surface-2 transition-colors"
                :class="h.line === activeHeadingLine ? 'text-tb-ink font-medium shadow-[inset_2px_0_0_var(--cat)]' : 'text-tb-muted'"
                :style="{ paddingLeft: `${16 + (h.level - 1) * 12}px` }" @click="goToLine(h.line)">{{ h.text }}</button>
      </nav>

      <section v-show="mode !== 'preview'" data-test="editor-pane" class="relative min-w-0 flex overflow-hidden bg-tb-bg"
               :style="{ width: mode === 'split' ? `${splitRatio}%` : '100%', flex: mode === 'split' ? 'none' : '1' }">
        <div class="w-12 shrink-0 border-r border-tb-line" aria-hidden="true"></div>
        <div class="absolute top-0 bottom-0 left-0 overflow-hidden pointer-events-none select-none" :style="{ width: (48 + mirrorWidth) + 'px' }" aria-hidden="true">
          <div ref="gutter" class="md-mirror ml-12 px-5 pt-5 font-code text-[14px] leading-6 will-change-transform">
            <div v-for="(line, i) in lines" :key="i" class="md-mirror-line"><template v-if="activeMark && activeMark.line === i">{{ line.slice(0, activeMark.from) }}<mark class="md-match">{{ line.slice(activeMark.from, activeMark.to) }}</mark>{{ line.slice(activeMark.to) }}</template><template v-else>{{ line || ' ' }}</template><span class="md-line-no" :class="i + 1 === cursor.line ? 'text-tb-ink' : 'text-tb-muted opacity-70'">{{ i + 1 }}</span></div>
          </div>
        </div>
        <textarea ref="editor" v-model="content" aria-label="Texto Markdown" spellcheck="false"
                  class="tb-bare-input flex-1 min-w-0 resize-none bg-transparent px-5 pt-5 pb-[40vh] font-code text-[14px] leading-6 text-tb-ink caret-[var(--cat)] outline-none placeholder:text-tb-muted"
                  placeholder="Empieza a escribir…" @keydown="onEditorKeydown" @scroll="onEditorScroll"
                  @click="updateCursor" @keyup="updateCursor"></textarea>
      </section>

      <div v-if="mode === 'split'" role="separator" aria-orientation="vertical" tabindex="0"
           :aria-valuenow="Math.round(splitRatio)" aria-valuemin="20" aria-valuemax="80"
           aria-label="Ajustar el reparto entre editor y vista previa"
           class="w-1.5 shrink-0 cursor-col-resize bg-tb-line hover:bg-[var(--cat)] focus-visible:bg-[var(--cat)] focus-visible:outline-none transition-colors"
           @pointerdown="startResize" @keydown="onResizeKey"></div>

      <section v-show="mode !== 'edit'" ref="preview" aria-label="Vista previa" class="min-w-0 flex-1 overflow-y-auto bg-tb-surface">
        <article class="tb-prose max-w-[72ch] mx-auto px-8 py-10" v-html="previewHtml"></article>
      </section>
    </div>

    <!-- Estado -->
    <footer class="h-7 shrink-0 flex items-center gap-4 px-4 border-t border-tb-line bg-tb-surface text-[11px] font-code text-tb-muted">
      <span>Ln {{ cursor.line }}, Col {{ cursor.col }}</span>
      <span>{{ stats.words }} palabras</span>
      <span>{{ stats.chars }} caracteres</span>
      <span v-if="stats.readTime">~{{ stats.readTime }} min de lectura</span>
      <span v-if="persisted" class="ml-auto flex items-center gap-1.5"><Icon name="check" :size="12" /> Guardado en este navegador</span>
      <span v-else class="ml-auto flex items-center gap-1.5 text-[var(--cat)]" title="El navegador no permite guardar datos de este sitio. Exporta el documento para no perderlo."><Icon name="x" :size="12" /> Sin guardar: solo en memoria</span>
      <span class="hidden xl:inline">Tab indenta · Esc y Tab para salir</span>
    </footer>

    <input ref="fileInput" type="file" accept=".md,.markdown,.txt" class="hidden" @change="onFile" />
  </div>
</template>

<style scoped>
.md-mirror-line { position: relative; white-space: pre-wrap; overflow-wrap: break-word; color: transparent; tab-size: 4; }
.md-match { color: transparent; background: color-mix(in srgb, var(--cat) 28%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--cat) 60%, transparent); border-radius: 3px; }
.md-line-no { position: absolute; top: 0; right: calc(100% + 32px); font-size: 12px; font-variant-numeric: tabular-nums; }
textarea { tab-size: 4; overflow-wrap: break-word; }
</style>
