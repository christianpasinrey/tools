<script setup>
import { ref } from 'vue'

const props = defineProps({
  pages: Array,
  selectedPages: Object, // Set
  themeColor: String,
  isLoading: Boolean,
  hasFile: Boolean,
  isDragging: Boolean
})

const emit = defineEmits(['drop', 'dragover', 'dragleave', 'click', 'toggle-select', 'reorder'])

// Drag and drop reordering
const draggedIndex = ref(null)
const dragOverIndex = ref(null)

const onDragStart = (e, index) => {
  draggedIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', index)
}

const onDragOver = (e, index) => {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const onDragLeave = () => {
  dragOverIndex.value = null
}

const onDrop = (e, index) => {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    emit('reorder', draggedIndex.value, index)
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

const onDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <div
    class="flex-1 overflow-auto p-4 scrollbar-thin"
    @dragover.prevent="!hasFile && emit('dragover')"
    @dragleave="!hasFile && emit('dragleave')"
    @drop.prevent="!hasFile && emit('drop', $event)"
  >
    <!-- Empty State -->
    <div
      v-if="!hasFile"
      @click="emit('click')"
      :class="['h-full flex flex-col items-center justify-center cursor-pointer transition-colors rounded-lg border-2 border-dashed bg-neutral-900/50', isDragging ? 'border-green-500/50 bg-green-500/5' : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/50']"
    >
      <div class="w-16 h-16 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      </div>
      <p class="text-neutral-400 text-sm mb-1">Arrastra un PDF aquí</p>
      <p class="text-neutral-600 text-xs">o haz clic para buscar</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="h-full flex items-center justify-center">
      <div class="flex items-center gap-3">
        <div class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" :style="{ borderColor: themeColor }"></div>
        <span class="text-neutral-400 text-sm">Cargando PDF...</span>
      </div>
    </div>

    <!-- Pages Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div
        v-for="(page, index) in pages"
        :key="page.id"
        draggable="true"
        @dragstart="onDragStart($event, index)"
        @dragover="onDragOver($event, index)"
        @dragleave="onDragLeave"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
        @click="emit('toggle-select', page.id)"
        :class="[
          'relative group cursor-pointer rounded-lg overflow-hidden transition-all',
          selectedPages.has(page.id) ? 'ring-2 ring-offset-2 ring-offset-neutral-950' : 'hover:ring-2 hover:ring-neutral-700',
          dragOverIndex === index ? 'ring-2 ring-dashed ring-offset-2 ring-offset-neutral-950' : '',
          draggedIndex === index ? 'opacity-50' : ''
        ]"
        :style="selectedPages.has(page.id) ? { ringColor: themeColor } : {}"
      >
        <!-- Thumbnail -->
        <div class="bg-white aspect-[3/4] flex items-center justify-center overflow-hidden">
          <img
            :src="page.thumbnail"
            :alt="`Página ${index + 1}`"
            class="max-w-full max-h-full object-contain"
            :style="{ transform: `rotate(${page.rotation}deg)` }"
          />
        </div>

        <!-- Page Number -->
        <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <span class="text-white text-xs font-medium">{{ index + 1 }}</span>
        </div>

        <!-- Selection Checkbox -->
        <div
          :class="[
            'absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            selectedPages.has(page.id) ? 'border-transparent' : 'border-white/50 bg-black/30 group-hover:border-white'
          ]"
          :style="selectedPages.has(page.id) ? { backgroundColor: themeColor } : {}"
        >
          <svg v-if="selectedPages.has(page.id)" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
        </div>

        <!-- Rotation Indicator -->
        <div v-if="page.rotation !== 0" class="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white">
          {{ page.rotation }}°
        </div>

        <!-- Drag Handle -->
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
