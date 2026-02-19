<script setup>
import { ref } from 'vue'
import ConverterDropZone from './ConverterDropZone.vue'

const props = defineProps({
  converter: { type: Object, required: true }
})

const images = ref([])
const pdfName = ref('')
const scale = ref(2)
const quality = ref(0.92)
const hasFile = ref(false)

const handleFiles = async (files) => {
  const file = files[0]
  if (!file || file.type !== 'application/pdf') {
    props.converter.showToast('Solo se aceptan archivos PDF', 'error')
    return
  }
  pdfName.value = file.name.replace(/\.pdf$/i, '')
  hasFile.value = true
  images.value = await props.converter.pdfToJpg(file, scale.value, quality.value)
}

const reconvert = async (file) => {
  // Re-read the file isn't possible after initial load, so we inform user
  props.converter.showToast('Sube el PDF nuevamente para aplicar los cambios', 'info')
}

const downloadImage = (img) => {
  props.converter.downloadJpgImage(img.dataUrl, img.pageNum, pdfName.value)
}

const downloadAll = () => {
  for (const img of images.value) {
    props.converter.downloadJpgImage(img.dataUrl, img.pageNum, pdfName.value)
  }
}

const reset = () => {
  images.value = []
  pdfName.value = ''
  hasFile.value = false
}
</script>

<template>
  <div class="flex-1 overflow-auto p-4 sm:p-6">
    <div class="max-w-3xl mx-auto">
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
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">PDF a JPG</h2>
          <p class="text-xs text-neutral-500">Extrae cada página del PDF como imagen JPG</p>
        </div>
        <div class="flex-1"></div>
        <button
          v-if="hasFile"
          @click="reset"
          class="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        >
          Nuevo archivo
        </button>
      </div>

      <!-- Upload zone -->
      <ConverterDropZone
        v-if="!hasFile"
        accept="application/pdf"
        label="Arrastra un PDF aquí"
        sublabel="o haz clic para buscar"
        icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        @files="handleFiles"
      />

      <!-- Options (shown before conversion starts) -->
      <template v-if="!hasFile">
        <div class="mt-4 p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-xs text-neutral-600 dark:text-neutral-400">Escala:</label>
              <select
                v-model.number="scale"
                class="text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-neutral-700 dark:text-neutral-300"
              >
                <option :value="1">1x (baja)</option>
                <option :value="2">2x (media)</option>
                <option :value="3">3x (alta)</option>
                <option :value="4">4x (máxima)</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs text-neutral-600 dark:text-neutral-400">Calidad:</label>
              <input
                type="range"
                v-model.number="quality"
                min="0.5"
                max="1"
                step="0.01"
                class="w-24 h-1 accent-red-500"
              />
              <span class="text-xs text-neutral-500 w-8">{{ Math.round(quality * 100) }}%</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Results grid -->
      <template v-if="images.length > 0">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ images.length }} {{ images.length === 1 ? 'página' : 'páginas' }} extraídas de <span class="font-medium">{{ pdfName }}.pdf</span>
          </p>
          <button
            @click="downloadAll"
            class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
          >
            Descargar todo
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div
            v-for="img in images"
            :key="img.pageNum"
            class="relative group rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800"
          >
            <img :src="img.dataUrl" :alt="'Página ' + img.pageNum" class="w-full aspect-[3/4] object-cover" />
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p class="text-white text-[10px]">Página {{ img.pageNum }}</p>
              <p class="text-white/70 text-[9px]">{{ img.width }} × {{ img.height }}px</p>
            </div>
            <button
              @click="downloadImage(img)"
              class="absolute top-1.5 right-1.5 w-7 h-7 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Descargar"
            >
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
