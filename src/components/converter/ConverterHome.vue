<script setup>
import { useConverter } from '../../composables/useConverter'
import ConverterJpgToPdf from './ConverterJpgToPdf.vue'
import ConverterPdfToJpg from './ConverterPdfToJpg.vue'
import ConverterPdfToWord from './ConverterPdfToWord.vue'
import ConverterPdfToExcel from './ConverterPdfToExcel.vue'

defineProps({
  themeColor: String
})

const converter = useConverter()

const conversions = [
  {
    id: 'jpg-to-pdf',
    title: 'JPG a PDF',
    description: 'Convierte imágenes JPG/PNG a un documento PDF',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#3b82f6'
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF a JPG',
    description: 'Extrae cada página del PDF como imagen JPG',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: '#ef4444'
  },
  {
    id: 'pdf-to-word',
    title: 'PDF a Word',
    description: 'Extrae el texto del PDF a un documento DOCX',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: '#2563eb'
  },
  {
    id: 'pdf-to-excel',
    title: 'PDF a Excel',
    description: 'Extrae datos tabulares del PDF a un archivo XLSX',
    icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    color: '#16a34a'
  }
]
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Toast notifications -->
    <Teleport to="body">
      <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <transition-group name="toast">
          <div
            v-for="toast in converter.toasts.value"
            :key="toast.id"
            :class="[
              'px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm',
              toast.type === 'success' ? 'bg-green-600 text-white' : '',
              toast.type === 'error' ? 'bg-red-600 text-white' : '',
              toast.type === 'info' ? 'bg-neutral-700 text-white' : ''
            ]"
          >
            {{ toast.message }}
          </div>
        </transition-group>
      </div>
    </Teleport>

    <!-- Processing overlay -->
    <div v-if="converter.isProcessing.value" class="absolute inset-0 bg-black/40 z-40 flex items-center justify-center">
      <div class="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4 text-center">
        <div class="w-10 h-10 border-3 border-neutral-300 dark:border-neutral-600 border-t-green-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm text-neutral-700 dark:text-neutral-300 mb-2">{{ converter.progressMessage.value }}</p>
        <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
          <div class="bg-green-500 h-1.5 rounded-full transition-all duration-300" :style="{ width: converter.progress.value + '%' }"></div>
        </div>
        <p class="text-xs text-neutral-500 mt-1">{{ Math.round(converter.progress.value) }}%</p>
      </div>
    </div>

    <!-- Home: card grid -->
    <div v-if="!converter.activeConversion.value" class="flex-1 overflow-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Convertidor de Documentos</h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Selecciona el tipo de conversión</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="conv in conversions"
            :key="conv.id"
            @click="converter.selectConversion(conv.id)"
            class="group text-left p-5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all hover:shadow-md"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                :style="{ backgroundColor: conv.color + '15' }"
              >
                <svg class="w-5 h-5" :style="{ color: conv.color }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="conv.icon" />
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white">
                  {{ conv.title }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{{ conv.description }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Sub-views -->
    <ConverterJpgToPdf v-if="converter.activeConversion.value === 'jpg-to-pdf'" :converter="converter" />
    <ConverterPdfToJpg v-if="converter.activeConversion.value === 'pdf-to-jpg'" :converter="converter" />
    <ConverterPdfToWord v-if="converter.activeConversion.value === 'pdf-to-word'" :converter="converter" />
    <ConverterPdfToExcel v-if="converter.activeConversion.value === 'pdf-to-excel'" :converter="converter" />
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
