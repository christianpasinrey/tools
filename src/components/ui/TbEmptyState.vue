<script setup>
import { ref } from 'vue'
import Icon from '../icons/Icon.vue'
import TbButton from './TbButton.vue'

defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  hint: { type: String, default: 'o haz clic para elegir' },
  accept: { type: String, default: '' },
  multiple: Boolean,
  formats: { type: String, default: '' },
  chips: { type: Array, default: () => [] },
  buttonLabel: { type: String, default: 'Elegir archivo' }
})
const emit = defineEmits(['files'])
const input = ref(null)
const dragging = ref(false)
let depth = 0

const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files')
function onEnter(e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; dragging.value = true }
function onOver(e) { if (hasFiles(e)) e.preventDefault() }
function onLeave(e) { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) dragging.value = false }
function onDrop(e) {
  depth = 0
  dragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (!files.length) return
  e.preventDefault()
  emit('files', files)
}
function onPick(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (files.length) emit('files', files)
}
</script>

<template>
  <div class="tb-empty tb-ui" :class="dragging && 'is-dragging'"
       @dragenter="onEnter" @dragover="onOver" @dragleave="onLeave" @drop="onDrop">
    <div class="tb-empty-icon"><Icon :name="icon" :size="30" /></div>
    <p class="font-display text-xl font-bold text-tb-ink">{{ title }}</p>
    <p class="mt-1 text-sm text-tb-muted">{{ hint }}</p>
    <TbButton variant="primary" class="mt-5" icon="upload" @click="input.click()">{{ buttonLabel }}</TbButton>
    <div v-if="chips.length" class="mt-5 flex flex-wrap justify-center gap-1.5">
      <span v-for="c in chips" :key="c" class="px-2.5 py-1 rounded-full text-xs bg-tb-surface-2 text-tb-muted">{{ c }}</span>
    </div>
    <p v-if="formats" class="mt-4 flex items-center gap-1.5 text-xs text-tb-muted"><Icon name="shield" :size="13" /> {{ formats }}</p>
    <input ref="input" type="file" class="hidden" :accept="accept || undefined" :multiple="multiple" @change="onPick" />
  </div>
</template>
