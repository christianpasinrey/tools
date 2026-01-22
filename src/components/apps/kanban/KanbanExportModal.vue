<script setup>
import { ref } from 'vue'
import { useKanbanExport } from '../../../composables/kanban/useKanbanExport.js'

const props = defineProps({
  board: { type: Object, default: null }
})

const emit = defineEmits(['close', 'import'])

const { exportJSON, exportCSV, exportMarkdown, importJSON } = useKanbanExport()

const format = ref('json')
const importError = ref('')
const importSuccess = ref(false)

function doExport() {
  if (!props.board) return
  switch (format.value) {
    case 'json': exportJSON(props.board); break
    case 'csv': exportCSV(props.board); break
    case 'markdown': exportMarkdown(props.board); break
  }
}

async function onFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  importError.value = ''
  importSuccess.value = false
  try {
    const data = await importJSON(file)
    emit('import', data)
    importSuccess.value = true
  } catch (err) {
    importError.value = err.message
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="emit('close')">
    <div class="w-96 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 class="text-sm font-medium text-white">Export / Import</h3>
        <button @click="emit('close')" class="text-neutral-500 hover:text-white transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="p-4 space-y-4">
        <!-- Export section -->
        <div>
          <h4 class="text-xs font-medium text-neutral-300 mb-2">Exportar</h4>
          <div class="space-y-1.5">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="format" value="json" class="w-3 h-3 text-indigo-500 bg-neutral-800 border-neutral-600 focus:ring-0" />
              <span class="text-xs text-neutral-300">JSON</span>
              <span class="text-[9px] text-neutral-600">(backup completo)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="format" value="csv" class="w-3 h-3 text-indigo-500 bg-neutral-800 border-neutral-600 focus:ring-0" />
              <span class="text-xs text-neutral-300">CSV</span>
              <span class="text-[9px] text-neutral-600">(compatible Trello/Notion)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="format" value="markdown" class="w-3 h-3 text-indigo-500 bg-neutral-800 border-neutral-600 focus:ring-0" />
              <span class="text-xs text-neutral-300">Markdown</span>
              <span class="text-[9px] text-neutral-600">(legible, Obsidian/Notion)</span>
            </label>
          </div>
          <button
            @click="doExport"
            :disabled="!board"
            class="mt-3 w-full px-3 py-2 text-xs bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Descargar
          </button>
        </div>

        <!-- Import section -->
        <div class="border-t border-neutral-800 pt-4">
          <h4 class="text-xs font-medium text-neutral-300 mb-2">Importar</h4>
          <label class="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-600 rounded-lg cursor-pointer transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Seleccionar archivo JSON
            <input type="file" accept=".json" class="hidden" @change="onFileSelect" />
          </label>
          <p v-if="importError" class="text-[10px] text-red-400 mt-1">{{ importError }}</p>
          <p v-if="importSuccess" class="text-[10px] text-green-400 mt-1">Importado correctamente como nuevo tablero</p>
        </div>
      </div>
    </div>
  </div>
</template>
