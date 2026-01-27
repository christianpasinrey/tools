<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  editor: { type: Object, default: null },
  isReady: { type: Boolean, default: false }
})

const activeSection = ref('insert')

const sections = [
  { id: 'insert', name: 'Insertar', icon: 'M12 4v16m8-8H4' },
  { id: 'format', name: 'Formato', icon: 'M4 6h16M4 12h10m-10 6h16' },
  { id: 'styles', name: 'Estilos', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' }
]

const insertItems = [
  { id: 'table', name: 'Tabla', icon: 'M3 10h18M3 14h18M10 3v18M14 3v18', action: 'insertTable' },
  { id: 'image', name: 'Imagen', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', action: 'insertImage' },
  { id: 'link', name: 'Enlace', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', action: 'insertLink' },
  { id: 'hr', name: 'Línea horizontal', icon: 'M4 12h16', action: 'insertHR' },
  { id: 'pagebreak', name: 'Salto de página', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', action: 'insertPageBreak' }
]

const formatItems = [
  { id: 'clear', name: 'Limpiar formato', icon: 'M6 18L18 6M6 6l12 12', action: 'clearFormat' },
  { id: 'subscript', name: 'Subíndice', icon: 'M4 19h6m0-14v14m10 0v-4m0 0h-4m4 0l-4-4', action: 'toggleSubscript' },
  { id: 'superscript', name: 'Superíndice', icon: 'M4 19h6m0-14v14m10 0v-4m0 0h-4m4 0l-4-4', action: 'toggleSuperscript' }
]

const stylePresets = [
  { id: 'heading1', name: 'Título 1', class: 'text-xl font-bold', action: 'setHeading1' },
  { id: 'heading2', name: 'Título 2', class: 'text-lg font-bold', action: 'setHeading2' },
  { id: 'heading3', name: 'Título 3', class: 'text-base font-semibold', action: 'setHeading3' },
  { id: 'normal', name: 'Normal', class: 'text-sm', action: 'setParagraph' },
  { id: 'quote', name: 'Cita', class: 'text-sm italic border-l-2 border-neutral-500 pl-2', action: 'setBlockquote' }
]

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
      const url = prompt('URL del enlace:')
      if (url) {
        editor.commands.setLink({ href: url })
      }
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
  <div class="w-56 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
    <!-- Section tabs -->
    <div class="flex border-b border-neutral-800">
      <button
        v-for="section in sections"
        :key="section.id"
        @click="activeSection = section.id"
        class="flex-1 p-2 text-center transition-colors"
        :class="activeSection === section.id
          ? 'bg-neutral-800 text-white border-b-2 border-emerald-500'
          : 'text-neutral-500 hover:text-neutral-300'"
        :title="section.name"
      >
        <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="section.icon" />
        </svg>
      </button>
    </div>

    <!-- Section content -->
    <div class="flex-1 overflow-y-auto p-3">
      <div v-if="!isReady" class="text-center text-neutral-500 text-sm py-8">
        Esperando editor...
      </div>

      <!-- Insert section -->
      <template v-else-if="activeSection === 'insert'">
        <h3 class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Insertar</h3>
        <div class="space-y-1">
          <button
            v-for="item in insertItems"
            :key="item.id"
            @click="executeCommand(item.action)"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-left"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            <span class="text-sm">{{ item.name }}</span>
          </button>
        </div>
      </template>

      <!-- Format section -->
      <template v-else-if="activeSection === 'format'">
        <h3 class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Formato</h3>
        <div class="space-y-1">
          <button
            v-for="item in formatItems"
            :key="item.id"
            @click="executeCommand(item.action)"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-left"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            <span class="text-sm">{{ item.name }}</span>
          </button>
        </div>
      </template>

      <!-- Styles section -->
      <template v-else-if="activeSection === 'styles'">
        <h3 class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">Estilos rápidos</h3>
        <div class="space-y-1">
          <button
            v-for="style in stylePresets"
            :key="style.id"
            @click="executeCommand(style.action)"
            class="w-full px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-left"
            :class="style.class"
          >
            {{ style.name }}
          </button>
        </div>
      </template>
    </div>

    <!-- Quick tips -->
    <div class="p-3 border-t border-neutral-800 bg-neutral-900/50">
      <p class="text-[10px] text-neutral-600 leading-relaxed">
        <span class="text-neutral-500">Tip:</span> Usa Ctrl+B para negrita, Ctrl+I para cursiva
      </p>
    </div>
  </div>
</template>
