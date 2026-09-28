<script setup>
import { ref, nextTick } from 'vue'
import TbSegmented from '../ui/TbSegmented.vue'
import TbToolbar from '../ui/TbToolbar.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbMenu from '../ui/TbMenu.vue'
import Icon from '../icons/Icon.vue'
import { useMarkdownDocument } from '@/composables/useMarkdownDocument'
import * as md from '@/lib/markdownEdit'
import { toast } from '@/composables/useToast'
import { confirmAction } from '@/composables/useConfirm'

const doc = useMarkdownDocument()
const { content, previewHtml, stats } = doc

const mode = ref('edit')
const textarea = ref(null)
const fileInput = ref(null)

function apply(op) {
  const ta = textarea.value
  if (!ta) return
  const r = op(content.value, { start: ta.selectionStart, end: ta.selectionEnd })
  content.value = r.text
  nextTick(() => {
    ta.focus()
    ta.setSelectionRange(r.sel.start, r.sel.end)
  })
}

// Título: sin título → # → ## → ### → sin título
function cycleHeading() {
  const ta = textarea.value
  const lineStart = content.value.lastIndexOf('\n', ta.selectionStart - 1) + 1
  const current = (content.value.slice(lineStart).match(/^(#{1,6})\s/) || [null, ''])[1].length
  apply((t, s) => (current >= 3 ? md.setHeading(t, s, current) : md.setHeading(t, s, current + 1)))
}

const actions = [
  { label: 'Negrita', icon: 'bold', run: () => apply((t, s) => md.wrapSelection(t, s, '**', '**', 'texto')) },
  { label: 'Cursiva', icon: 'italic', run: () => apply((t, s) => md.wrapSelection(t, s, '*', '*', 'texto')) },
  { label: 'Título', icon: 'markdown', run: cycleHeading },
  { label: 'Lista', icon: 'list', run: () => apply((t, s) => md.toggleLinePrefix(t, s, '- ')) },
  { label: 'Lista numerada', icon: 'list-ordered', run: () => apply((t, s) => md.toggleLinePrefix(t, s, '1. ')) },
  { label: 'Tarea', icon: 'checkbox', run: () => apply((t, s) => md.toggleLinePrefix(t, s, '- [ ] ')) },
  { label: 'Cita', icon: 'quote', run: () => apply((t, s) => md.toggleLinePrefix(t, s, '> ')) },
  { label: 'Código', icon: 'code', run: () => apply((t, s) => md.wrapSelection(t, s, '`', '`', 'código')) },
  { label: 'Enlace', icon: 'link', run: () => apply((t, s) => md.wrapSelection(t, s, '[', '](https://)', 'texto')) }
]

async function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const res = await doc.openFile(file)
  toast(res.ok ? `«${file.name}» abierto` : res.error, { tone: res.ok ? 'success' : 'error' })
}
async function copy() {
  const ok = await doc.copyToClipboard()
  toast(ok ? 'Copiado al portapapeles' : 'No se ha podido copiar', { tone: ok ? 'success' : 'error' })
}
async function clearDoc() {
  const ok = await confirmAction({ title: '¿Vaciar el documento?', message: 'Se borrará todo el texto. No se puede deshacer.', confirmLabel: 'Vaciar', tone: 'danger' })
  if (ok) doc.clear()
}

const menuItems = [
  { label: 'Abrir archivo', icon: 'folder', action: () => fileInput.value.click() },
  { label: 'Descargar .md', icon: 'download', action: doc.downloadMarkdown },
  { label: 'Descargar .html', icon: 'download', action: doc.downloadHtml },
  { label: 'Copiar', icon: 'copy', action: copy },
  { label: 'Vaciar documento', icon: 'trash', tone: 'danger', action: clearDoc }
]
const modes = [{ value: 'edit', label: 'Editar' }, { value: 'preview', label: 'Vista' }]
</script>

<template>
  <div class="h-full flex flex-col bg-tb-bg text-tb-ink font-ui" style="--cat: var(--cat-documents)">
    <div class="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-tb-line bg-tb-surface">
      <TbSegmented v-model="mode" :options="modes" label="Modo" class="flex-1 [&>button]:flex-1 [&>button]:justify-center" />
      <TbMenu label="Más opciones" icon="more-vertical" icon-only align="end" :items="menuItems" />
    </div>

    <TbToolbar v-if="mode === 'edit'" label="Formato" class="shrink-0 px-2 py-1.5 border-b border-tb-line bg-tb-surface">
      <TbIconButton v-for="a in actions" :key="a.label" :label="a.label" :icon="a.icon" size="lg" @click="a.run" />
    </TbToolbar>

    <div class="flex-1 min-h-0 relative">
      <textarea v-show="mode === 'edit'" ref="textarea" v-model="content" aria-label="Texto Markdown" spellcheck="false"
                class="tb-bare-input absolute inset-0 w-full h-full resize-none bg-transparent px-4 py-4 font-code text-[15px] leading-7 text-tb-ink caret-[var(--cat)] outline-none placeholder:text-tb-muted"
                placeholder="Empieza a escribir…"></textarea>
      <div v-show="mode === 'preview'" class="absolute inset-0 overflow-y-auto bg-tb-surface">
        <article class="tb-prose px-5 py-6" v-html="previewHtml"></article>
      </div>
    </div>

    <footer class="shrink-0 flex items-center gap-4 px-4 h-8 border-t border-tb-line bg-tb-surface text-[11px] font-code text-tb-muted">
      <span>{{ stats.words }} palabras</span>
      <span>{{ stats.chars }} caracteres</span>
      <span class="ml-auto flex items-center gap-1"><Icon name="check" :size="12" /> Guardado</span>
    </footer>

    <input ref="fileInput" type="file" accept=".md,.markdown,.txt" class="hidden" @change="onFile" />
  </div>
</template>
