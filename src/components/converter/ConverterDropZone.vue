<script setup>
import { ref } from 'vue'

const props = defineProps({
  accept: { type: String, default: '*' },
  multiple: { type: Boolean, default: false },
  label: { type: String, default: 'Arrastra archivos aquí' },
  sublabel: { type: String, default: 'o haz clic para buscar' },
  icon: { type: String, default: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' }
})

const emit = defineEmits(['files'])
const fileInput = ref(null)
const isDragging = ref(false)

const openPicker = () => fileInput.value?.click()

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  if (files.length) emit('files', files)
  e.target.value = ''
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length) emit('files', files)
}
</script>

<template>
  <div
    @click="openPicker"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
    :class="[
      'flex flex-col items-center justify-center cursor-pointer transition-colors border-2 border-dashed rounded-lg p-8',
      isDragging
        ? 'border-green-500/50 bg-green-500/5'
        : 'border-neutral-400 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-600 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
    ]"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      @change="handleFileSelect"
    />
    <div class="w-14 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center mb-3">
      <svg class="w-6 h-6 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="icon" />
      </svg>
    </div>
    <p class="text-neutral-600 dark:text-neutral-400 text-sm mb-1">{{ label }}</p>
    <p class="text-neutral-500 dark:text-neutral-600 text-xs">{{ sublabel }}</p>
  </div>
</template>
