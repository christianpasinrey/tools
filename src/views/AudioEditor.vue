<script setup>
import { ref, onUnmounted, computed } from 'vue'

const audioFile = ref(null)
const audioFileName = ref('')
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const isLoading = ref(false)
const isProcessing = ref(false)

let audioContext = null
let originalBuffer = null
let currentBuffer = null

const fileInput = ref(null)
const waveformContainer = ref(null)

let wavesurfer = null
let regionsPlugin = null

const selectedRegion = ref(null)
const regionStart = ref(0)
const regionEnd = ref(0)

const history = ref([])
const historyIndex = ref(-1)

const zoomLevel = ref(50)
const isDragging = ref(false)

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

const fileInfo = computed(() => {
  if (!currentBuffer) return null
  return {
    channels: currentBuffer.numberOfChannels,
    sampleRate: currentBuffer.sampleRate,
    duration: currentBuffer.duration,
    bitDepth: 16
  }
})

const progress = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0 && files[0].type.startsWith('audio/')) {
    loadAudioFile(files[0])
  }
}

const handleFileSelect = (e) => {
  const file = e.target.files[0]
  if (file) loadAudioFile(file)
}

const loadAudioFile = async (file) => {
  isLoading.value = true
  audioFile.value = file
  audioFileName.value = file.name

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }

  const arrayBuffer = await file.arrayBuffer()
  originalBuffer = await audioContext.decodeAudioData(arrayBuffer)
  currentBuffer = originalBuffer

  history.value = [currentBuffer]
  historyIndex.value = 0

  const url = URL.createObjectURL(file)

  if (wavesurfer) wavesurfer.destroy()

  const WaveSurfer = (await import('wavesurfer.js')).default
  const RegionsPlugin = (await import('wavesurfer.js/dist/plugins/regions.js')).default

  regionsPlugin = RegionsPlugin.create()

  wavesurfer = WaveSurfer.create({
    container: waveformContainer.value,
    waveColor: '#22c55e',
    progressColor: '#4ade80',
    cursorColor: '#fbbf24',
    cursorWidth: 1,
    barWidth: 1,
    barGap: 1,
    height: 200,
    normalize: true,
    plugins: [regionsPlugin]
  })

  wavesurfer.load(url)

  wavesurfer.on('ready', () => {
    isLoading.value = false
    duration.value = wavesurfer.getDuration()
    wavesurfer.zoom(zoomLevel.value)
  })

  wavesurfer.on('audioprocess', () => currentTime.value = wavesurfer.getCurrentTime())
  wavesurfer.on('timeupdate', () => currentTime.value = wavesurfer.getCurrentTime())
  wavesurfer.on('play', () => isPlaying.value = true)
  wavesurfer.on('pause', () => isPlaying.value = false)
  wavesurfer.on('finish', () => isPlaying.value = false)

  wavesurfer.on('interaction', () => {
    regionsPlugin.clearRegions()
    selectedRegion.value = null
  })

  regionsPlugin.enableDragSelection({
    color: 'rgba(251, 191, 36, 0.15)'
  })

  regionsPlugin.on('region-created', (region) => {
    regionsPlugin.getRegions().forEach(r => {
      if (r.id !== region.id) r.remove()
    })
    selectedRegion.value = region
    regionStart.value = region.start
    regionEnd.value = region.end
  })

  regionsPlugin.on('region-updated', (region) => {
    regionStart.value = region.start
    regionEnd.value = region.end
  })
}

const handleZoom = (e) => {
  zoomLevel.value = parseInt(e.target.value)
  if (wavesurfer) wavesurfer.zoom(zoomLevel.value)
}

const reloadWaveform = async () => {
  if (!currentBuffer || !wavesurfer) return
  const blob = await bufferToWave(currentBuffer)
  const url = URL.createObjectURL(blob)
  wavesurfer.load(url)
  wavesurfer.on('ready', () => {
    duration.value = wavesurfer.getDuration()
    wavesurfer.zoom(zoomLevel.value)
    isProcessing.value = false
  })
}

const bufferToWave = (buffer) => {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length * numChannels * 2
  const arrayBuffer = new ArrayBuffer(44 + length)
  const view = new DataView(arrayBuffer)

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true)
  view.setUint16(32, numChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

const saveToHistory = (buffer) => {
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(buffer)
  historyIndex.value = history.value.length - 1
}

const undo = async () => {
  if (!canUndo.value) return
  isProcessing.value = true
  historyIndex.value--
  currentBuffer = history.value[historyIndex.value]
  await reloadWaveform()
}

const redo = async () => {
  if (!canRedo.value) return
  isProcessing.value = true
  historyIndex.value++
  currentBuffer = history.value[historyIndex.value]
  await reloadWaveform()
}

const trimToSelection = async () => {
  if (!selectedRegion.value || !currentBuffer) return
  isProcessing.value = true
  const start = Math.floor(regionStart.value * currentBuffer.sampleRate)
  const end = Math.floor(regionEnd.value * currentBuffer.sampleRate)
  const length = end - start
  const newBuffer = audioContext.createBuffer(currentBuffer.numberOfChannels, length, currentBuffer.sampleRate)
  for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
    const oldData = currentBuffer.getChannelData(ch)
    const newData = newBuffer.getChannelData(ch)
    for (let i = 0; i < length; i++) newData[i] = oldData[start + i]
  }
  currentBuffer = newBuffer
  saveToHistory(currentBuffer)
  selectedRegion.value = null
  await reloadWaveform()
}

const deleteSelection = async () => {
  if (!selectedRegion.value || !currentBuffer) return
  isProcessing.value = true
  const start = Math.floor(regionStart.value * currentBuffer.sampleRate)
  const end = Math.floor(regionEnd.value * currentBuffer.sampleRate)
  const length = currentBuffer.length - (end - start)
  const newBuffer = audioContext.createBuffer(currentBuffer.numberOfChannels, length, currentBuffer.sampleRate)
  for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
    const oldData = currentBuffer.getChannelData(ch)
    const newData = newBuffer.getChannelData(ch)
    for (let i = 0; i < start; i++) newData[i] = oldData[i]
    for (let i = end; i < currentBuffer.length; i++) newData[i - (end - start)] = oldData[i]
  }
  currentBuffer = newBuffer
  saveToHistory(currentBuffer)
  selectedRegion.value = null
  await reloadWaveform()
}

const applyFadeIn = async () => {
  if (!selectedRegion.value || !currentBuffer) return
  isProcessing.value = true
  const start = Math.floor(regionStart.value * currentBuffer.sampleRate)
  const end = Math.floor(regionEnd.value * currentBuffer.sampleRate)
  const newBuffer = audioContext.createBuffer(currentBuffer.numberOfChannels, currentBuffer.length, currentBuffer.sampleRate)
  for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
    const oldData = currentBuffer.getChannelData(ch)
    const newData = newBuffer.getChannelData(ch)
    for (let i = 0; i < currentBuffer.length; i++) {
      if (i >= start && i < end) {
        newData[i] = oldData[i] * ((i - start) / (end - start))
      } else {
        newData[i] = oldData[i]
      }
    }
  }
  currentBuffer = newBuffer
  saveToHistory(currentBuffer)
  await reloadWaveform()
}

const applyFadeOut = async () => {
  if (!selectedRegion.value || !currentBuffer) return
  isProcessing.value = true
  const start = Math.floor(regionStart.value * currentBuffer.sampleRate)
  const end = Math.floor(regionEnd.value * currentBuffer.sampleRate)
  const newBuffer = audioContext.createBuffer(currentBuffer.numberOfChannels, currentBuffer.length, currentBuffer.sampleRate)
  for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
    const oldData = currentBuffer.getChannelData(ch)
    const newData = newBuffer.getChannelData(ch)
    for (let i = 0; i < currentBuffer.length; i++) {
      if (i >= start && i < end) {
        newData[i] = oldData[i] * (1 - (i - start) / (end - start))
      } else {
        newData[i] = oldData[i]
      }
    }
  }
  currentBuffer = newBuffer
  saveToHistory(currentBuffer)
  await reloadWaveform()
}

const normalize = async () => {
  if (!currentBuffer) return
  isProcessing.value = true
  let maxPeak = 0
  for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
    const data = currentBuffer.getChannelData(ch)
    for (let i = 0; i < data.length; i++) maxPeak = Math.max(maxPeak, Math.abs(data[i]))
  }
  if (maxPeak === 0) { isProcessing.value = false; return }
  const gain = 1 / maxPeak
  const newBuffer = audioContext.createBuffer(currentBuffer.numberOfChannels, currentBuffer.length, currentBuffer.sampleRate)
  for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
    const oldData = currentBuffer.getChannelData(ch)
    const newData = newBuffer.getChannelData(ch)
    for (let i = 0; i < currentBuffer.length; i++) newData[i] = oldData[i] * gain
  }
  currentBuffer = newBuffer
  saveToHistory(currentBuffer)
  await reloadWaveform()
}

const silenceSelection = async () => {
  if (!selectedRegion.value || !currentBuffer) return
  isProcessing.value = true
  const start = Math.floor(regionStart.value * currentBuffer.sampleRate)
  const end = Math.floor(regionEnd.value * currentBuffer.sampleRate)
  const newBuffer = audioContext.createBuffer(currentBuffer.numberOfChannels, currentBuffer.length, currentBuffer.sampleRate)
  for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
    const oldData = currentBuffer.getChannelData(ch)
    const newData = newBuffer.getChannelData(ch)
    for (let i = 0; i < currentBuffer.length; i++) {
      newData[i] = (i >= start && i < end) ? 0 : oldData[i]
    }
  }
  currentBuffer = newBuffer
  saveToHistory(currentBuffer)
  await reloadWaveform()
}

const exportAudio = async () => {
  if (!currentBuffer) return
  const blob = await bufferToWave(currentBuffer)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = audioFileName.value.replace(/\.[^/.]+$/, '') + '_edited.wav'
  a.click()
  URL.revokeObjectURL(url)
}

const togglePlay = () => wavesurfer?.playPause()
const stop = () => { wavesurfer?.stop(); isPlaying.value = false }
const setVolume = (e) => { volume.value = parseFloat(e.target.value); wavesurfer?.setVolume(volume.value) }

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00:000'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`
}

const formatShortTime = (seconds) => {
  if (!seconds) return '0.0s'
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds/60)}m ${Math.floor(seconds%60)}s`
}

const skipBackward = () => wavesurfer?.skip(-5)
const skipForward = () => wavesurfer?.skip(5)

const clearFile = () => {
  wavesurfer?.destroy()
  wavesurfer = null
  audioFile.value = null
  audioFileName.value = ''
  selectedRegion.value = null
  history.value = []
  historyIndex.value = -1
  currentBuffer = null
  originalBuffer = null
}

onUnmounted(() => {
  wavesurfer?.destroy()
  audioContext?.close()
})
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-neutral-950 text-neutral-300 select-none">
    <!-- Processing -->
    <div v-if="isProcessing" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="flex items-center gap-3 px-5 py-3 bg-neutral-900 border border-neutral-800 rounded">
        <div class="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm">Procesando...</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-1 gap-px text-xs shrink-0">
      <!-- File -->
      <div class="flex items-center border-r border-neutral-800 pr-1">
        <button @click="fileInput?.click()" class="h-7 px-2.5 rounded hover:bg-neutral-800 flex items-center gap-1.5 transition-colors">
          <svg class="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          Open
        </button>
        <button v-if="audioFile" @click="exportAudio" class="h-7 px-2.5 rounded hover:bg-neutral-800 flex items-center gap-1.5 transition-colors">
          <svg class="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export
        </button>
      </div>

      <!-- History -->
      <div v-if="audioFile" class="flex items-center border-r border-neutral-800 px-1">
        <button @click="undo" :disabled="!canUndo" :class="['h-7 w-7 rounded flex items-center justify-center transition-colors', canUndo ? 'hover:bg-neutral-800' : 'opacity-30']">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
        </button>
        <button @click="redo" :disabled="!canRedo" :class="['h-7 w-7 rounded flex items-center justify-center transition-colors', canRedo ? 'hover:bg-neutral-800' : 'opacity-30']">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
          </svg>
        </button>
      </div>

      <!-- Edit -->
      <div v-if="audioFile" class="flex items-center border-r border-neutral-800 px-1">
        <button @click="trimToSelection" :disabled="!selectedRegion" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', selectedRegion ? 'hover:bg-neutral-800' : 'opacity-30']">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
          Trim
        </button>
        <button @click="deleteSelection" :disabled="!selectedRegion" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', selectedRegion ? 'hover:bg-neutral-800' : 'opacity-30']">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          Delete
        </button>
        <button @click="silenceSelection" :disabled="!selectedRegion" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', selectedRegion ? 'hover:bg-neutral-800' : 'opacity-30']">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
          Silence
        </button>
      </div>

      <!-- FX -->
      <div v-if="audioFile" class="flex items-center border-r border-neutral-800 px-1">
        <button @click="applyFadeIn" :disabled="!selectedRegion" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', selectedRegion ? 'hover:bg-neutral-800' : 'opacity-30']">
          Fade In
        </button>
        <button @click="applyFadeOut" :disabled="!selectedRegion" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', selectedRegion ? 'hover:bg-neutral-800' : 'opacity-30']">
          Fade Out
        </button>
        <button @click="normalize" class="h-7 px-2 rounded hover:bg-neutral-800 transition-colors">
          Normalize
        </button>
      </div>

      <!-- Zoom -->
      <div v-if="audioFile" class="flex items-center gap-2 px-2 ml-auto text-neutral-500">
        <span class="text-[10px] uppercase tracking-wider">Zoom</span>
        <input type="range" min="10" max="200" :value="zoomLevel" @input="handleZoom" class="w-20 h-1 bg-neutral-800 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-500 [&::-webkit-slider-thumb]:rounded-sm"/>
      </div>
    </div>

    <!-- Main -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Waveform Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Empty State -->
        <div
          v-if="!audioFile"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
          @click="fileInput?.click()"
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

        <!-- Loading -->
        <div v-else-if="isLoading" class="flex-1 flex items-center justify-center">
          <div class="flex items-center gap-3">
            <div class="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-neutral-400 text-sm">Loading audio...</span>
          </div>
        </div>

        <!-- Waveform -->
        <div v-else class="flex-1 flex flex-col">
          <!-- Waveform Container -->
          <div
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @drop="handleDrop"
            class="flex-1 relative bg-neutral-900/50 border-y border-neutral-800"
          >
            <!-- Grid -->
            <div class="absolute inset-0" style="background-image: linear-gradient(to right, rgba(64,64,64,0.3) 1px, transparent 1px); background-size: 100px 100%;"></div>
            <div class="absolute inset-x-0 top-1/2 h-px bg-neutral-800"></div>

            <!-- Waveform -->
            <div ref="waveformContainer" class="absolute inset-0"></div>

            <!-- Selection Badge -->
            <div v-if="selectedRegion" class="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-xs">
              <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              <span class="text-amber-400 font-mono">{{ formatTime(regionStart) }}</span>
              <span class="text-amber-600">to</span>
              <span class="text-amber-400 font-mono">{{ formatTime(regionEnd) }}</span>
            </div>

            <!-- Hint -->
            <div v-else class="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-neutral-900/90 rounded text-[10px] text-neutral-600">
              Click and drag to select region
            </div>
          </div>

          <!-- Timeline -->
          <div class="h-6 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 text-[10px] text-neutral-600 font-mono">
            <div class="flex-1">{{ formatTime(currentTime) }}</div>
            <div>{{ formatTime(duration) }}</div>
          </div>
        </div>

        <!-- Transport -->
        <div v-if="audioFile && !isLoading" class="h-16 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center gap-2 shrink-0">
          <button @click="skipBackward" class="w-9 h-9 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
          </button>

          <button @click="stop" class="w-9 h-9 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>
          </button>

          <button @click="togglePlay" :class="['w-11 h-11 rounded-full flex items-center justify-center transition-all', isPlaying ? 'bg-green-600 text-white' : 'bg-green-500 text-white hover:bg-green-400']">
            <svg v-if="!isPlaying" class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
          </button>

          <button @click="skipForward" class="w-9 h-9 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
          </button>

          <div class="flex items-center gap-2 ml-4 pl-4 border-l border-neutral-800">
            <svg class="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
            </svg>
            <input type="range" min="0" max="1" step="0.01" :value="volume" @input="setVolume" class="w-16 h-1 bg-neutral-800 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-400 [&::-webkit-slider-thumb]:rounded-sm"/>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div v-if="audioFile && !isLoading" class="w-52 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
        <!-- File -->
        <div class="p-3 border-b border-neutral-800">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
              <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-neutral-200 truncate">{{ audioFileName }}</p>
              <p class="text-[10px] text-neutral-600">{{ formatShortTime(fileInfo?.duration) }}</p>
            </div>
            <button @click="clearFile" class="w-6 h-6 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="p-3 border-b border-neutral-800 space-y-2">
          <p class="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">Info</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p class="text-neutral-600 text-[10px]">Channels</p>
              <p class="text-neutral-300 font-mono">{{ fileInfo?.channels === 2 ? 'Stereo' : 'Mono' }}</p>
            </div>
            <div>
              <p class="text-neutral-600 text-[10px]">Sample Rate</p>
              <p class="text-neutral-300 font-mono">{{ (fileInfo?.sampleRate / 1000).toFixed(1) }}k</p>
            </div>
            <div>
              <p class="text-neutral-600 text-[10px]">Bit Depth</p>
              <p class="text-neutral-300 font-mono">16 bit</p>
            </div>
            <div>
              <p class="text-neutral-600 text-[10px]">Duration</p>
              <p class="text-neutral-300 font-mono">{{ formatShortTime(fileInfo?.duration) }}</p>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="p-3 border-b border-neutral-800">
          <p class="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">History</p>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1.5 bg-neutral-800 rounded overflow-hidden">
              <div class="h-full bg-green-500/50 transition-all" :style="{ width: ((historyIndex + 1) / history.length * 100) + '%' }"></div>
            </div>
            <span class="text-[10px] text-neutral-500 font-mono">{{ historyIndex + 1 }}/{{ history.length }}</span>
          </div>
        </div>

        <!-- Export -->
        <div class="mt-auto p-3">
          <button @click="exportAudio" class="w-full h-8 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export WAV
          </button>
        </div>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="audio/*" class="hidden" @change="handleFileSelect"/>
  </div>
</template>
