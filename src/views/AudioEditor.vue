<script setup>
import { ref, onUnmounted, computed } from 'vue'
import { useAudioEditor } from '../composables/useAudioEditor'
import AudioToolbar from '../components/audio/AudioToolbar.vue'
import AudioWaveform from '../components/audio/AudioWaveform.vue'
import AudioTransport from '../components/audio/AudioTransport.vue'
import AudioSidebar from '../components/audio/AudioSidebar.vue'

const editor = useAudioEditor()
const fileInput = ref(null)
const waveformRef = ref(null)
const isDragging = ref(false)

// Computed
const hasSelection = computed(() => !!editor.selectedRegion.value)
const showSidebar = computed(() => editor.hasFile.value && !editor.isLoading.value)
const showTransport = computed(() => editor.hasFile.value && !editor.isLoading.value)

// File handling
const openFilePicker = () => fileInput.value?.click()

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) loadFile(file)
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length > 0 && files[0].type.startsWith('audio/')) {
    loadFile(files[0])
  }
}

const loadFile = async (file) => {
  // Start loading - container might not exist yet
  await editor.loadFile(file, null)
}

// Waveform container ready - called when v-else renders the container
const onContainerReady = (container) => {
  if (container) {
    editor.setContainer(container)
  }
}

// Cleanup
onUnmounted(() => editor.destroy())
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 text-neutral-300 select-none">
    <!-- Processing Overlay -->
    <div v-if="editor.isProcessing.value" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="flex items-center gap-3 px-5 py-3 bg-neutral-900 border border-neutral-800 rounded">
        <div class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" :style="{ borderColor: editor.themeColor.value, borderTopColor: 'transparent' }"></div>
        <span class="text-sm">Procesando...</span>
      </div>
    </div>

    <!-- Toolbar -->
    <AudioToolbar
      :has-file="editor.hasFile.value"
      :has-selection="hasSelection"
      :can-undo="editor.canUndo.value"
      :can-redo="editor.canRedo.value"
      :zoom-level="editor.zoomLevel.value"
      :theme-color="editor.themeColor.value"
      :visual-style="editor.visualStyle.value"
      @open="openFilePicker"
      @export="editor.exportAudio"
      @undo="editor.undo"
      @redo="editor.redo"
      @trim="editor.trimToSelection"
      @delete="editor.deleteSelection"
      @silence="editor.silenceSelection"
      @fade-in="editor.applyFadeIn"
      @fade-out="editor.applyFadeOut"
      @normalize="editor.normalize"
      @zoom="(val) => editor.setZoom(val)"
      @color-change="editor.setThemeColor"
      @style-change="editor.setVisualStyle"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Waveform Area -->
      <AudioWaveform
        ref="waveformRef"
        :is-loading="editor.isLoading.value"
        :has-file="editor.hasFile.value"
        :has-selection="hasSelection"
        :region-start="editor.regionStart.value"
        :region-end="editor.regionEnd.value"
        :current-time="editor.currentTime.value"
        :duration="editor.duration.value"
        :is-dragging="isDragging"
        :is-playing="editor.isPlaying.value"
        :theme-color="editor.themeColor.value"
        :get-frequency-data="editor.getFrequencyData"
        @container-ready="onContainerReady"
        @drop="handleDrop"
        @dragover="isDragging = true"
        @dragleave="isDragging = false"
        @click="openFilePicker"
      />

      <!-- Sidebar -->
      <AudioSidebar
        v-if="showSidebar"
        :file-name="editor.audioFileName.value"
        :file-info="editor.fileInfo.value"
        :history-index="editor.historyIndex.value"
        :history-length="editor.history.value.length"
        :theme-color="editor.themeColor.value"
        @close="editor.clearFile"
        @export="editor.exportAudio"
      />
    </div>

    <!-- Transport Controls -->
    <AudioTransport
      v-if="showTransport"
      :is-playing="editor.isPlaying.value"
      :volume="editor.volume.value"
      :theme-color="editor.themeColor.value"
      @play="editor.togglePlay"
      @stop="editor.stop"
      @skip-forward="editor.skipForward"
      @skip-backward="editor.skipBackward"
      @volume="editor.setVolume"
    />

    <!-- Hidden File Input -->
    <input
      ref="fileInput"
      type="file"
      accept="audio/*"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>
