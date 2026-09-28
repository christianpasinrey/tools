<script setup>
import { ref, nextTick } from 'vue'
import Icon from '../icons/Icon.vue'
import TbSegmented from '../ui/TbSegmented.vue'
import TbButton from '../ui/TbButton.vue'

const props = defineProps({
  editor: { type: Object, default: null },
  isReady: { type: Boolean, default: false }
})

const activeSection = ref('insert')

const sections = [
  { value: 'insert', label: 'Insertar' },
  { value: 'format', label: 'Formato' },
  { value: 'styles', label: 'Estilos' }
]

const insertItems = [
  { id: 'table', name: 'Tabla', icon: 'table', action: 'insertTable' },
  { id: 'image', name: 'Imagen', icon: 'image', action: 'insertImage' },
  { id: 'link', name: 'Enlace', icon: 'link', action: 'insertLink' },
  { id: 'hr', name: 'Línea horizontal', icon: 'minus', action: 'insertHR' },
  { id: 'pagebreak', name: 'Salto de línea', icon: 'split', action: 'insertPageBreak' }
]

const formatItems = [
  { id: 'clear', name: 'Limpiar formato', glyph: 'T̸', action: 'clearFormat' },
  { id: 'subscript', name: 'Subíndice', glyph: 'x₂', action: 'toggleSubscript' },
  { id: 'superscript', name: 'Superíndice', glyph: 'x²', action: 'toggleSuperscript' }
]

const stylePresets = [
  { id: 'heading1', name: 'Título 1', class: 'text-xl font-bold', action: 'setHeading1' },
  { id: 'heading2', name: 'Título 2', class: 'text-lg font-bold', action: 'setHeading2' },
  { id: 'heading3', name: 'Título 3', class: 'text-base font-semibold', action: 'setHeading3' },
  { id: 'normal', name: 'Normal', class: 'text-sm', action: 'setParagraph' },
  { id: 'quote', name: 'Cita', class: 'text-sm italic border-l-2 border-tb-line-strong', action: 'setBlockquote' }
]

const linkOpen = ref(false)
const linkUrl = ref('')
const linkField = ref(null)

const applyLink = () => {
  const href = linkUrl.value.trim()
  if (href) props.editor?.commands.setLink({ href })
  linkOpen.value = false
  linkUrl.value = ''
}

const executeCommand = (action) => {
  const editor = props.editor
  if (!editor) return

  switch (action) {
    case 'insertTable':
      editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      break
    case 'insertImage':
      // Trigger image upload
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = () => {
            editor.commands.setImage({ src: reader.result })
          }
          reader.readAsDataURL(file)
        }
      }
      input.click()
      break
    case 'insertLink':
      linkOpen.value = !linkOpen.value
      if (linkOpen.value) nextTick(() => linkField.value?.[0]?.focus())
      break
    case 'insertHR':
      editor.commands.setHorizontalRule?.()
      break
    case 'insertPageBreak':
      editor.commands.setHardBreak?.()
      break
    case 'clearFormat':
      editor.commands.unsetAllMarks?.()
      editor.commands.clearNodes?.()
      break
    case 'toggleSubscript':
      editor.commands.toggleSubscript?.()
      break
    case 'toggleSuperscript':
      editor.commands.toggleSuperscript?.()
      break
    case 'setHeading1':
      editor.commands.setHeading?.({ level: 1 })
      break
    case 'setHeading2':
      editor.commands.setHeading?.({ level: 2 })
      break
    case 'setHeading3':
      editor.commands.setHeading?.({ level: 3 })
      break
    case 'setParagraph':
      editor.commands.setParagraph?.()
      break
    case 'setBlockquote':
      editor.commands.setBlockquote?.()
      break
  }
}
</script>

<template>
  <aside class="w-60 shrink-0 flex flex-col border-l border-tb-line bg-tb-surface" aria-label="Insertar y formato">
    <div class="p-3 border-b border-tb-line">
      <TbSegmented v-model="activeSection" :options="sections" label="Sección" size="sm" class="w-full" />
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <p v-if="!isReady" class="py-8 text-center text-sm text-tb-muted">Preparando el editor…</p>

      <ul v-else-if="activeSection === 'insert'" class="space-y-0.5">
        <li v-for="item in insertItems" :key="item.id">
          <button type="button" class="docx-side-item text-sm" :aria-expanded="item.id === 'link' ? String(linkOpen) : undefined" @click="executeCommand(item.action)">
            <Icon :name="item.icon" :size="16" />{{ item.name }}
          </button>
          <form v-if="item.id === 'link' && linkOpen" class="flex gap-1.5 px-2 pb-2" @submit.prevent="applyLink">
            <input ref="linkField" v-model="linkUrl" type="url" required placeholder="https://…" aria-label="Dirección del enlace"
                   class="min-w-0 flex-1 h-8 px-2 rounded-lg border border-tb-line-strong bg-tb-surface text-sm text-tb-ink focus:outline-none focus:border-[var(--cat)]" />
            <TbButton size="sm" variant="primary" type="submit">Poner</TbButton>
          </form>
        </li>
      </ul>

      <ul v-else-if="activeSection === 'format'" class="space-y-0.5">
        <li v-for="item in formatItems" :key="item.id">
          <button type="button" class="docx-side-item text-sm" @click="executeCommand(item.action)">
            <span class="w-4 text-center font-code text-xs">{{ item.glyph }}</span>{{ item.name }}
          </button>
        </li>
      </ul>

      <ul v-else class="space-y-0.5">
        <li v-for="style in stylePresets" :key="style.id">
          <button type="button" class="docx-side-item" :class="style.class" @click="executeCommand(style.action)">{{ style.name }}</button>
        </li>
      </ul>
    </div>

    <p class="p-3 border-t border-tb-line text-xs text-tb-muted">
      Atajos: <kbd class="font-code">Ctrl+B</kbd> negrita · <kbd class="font-code">Ctrl+I</kbd> cursiva
    </p>
  </aside>
</template>

<style scoped>
.docx-side-item {
  display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border-radius: 9px;
  text-align: left; color: var(--tb-muted); transition: background .15s, color .15s;
}
.docx-side-item:hover, .docx-side-item[aria-expanded="true"] { background: var(--tb-surface-2); color: var(--tb-ink); }
</style>
