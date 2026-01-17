<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  isLoading: Boolean,
  hasFile: Boolean,
  hasSelection: Boolean,
  regionStart: Number,
  regionEnd: Number,
  currentTime: Number,
  duration: Number,
  isDragging: Boolean
})

const emit = defineEmits(['drop', 'dragover', 'dragleave', 'click', 'containerReady'])

const waveformContainer = ref(null)

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00:000'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`
}

// When hasFile becomes true, emit container
watch(
  () => props.hasFile,
  async (hasFile) => {
    if (hasFile) {
      await nextTick()
      if (waveformContainer.value) {
        emit('containerReady', waveformContainer.value)
      }
    }
  },
  { immediate: true }
)

defineExpose({
  getContainer: () => waveformContainer.value
})
</script>

<template>
  <div
    class="flex-1 flex flex-col min-w-0"
    @dragover.prevent="emit('dragover')"
    @dragleave="emit('dragleave')"
    @drop.prevent="emit('drop', $event)"
  >
    <!-- Empty State -->
    <div
      v-if="!hasFile"
      @click="emit('click')"
      :class="['flex-1 flex flex-col items-center justify-center cursor-pointer transition-colors', isDragging ? 'bg-green-500/5' : 'hover:bg-neutral-900/50']"
    >
      <div class="w-16 h-16 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
      </div>
      <p class="text-neutral-400 text-sm mb-1">Drop audio file here</p>
      <p class="text-neutral-600 text-xs">MP3, WAV, OGG, FLAC, M4A</p>
    </div>

    <!-- Waveform Area (shown when hasFile, container always exists) -->
    <template v-else>
      <div class="flex-1 relative bg-neutral-900/50 border-y border-neutral-800 overflow-x-auto overflow-y-hidden">
        <!-- Grid -->
        <div class="absolute inset-0 pointer-events-none" style="background-image: linear-gradient(to right, rgba(64,64,64,0.3) 1px, transparent 1px); background-size: 100px 100%;"></div>
        <div class="absolute inset-x-0 top-1/2 h-px bg-neutral-800 pointer-events-none"></div>

        <!-- Waveform Container (always exists when hasFile) -->
        <div ref="waveformContainer" class="absolute inset-0"></div>

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="absolute inset-0 bg-neutral-950/80 flex items-center justify-center z-20">
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-neutral-400 text-sm">Loading audio...</span>
          </div>
        </div>

        <!-- Selection Badge -->
        <div v-if="hasSelection && !isLoading" class="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs z-10 pointer-events-none">
          <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
          <span class="text-amber-400 font-mono">{{ formatTime(regionStart) }}</span>
          <span class="text-amber-600">to</span>
          <span class="text-amber-400 font-mono">{{ formatTime(regionEnd) }}</span>
        </div>

        <!-- Hint -->
        <div v-if="!hasSelection && !isLoading" class="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900/90 rounded text-[10px] text-neutral-600 z-10 pointer-events-none">
          Click and drag to select region
        </div>
      </div>

      <!-- Timeline -->
      <div class="h-6 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 text-[10px] text-neutral-600 font-mono shrink-0">
        <div class="flex-1">{{ formatTime(currentTime) }}</div>
        <div>{{ formatTime(duration) }}</div>
      </div>
    </template>
  </div>
</template>
