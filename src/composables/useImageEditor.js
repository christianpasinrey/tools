import { ref, computed, shallowRef } from 'vue'

export function useImageEditor() {
  // State
  const canvas = shallowRef(null)
  const ctx = shallowRef(null)
  const originalImage = shallowRef(null)
  const imageFileName = ref('')
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const themeColor = ref('#22c55e')

  // Image state
  const imageWidth = ref(0)
  const imageHeight = ref(0)
  const zoom = ref(1)
  const rotation = ref(0)
  const flipH = ref(false)
  const flipV = ref(false)

  // Adjustments
  const brightness = ref(0)
  const contrast = ref(0)
  const saturation = ref(0)
  const exposure = ref(0)
  const highlights = ref(0)
  const shadows = ref(0)
  const temperature = ref(0)
  const sharpness = ref(0)
  const blur = ref(0)

  // Crop state
  const isCropping = ref(false)
  const cropRect = ref({ x: 0, y: 0, width: 0, height: 0 })

  // History
  const history = ref([])
  const historyIndex = ref(-1)
  const maxHistory = 50

  // Computed
  const hasFile = computed(() => !!originalImage.value)
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  const fileInfo = computed(() => {
    if (!originalImage.value) return null
    return {
      width: imageWidth.value,
      height: imageHeight.value,
      aspectRatio: (imageWidth.value / imageHeight.value).toFixed(2)
    }
  })

  // Initialize canvas
  const initCanvas = (canvasEl) => {
    canvas.value = canvasEl
    ctx.value = canvasEl.getContext('2d', { willReadFrequently: true })
  }

  // Load image file
  const loadFile = (file) => {
    return new Promise((resolve, reject) => {
      isLoading.value = true
      imageFileName.value = file.name

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          originalImage.value = img
          imageWidth.value = img.width
          imageHeight.value = img.height

          // Reset adjustments
          resetAdjustments()

          // Clear history
          history.value = []
          historyIndex.value = -1

          // Draw and save initial state
          renderImage()
          saveToHistory()

          isLoading.value = false
          resolve()
        }
        img.onerror = () => {
          isLoading.value = false
          reject(new Error('Failed to load image'))
        }
        img.src = e.target.result
      }
      reader.onerror = () => {
        isLoading.value = false
        reject(new Error('Failed to read file'))
      }
      reader.readAsDataURL(file)
    })
  }

  // Reset all adjustments
  const resetAdjustments = () => {
    brightness.value = 0
    contrast.value = 0
    saturation.value = 0
    exposure.value = 0
    highlights.value = 0
    shadows.value = 0
    temperature.value = 0
    sharpness.value = 0
    blur.value = 0
    rotation.value = 0
    flipH.value = false
    flipV.value = false
    zoom.value = 1
  }

  // Render image with current adjustments
  const renderImage = () => {
    if (!canvas.value || !ctx.value || !originalImage.value) return

    const img = originalImage.value
    let w = img.width
    let h = img.height

    // Handle rotation
    const isRotated = rotation.value === 90 || rotation.value === 270
    if (isRotated) {
      canvas.value.width = h
      canvas.value.height = w
    } else {
      canvas.value.width = w
      canvas.value.height = h
    }

    const c = ctx.value
    c.clearRect(0, 0, canvas.value.width, canvas.value.height)

    c.save()

    // Move to center for transformations
    c.translate(canvas.value.width / 2, canvas.value.height / 2)

    // Apply rotation
    c.rotate((rotation.value * Math.PI) / 180)

    // Apply flip
    c.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1)

    // Draw image centered
    c.drawImage(img, -w / 2, -h / 2, w, h)

    c.restore()

    // Apply filters
    applyFilters()
  }

  // Apply CSS-like filters using ImageData
  const applyFilters = () => {
    if (!ctx.value || !canvas.value) return

    const c = ctx.value
    const w = canvas.value.width
    const h = canvas.value.height

    if (w === 0 || h === 0) return

    const imageData = c.getImageData(0, 0, w, h)
    const data = imageData.data

    // Apply adjustments pixel by pixel
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Exposure (multiply)
      if (exposure.value !== 0) {
        const exp = Math.pow(2, exposure.value / 100)
        r *= exp
        g *= exp
        b *= exp
      }

      // Brightness (add)
      if (brightness.value !== 0) {
        const br = brightness.value * 2.55
        r += br
        g += br
        b += br
      }

      // Contrast
      if (contrast.value !== 0) {
        const factor = (259 * (contrast.value + 255)) / (255 * (259 - contrast.value))
        r = factor * (r - 128) + 128
        g = factor * (g - 128) + 128
        b = factor * (b - 128) + 128
      }

      // Temperature (warm/cool)
      if (temperature.value !== 0) {
        r += temperature.value * 0.5
        b -= temperature.value * 0.5
      }

      // Highlights & Shadows
      const luma = 0.299 * r + 0.587 * g + 0.114 * b
      if (highlights.value !== 0 && luma > 128) {
        const factor = ((luma - 128) / 127) * (highlights.value / 100)
        r += factor * 30
        g += factor * 30
        b += factor * 30
      }
      if (shadows.value !== 0 && luma < 128) {
        const factor = ((128 - luma) / 128) * (shadows.value / 100)
        r += factor * 30
        g += factor * 30
        b += factor * 30
      }

      // Saturation
      if (saturation.value !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        const sat = 1 + saturation.value / 100
        r = gray + sat * (r - gray)
        g = gray + sat * (g - gray)
        b = gray + sat * (b - gray)
      }

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }

    c.putImageData(imageData, 0, 0)

    // Apply blur if needed (using CSS filter on canvas)
    if (blur.value > 0) {
      c.filter = `blur(${blur.value}px)`
      c.drawImage(canvas.value, 0, 0)
      c.filter = 'none'
    }
  }

  // Set adjustment value and re-render
  const setAdjustment = (name, value) => {
    switch (name) {
      case 'brightness': brightness.value = value; break
      case 'contrast': contrast.value = value; break
      case 'saturation': saturation.value = value; break
      case 'exposure': exposure.value = value; break
      case 'highlights': highlights.value = value; break
      case 'shadows': shadows.value = value; break
      case 'temperature': temperature.value = value; break
      case 'sharpness': sharpness.value = value; break
      case 'blur': blur.value = value; break
    }
    renderImage()
  }

  // Rotate image
  const rotate = (degrees) => {
    rotation.value = (rotation.value + degrees + 360) % 360
    renderImage()
    saveToHistory()
  }

  // Flip horizontal
  const flipHorizontal = () => {
    flipH.value = !flipH.value
    renderImage()
    saveToHistory()
  }

  // Flip vertical
  const flipVertical = () => {
    flipV.value = !flipV.value
    renderImage()
    saveToHistory()
  }

  // Apply current adjustments permanently
  const applyAdjustments = () => {
    if (!canvas.value || !originalImage.value) return

    isProcessing.value = true

    // Create new image from current canvas state
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.value.width
    tempCanvas.height = canvas.value.height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(canvas.value, 0, 0)

    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      imageWidth.value = img.width
      imageHeight.value = img.height
      resetAdjustments()
      renderImage()
      saveToHistory()
      isProcessing.value = false
    }
    img.src = tempCanvas.toDataURL('image/png')
  }

  // Crop functionality
  const startCrop = () => {
    isCropping.value = true
    cropRect.value = {
      x: canvas.value.width * 0.1,
      y: canvas.value.height * 0.1,
      width: canvas.value.width * 0.8,
      height: canvas.value.height * 0.8
    }
  }

  const applyCrop = () => {
    if (!isCropping.value || !canvas.value) return

    isProcessing.value = true
    const { x, y, width, height } = cropRect.value

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(canvas.value, x, y, width, height, 0, 0, width, height)

    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      imageWidth.value = img.width
      imageHeight.value = img.height
      isCropping.value = false
      resetAdjustments()
      renderImage()
      saveToHistory()
      isProcessing.value = false
    }
    img.src = tempCanvas.toDataURL('image/png')
  }

  const cancelCrop = () => {
    isCropping.value = false
  }

  // Filters
  const applyFilter = (filterName) => {
    if (!canvas.value || !ctx.value) return

    isProcessing.value = true

    const c = ctx.value
    const w = canvas.value.width
    const h = canvas.value.height
    const imageData = c.getImageData(0, 0, w, h)
    const data = imageData.data

    switch (filterName) {
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
          data[i] = data[i + 1] = data[i + 2] = gray
        }
        break

      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
        }
        break

      case 'invert':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i]
          data[i + 1] = 255 - data[i + 1]
          data[i + 2] = 255 - data[i + 2]
        }
        break

      case 'vintage':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2]
          data[i] = Math.min(255, r * 0.9 + 40)
          data[i + 1] = Math.min(255, g * 0.7 + 20)
          data[i + 2] = Math.min(255, b * 0.5)
        }
        break

      case 'cold':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] * 0.9
          data[i + 2] = Math.min(255, data[i + 2] * 1.2)
        }
        break

      case 'warm':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.2)
          data[i + 2] = data[i + 2] * 0.9
        }
        break
    }

    c.putImageData(imageData, 0, 0)

    // Update original from filtered result
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = w
    tempCanvas.height = h
    const tempCtx = tempCanvas.getContext('2d')
    tempCtx.drawImage(canvas.value, 0, 0)

    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      resetAdjustments()
      renderImage()
      saveToHistory()
      isProcessing.value = false
    }
    img.src = tempCanvas.toDataURL('image/png')
  }

  // History management
  const saveToHistory = () => {
    if (!canvas.value) return

    // Remove any redo states
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Save current state
    const state = {
      imageData: canvas.value.toDataURL('image/png'),
      width: canvas.value.width,
      height: canvas.value.height
    }

    history.value.push(state)

    // Limit history size
    if (history.value.length > maxHistory) {
      history.value.shift()
    }

    historyIndex.value = history.value.length - 1
  }

  const undo = () => {
    if (!canUndo.value) return
    historyIndex.value--
    restoreFromHistory()
  }

  const redo = () => {
    if (!canRedo.value) return
    historyIndex.value++
    restoreFromHistory()
  }

  const restoreFromHistory = () => {
    const state = history.value[historyIndex.value]
    if (!state) return

    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      imageWidth.value = state.width
      imageHeight.value = state.height
      resetAdjustments()
      renderImage()
    }
    img.src = state.imageData
  }

  // Export
  const exportImage = (format = 'png', quality = 0.92) => {
    if (!canvas.value) return

    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
    const dataUrl = canvas.value.toDataURL(mimeType, quality)

    const link = document.createElement('a')
    const baseName = imageFileName.value.replace(/\.[^.]+$/, '')
    link.download = `${baseName}_edited.${format}`
    link.href = dataUrl
    link.click()
  }

  // Zoom
  const setZoom = (value) => {
    zoom.value = Math.max(0.1, Math.min(5, value))
  }

  // Theme
  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Clear
  const clearFile = () => {
    originalImage.value = null
    imageFileName.value = ''
    history.value = []
    historyIndex.value = -1
    resetAdjustments()
    if (canvas.value && ctx.value) {
      ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    }
  }

  return {
    // State
    canvas,
    originalImage,
    imageFileName,
    isLoading,
    isProcessing,
    themeColor,
    imageWidth,
    imageHeight,
    zoom,
    rotation,
    flipH,
    flipV,
    isCropping,
    cropRect,

    // Adjustments
    brightness,
    contrast,
    saturation,
    exposure,
    highlights,
    shadows,
    temperature,
    sharpness,
    blur,

    // History
    history,
    historyIndex,

    // Computed
    hasFile,
    canUndo,
    canRedo,
    fileInfo,

    // Methods
    initCanvas,
    loadFile,
    renderImage,
    setAdjustment,
    applyAdjustments,
    rotate,
    flipHorizontal,
    flipVertical,
    startCrop,
    applyCrop,
    cancelCrop,
    applyFilter,
    undo,
    redo,
    exportImage,
    setZoom,
    setThemeColor,
    clearFile,
    resetAdjustments
  }
}
