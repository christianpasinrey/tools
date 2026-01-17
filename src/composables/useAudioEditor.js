import { ref, computed, shallowRef } from 'vue'

export function useAudioEditor() {
  // State
  const audioFile = ref(null)
  const audioFileName = ref('')
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const zoomLevel = ref(50)

  // Selection
  const selectedRegion = ref(null)
  const regionStart = ref(0)
  const regionEnd = ref(0)

  // History
  const history = shallowRef([])
  const historyIndex = ref(-1)

  // Internal refs (not reactive for performance)
  let audioContext = null
  let currentBuffer = null
  let wavesurfer = null
  let regionsPlugin = null

  // Computed
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  const hasFile = computed(() => !!audioFile.value)

  const fileInfo = computed(() => {
    if (!currentBuffer) return null
    return {
      channels: currentBuffer.numberOfChannels,
      sampleRate: currentBuffer.sampleRate,
      duration: currentBuffer.duration,
      bitDepth: 16
    }
  })

  // Initialize audio context
  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContext
  }

  // Pending file to load
  let pendingFile = null
  let containerRef = null

  // Load audio file
  const loadFile = async (file, container) => {
    isLoading.value = true
    audioFile.value = file
    audioFileName.value = file.name
    pendingFile = file
    containerRef = container

    initAudioContext()

    try {
      const arrayBuffer = await file.arrayBuffer()
      currentBuffer = await audioContext.decodeAudioData(arrayBuffer)

      history.value = [currentBuffer]
      historyIndex.value = 0

      // Try to init wavesurfer, container might not be ready yet
      if (container) {
        await initWavesurfer(container, file)
      }
    } catch (error) {
      console.error('Error loading audio:', error)
      isLoading.value = false
    }
  }

  // Called when container becomes available
  const setContainer = async (container) => {
    containerRef = container
    if (pendingFile && container && isLoading.value) {
      await initWavesurfer(container, pendingFile)
      pendingFile = null
    }
  }

  // Initialize WaveSurfer
  const initWavesurfer = async (container, file) => {
    if (wavesurfer) {
      wavesurfer.destroy()
      wavesurfer = null
    }

    const WaveSurfer = (await import('wavesurfer.js')).default
    const RegionsPlugin = (await import('wavesurfer.js/dist/plugins/regions.js')).default
    const TimelinePlugin = (await import('wavesurfer.js/dist/plugins/timeline.js')).default
    const MinimapPlugin = (await import('wavesurfer.js/dist/plugins/minimap.js')).default
    const HoverPlugin = (await import('wavesurfer.js/dist/plugins/hover.js')).default

    regionsPlugin = RegionsPlugin.create()

    const timelinePlugin = TimelinePlugin.create({
      height: 20,
      timeInterval: 0.5,
      primaryLabelInterval: 5,
      style: {
        fontSize: '10px',
        color: '#666'
      }
    })

    const minimapContainer = container.closest('.flex-col')?.querySelector('.minimap-container')
    const minimapPlugin = MinimapPlugin.create({
      height: 30,
      waveColor: '#4ade80',
      progressColor: '#22c55e',
      container: minimapContainer
    })

    const hoverPlugin = HoverPlugin.create({
      lineColor: '#fbbf24',
      lineWidth: 1,
      labelBackground: '#1a1a1a',
      labelColor: '#fff',
      labelSize: '10px'
    })

    wavesurfer = WaveSurfer.create({
      container,
      waveColor: '#22c55e',
      progressColor: '#4ade80',
      cursorColor: '#fbbf24',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      height: 'auto',
      normalize: true,
      minPxPerSec: zoomLevel.value,
      fillParent: false,
      autoScroll: true,
      plugins: [regionsPlugin, timelinePlugin, minimapPlugin, hoverPlugin]
    })

    const url = URL.createObjectURL(file)
    wavesurfer.load(url)

    wavesurfer.on('ready', () => {
      isLoading.value = false
      duration.value = wavesurfer.getDuration()
      // Calculate zoom to fit container initially
      const containerWidth = container.clientWidth
      const fitZoom = containerWidth / wavesurfer.getDuration()
      zoomLevel.value = Math.round(fitZoom)
      wavesurfer.zoom(fitZoom)
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

  // Reload waveform after edit
  const reloadWaveform = async () => {
    if (!currentBuffer || !wavesurfer) return
    const blob = bufferToWave(currentBuffer)
    const url = URL.createObjectURL(blob)
    wavesurfer.load(url)
    wavesurfer.once('ready', () => {
      duration.value = wavesurfer.getDuration()
      wavesurfer.zoom(zoomLevel.value)
      isProcessing.value = false
    })
  }

  // Convert AudioBuffer to WAV Blob
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

  // Save to history
  const saveToHistory = (buffer) => {
    history.value = [...history.value.slice(0, historyIndex.value + 1), buffer]
    historyIndex.value = history.value.length - 1
  }

  // Playback controls
  const play = () => wavesurfer?.play()
  const pause = () => wavesurfer?.pause()
  const togglePlay = () => wavesurfer?.playPause()
  const stop = () => { wavesurfer?.stop(); isPlaying.value = false }
  const skipForward = () => wavesurfer?.skip(5)
  const skipBackward = () => wavesurfer?.skip(-5)

  const setVolume = (val) => {
    volume.value = val
    wavesurfer?.setVolume(val)
  }

  const setZoom = (val) => {
    zoomLevel.value = val
    wavesurfer?.zoom(val)
  }

  // Undo/Redo
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

  // Edit operations
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
      for (let i = 0; i < data.length; i++) {
        maxPeak = Math.max(maxPeak, Math.abs(data[i]))
      }
    }

    if (maxPeak === 0) {
      isProcessing.value = false
      return
    }

    const gain = 1 / maxPeak
    const newBuffer = audioContext.createBuffer(currentBuffer.numberOfChannels, currentBuffer.length, currentBuffer.sampleRate)
    for (let ch = 0; ch < currentBuffer.numberOfChannels; ch++) {
      const oldData = currentBuffer.getChannelData(ch)
      const newData = newBuffer.getChannelData(ch)
      for (let i = 0; i < currentBuffer.length; i++) {
        newData[i] = oldData[i] * gain
      }
    }

    currentBuffer = newBuffer
    saveToHistory(currentBuffer)
    await reloadWaveform()
  }

  // Export
  const exportAudio = () => {
    if (!currentBuffer) return
    const blob = bufferToWave(currentBuffer)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = audioFileName.value.replace(/\.[^/.]+$/, '') + '_edited.wav'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Clear
  const clearFile = () => {
    wavesurfer?.destroy()
    wavesurfer = null
    regionsPlugin = null
    audioFile.value = null
    audioFileName.value = ''
    selectedRegion.value = null
    history.value = []
    historyIndex.value = -1
    currentBuffer = null
    currentTime.value = 0
    duration.value = 0
  }

  // Cleanup
  const destroy = () => {
    wavesurfer?.destroy()
    audioContext?.close()
  }

  return {
    // State
    audioFile,
    audioFileName,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    isProcessing,
    zoomLevel,
    selectedRegion,
    regionStart,
    regionEnd,
    history,
    historyIndex,

    // Computed
    canUndo,
    canRedo,
    hasFile,
    fileInfo,

    // Methods
    loadFile,
    setContainer,
    play,
    pause,
    togglePlay,
    stop,
    skipForward,
    skipBackward,
    setVolume,
    setZoom,
    undo,
    redo,
    trimToSelection,
    deleteSelection,
    silenceSelection,
    applyFadeIn,
    applyFadeOut,
    normalize,
    exportAudio,
    clearFile,
    destroy
  }
}
