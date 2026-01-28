<script setup>
import { ref } from 'vue'

const props = defineProps({
  hasFile: Boolean,
  hasSelection: Boolean,
  allSelected: Boolean,
  selectedCount: Number,
  pageCount: Number,
  themeColor: String,
  canUndo: Boolean,
  canRedo: Boolean,
  undoActionName: String,
  redoActionName: String,
  showAnnotations: Boolean,
  annotationCount: Number
})

const emit = defineEmits([
  'open', 'add-files', 'export',
  'select-all', 'deselect-all',
  'rotate-left', 'rotate-right',
  'delete', 'extract', 'split-all',
  'color-change', 'undo', 'redo',
  'toggle-annotations'
])

const showColors = ref(false)

const colors = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f97316', '#eab308', '#14b8a6', '#ef4444'
]
</script>

<template>
  <div class="editor-toolbar">
    <!-- File Actions -->
    <div class="flex items-center gap-1 pr-2 border-r border-neutral-300 dark:border-neutral-800">
      <button
        @click="emit('open')"
        class="editor-toolbar-btn"
        title="Abrir PDF"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
        <span>Abrir</span>
      </button>

      <button
        v-if="hasFile"
        @click="emit('add-files')"
        class="editor-toolbar-btn"
        title="Añadir más PDFs"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
        </svg>
        <span>Añadir</span>
      </button>

      <button
        v-if="hasFile"
        @click="emit('export')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
        :style="{ backgroundColor: themeColor + '20', color: themeColor }"
        title="Exportar PDF"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        <span>Exportar</span>
      </button>
    </div>

    <!-- Undo/Redo -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('undo')"
        :disabled="!canUndo"
        class="p-1.5 rounded transition-colors"
        :class="canUndo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'"
        :title="canUndo ? `Deshacer: ${undoActionName}` : 'Nada que deshacer'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
        </svg>
      </button>
      <button
        @click="emit('redo')"
        :disabled="!canRedo"
        class="p-1.5 rounded transition-colors"
        :class="canRedo ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-700 cursor-not-allowed'"
        :title="canRedo ? `Rehacer: ${redoActionName}` : 'Nada que rehacer'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
        </svg>
      </button>
    </div>

    <!-- Selection -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="allSelected ? emit('deselect-all') : emit('select-all')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        {{ allSelected ? 'Deseleccionar' : 'Seleccionar todo' }}
      </button>

      <span v-if="hasSelection" class="text-xs text-neutral-500 px-2">
        {{ selectedCount }} de {{ pageCount }}
      </span>
    </div>

    <!-- Page Actions -->
    <div v-if="hasFile && hasSelection" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('rotate-left')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Rotar izquierda"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
      <button
        @click="emit('rotate-right')"
        class="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Rotar derecha"
      >
        <svg class="w-4 h-4 scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
      <button
        @click="emit('delete')"
        class="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
        title="Eliminar páginas"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
      <button
        @click="emit('extract')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Extraer páginas seleccionadas"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
        </svg>
        Extraer
      </button>
    </div>

    <!-- Split -->
    <div v-if="hasFile && pageCount > 1" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('split-all')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Dividir en páginas individuales"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
        </svg>
        Dividir
      </button>
    </div>

    <!-- Annotations -->
    <div v-if="hasFile" class="flex items-center gap-1 pr-2 border-r border-neutral-800">
      <button
        @click="emit('toggle-annotations')"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
        :class="showAnnotations ? 'text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'"
        :style="showAnnotations ? { backgroundColor: themeColor + '20', color: themeColor } : {}"
        title="Panel de anotaciones"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
        </svg>
        <span>Notas</span>
        <span
          v-if="annotationCount > 0"
          class="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full"
          :style="{ backgroundColor: themeColor, color: 'white' }"
        >
          {{ annotationCount }}
        </span>
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Page Count -->
    <div v-if="hasFile" class="px-3 text-xs text-neutral-500">
      {{ pageCount }} {{ pageCount === 1 ? 'página' : 'páginas' }}
    </div>

    <!-- Color Picker -->
    <div class="relative pl-2 border-l border-neutral-800">
      <button
        @click="showColors = !showColors"
        class="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-neutral-800 transition-colors"
        title="Color del tema"
      >
        <div class="w-4 h-4 rounded" :style="{ backgroundColor: themeColor }"></div>
      </button>

      <div v-if="showColors" class="absolute top-full right-0 mt-1 p-2 bg-neutral-900 border border-neutral-800 rounded shadow-xl z-50">
        <div class="flex gap-1">
          <button
            v-for="color in colors"
            :key="color"
            @click="emit('color-change', color); showColors = false"
            :class="['w-6 h-6 rounded transition-transform hover:scale-110', color === themeColor ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900' : '']"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>
