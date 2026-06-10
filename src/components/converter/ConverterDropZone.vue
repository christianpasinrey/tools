<script setup>
import { ref } from 'vue'
import EditorEmptyState from '../common/EditorEmptyState.vue'

const props = defineProps({
  accept: { type: String, default: '*' },
  multiple: { type: Boolean, default: false },
  label: { type: String, default: 'Arrastra archivos aquí' },
  sublabel: { type: String, default: 'o haz clic para buscar' },
  icon: { type: String, default: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  accent: { type: String, default: '#10b981' },
  chips: { type: Array, default: () => [] },
  formats: { type: String, default: '' }
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
    class="group flex flex-col items-center justify-center cursor-pointer transition-colors border-2 border-dashed rounded-xl p-10"
    :class="isDragging
      ? 'bg-emerald-500/5'
      : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'"
    :style="isDragging ? { borderColor: `color-mix(in srgb, ${accent} 60%, transparent)` } : {}"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      @change="handleFileSelect"
    />
    <EditorEmptyState
      :icon="icon"
      :title="label"
      :hint="sublabel"
      :accent="accent"
      :chips="chips"
      :formats="formats"
    />
  </div>
</template>
