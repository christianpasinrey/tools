<script setup>
import { ref } from 'vue'
import ConverterDropZone from './ConverterDropZone.vue'

const props = defineProps({
  converter: { type: Object, required: true }
})

const imageFiles = ref([])
const imagePreviews = ref([])
const pageSize = ref('fit')
const dragIndex = ref(null)

const handleFiles = (files) => {
  const validFiles = files.filter(f => f.type === 'image/jpeg' || f.type === 'image/png')
  if (validFiles.length === 0) {
    props.converter.showToast('Solo se aceptan archivos JPG y PNG', 'error')
    return
  }

  for (const file of validFiles) {
    imageFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreviews.value.push({ name: file.name, src: e.target.result, size: file.size })
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = (index) => {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

const clearAll = () => {
  imageFiles.value = []
  imagePreviews.value = []
}

const onDragStart = (index) => {
  dragIndex.value = index
}

const onDrop = (targetIndex) => {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return
  const movedFile = imageFiles.value.splice(dragIndex.value, 1)[0]
  const movedPreview = imagePreviews.value.splice(dragIndex.value, 1)[0]
  imageFiles.value.splice(targetIndex, 0, movedFile)
  imagePreviews.value.splice(targetIndex, 0, movedPreview)
  dragIndex.value = null
}

const convert = () => {
  if (imageFiles.value.length === 0) return
  props.converter.jpgToPdf(imageFiles.value, pageSize.value)
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
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
          <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">JPG a PDF</h2>
          <p class="text-xs text-neutral-500">Convierte imágenes JPG/PNG a un documento PDF</p>
        </div>
      </div>

      <!-- Upload zone (when no images) -->
      <ConverterDropZone
        v-if="imagePreviews.length === 0"
        accept="image/jpeg,image/png"
        :multiple="true"
        label="Arrastra imágenes JPG o PNG aquí"
        sublabel="o haz clic para buscar"
        icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        @files="handleFiles"
      />

      <!-- Images loaded -->
      <template v-if="imagePreviews.length > 0">
        <!-- Options bar -->
        <div class="flex flex-wrap items-center gap-3 mb-4 p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div class="flex items-center gap-2">
            <label class="text-xs text-neutral-600 dark:text-neutral-400">Tamaño de página:</label>
            <select
              v-model="pageSize"
              class="text-xs bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 text-neutral-700 dark:text-neutral-300"
            >
              <option value="fit">Ajustar a imagen</option>
              <option value="a4">A4 (centrado)</option>
            </select>
          </div>
          <div class="flex-1"></div>
          <button
            @click="clearAll"
            class="text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            Eliminar todo
          </button>
        </div>

        <!-- Image grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          <div
            v-for="(img, index) in imagePreviews"
            :key="index"
            draggable="true"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop.prevent="onDrop(index)"
            class="relative group rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800 cursor-grab active:cursor-grabbing"
          >
            <img :src="img.src" :alt="img.name" class="w-full aspect-[3/4] object-cover" />
            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p class="text-white text-[10px] truncate">{{ img.name }}</p>
              <p class="text-white/70 text-[9px]">{{ formatSize(img.size) }}</p>
            </div>
            <button
              @click.stop="removeImage(index)"
              class="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div class="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-[9px] text-white font-medium">
              {{ index + 1 }}
            </div>
          </div>

          <!-- Add more button -->
          <label class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 cursor-pointer transition-colors aspect-[3/4]">
            <input type="file" class="hidden" accept="image/jpeg,image/png" multiple @change="(e) => handleFiles(Array.from(e.target.files || []))" />
            <svg class="w-6 h-6 text-neutral-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
            </svg>
            <span class="text-[10px] text-neutral-500">Agregar</span>
          </label>
        </div>

        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {{ imagePreviews.length }} {{ imagePreviews.length === 1 ? 'imagen' : 'imágenes' }} - Arrastra para reordenar
        </p>

        <!-- Convert button -->
        <button
          @click="convert"
          :disabled="converter.isProcessing.value"
          class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          Convertir a PDF
        </button>
      </template>
    </div>
  </div>
</template>
