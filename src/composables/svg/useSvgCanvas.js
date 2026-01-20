import { ref, computed } from 'vue'

export function useSvgCanvas() {
  // Artboard dimensions
  const artboardWidth = ref(512)
  const artboardHeight = ref(512)

  // Viewport state
  const zoom = ref(1)
  const panX = ref(0)
  const panY = ref(0)

  // Grid settings
  const showGrid = ref(true)
  const gridSize = ref(16)
  const snapToGrid = ref(true)

  // Presets
  const sizePresets = [
    { name: '16x16', width: 16, height: 16 },
    { name: '24x24', width: 24, height: 24 },
    { name: '32x32', width: 32, height: 32 },
    { name: '48x48', width: 48, height: 48 },
    { name: '64x64', width: 64, height: 64 },
    { name: '128x128', width: 128, height: 128 },
    { name: '256x256', width: 256, height: 256 },
    { name: '512x512', width: 512, height: 512 },
    { name: '1024x1024', width: 1024, height: 1024 }
  ]

  // Computed
  const viewBox = computed(() => {
    return `0 0 ${artboardWidth.value} ${artboardHeight.value}`
  })

  // Methods
  const setArtboardSize = (width, height) => {
    artboardWidth.value = width
    artboardHeight.value = height
  }

  const applyPreset = (preset) => {
    setArtboardSize(preset.width, preset.height)
    // Adjust grid size based on artboard
    if (preset.width <= 32) {
      gridSize.value = 4
    } else if (preset.width <= 64) {
      gridSize.value = 8
    } else if (preset.width <= 128) {
      gridSize.value = 16
    } else {
      gridSize.value = 32
    }
  }

  const zoomIn = () => {
    zoom.value = Math.min(zoom.value * 1.25, 10)
  }

  const zoomOut = () => {
    zoom.value = Math.max(zoom.value / 1.25, 0.1)
  }

  const resetZoom = () => {
    zoom.value = 1
    panX.value = 0
    panY.value = 0
  }

  const fitToView = (containerWidth, containerHeight) => {
    const scaleX = (containerWidth - 80) / artboardWidth.value
    const scaleY = (containerHeight - 80) / artboardHeight.value
    zoom.value = Math.min(scaleX, scaleY, 2)
    panX.value = 0
    panY.value = 0
  }

  // Coordinate transforms
  const screenToSvg = (screenX, screenY, canvasRect) => {
    const centerX = canvasRect.width / 2
    const centerY = canvasRect.height / 2

    const svgX = (screenX - canvasRect.left - centerX - panX.value) / zoom.value + artboardWidth.value / 2
    const svgY = (screenY - canvasRect.top - centerY - panY.value) / zoom.value + artboardHeight.value / 2

    return { x: svgX, y: svgY }
  }

  const snapToGridPoint = (x, y) => {
    if (!snapToGrid.value) return { x, y }
    return {
      x: Math.round(x / gridSize.value) * gridSize.value,
      y: Math.round(y / gridSize.value) * gridSize.value
    }
  }

  const handleWheel = (event, canvasRect) => {
    event.preventDefault()

    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const delta = event.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(10, zoom.value * delta))
      zoom.value = newZoom
    } else {
      // Pan
      panX.value -= event.deltaX
      panY.value -= event.deltaY
    }
  }

  return {
    // State
    artboardWidth,
    artboardHeight,
    zoom,
    panX,
    panY,
    showGrid,
    gridSize,
    snapToGrid,
    sizePresets,

    // Computed
    viewBox,

    // Methods
    setArtboardSize,
    applyPreset,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToView,
    screenToSvg,
    snapToGridPoint,
    handleWheel
  }
}
