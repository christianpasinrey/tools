<script setup>
import { ref } from 'vue'
import ConverterDropZone from './ConverterDropZone.vue'

const props = defineProps({
  converter: { type: Object, required: true }
})

const pdfFile = ref(null)
const pdfName = ref('')

const handleFiles = (files) => {
  const file = files[0]
  if (!file || file.type !== 'application/pdf') {
    props.converter.showToast('Solo se aceptan archivos PDF', 'error')
    return
  }
  pdfFile.value = file
  pdfName.value = file.name
}

const convert = () => {
  if (!pdfFile.value) return
  props.converter.pdfToWord(pdfFile.value)
}

const reset = () => {
  pdfFile.value = null
  pdfName.value = ''
}

const formatSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}
</script>

<template>
  <div class="flex-1 overflow-auto p-4 sm:p-6">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-6">
        <button
          @click="converter.goBack()"
          class="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 flex items-center justify-center transition-colors"
        >
          <svg class="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">PDF a Word</h2>
          <p class="text-xs text-neutral-500">Extrae el texto del PDF a un documento DOCX</p>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
        <div class="flex gap-2">
          <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p class="text-xs text-amber-800 dark:text-amber-300 font-medium">Limitaciones</p>
            <ul class="text-[11px] text-amber-700 dark:text-amber-400 mt-1 space-y-0.5">
              <li>Solo se extrae texto, no imágenes ni formato complejo</li>
              <li>Los PDFs escaneados (imágenes) no producirán contenido</li>
              <li>Los layouts multi-columna se fusionan en una sola columna</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Upload zone -->
      <ConverterDropZone
        v-if="!pdfFile"
        accept="application/pdf"
        label="Arrastra un PDF aquí"
        sublabel="o haz clic para buscar"
        icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        accent="#2563eb"
        formats="PDF → DOCX — conversión 100% local"
        @files="handleFiles"
      />

      <!-- File loaded -->
      <template v-if="pdfFile">
        <div class="p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{{ pdfName }}</p>
              <p class="text-xs text-neutral-500">{{ formatSize(pdfFile.size) }}</p>
            </div>
            <button
              @click="reset"
              class="text-xs text-neutral-500 hover:text-red-500 transition-colors"
            >
              Cambiar
            </button>
          </div>
        </div>

        <button
          @click="convert"
          :disabled="converter.isProcessing.value"
          class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          Convertir a Word
        </button>
      </template>
    </div>
  </div>
</template>
