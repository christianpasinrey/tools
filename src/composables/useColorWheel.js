import { ref, computed, watch } from 'vue'

// Color conversion utilities
const hslToRgb = (h, s, l) => {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

const rgbToHsl = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
    h *= 360
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
}

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0]
}

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

const hslToHex = (h, s, l) => {
  const [r, g, b] = hslToRgb(h, s, l)
  return rgbToHex(r, g, b)
}

const hexToHsl = (hex) => {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

// Harmony modes
const harmonyModes = {
  analogous: {
    name: 'Análogo',
    description: 'Colores adyacentes en la rueda',
    angles: [-30, -15, 0, 15, 30]
  },
  monochromatic: {
    name: 'Monocromático',
    description: 'Variaciones de un solo color',
    angles: [0, 0, 0, 0, 0],
    lightnessOffsets: [-20, -10, 0, 10, 20]
  },
  triadic: {
    name: 'Triádico',
    description: 'Tres colores equidistantes',
    angles: [0, 120, 180, 240, 300]
  },
  complementary: {
    name: 'Complementario',
    description: 'Colores opuestos',
    angles: [-30, -15, 0, 180, 195]
  },
  splitComplementary: {
    name: 'Complementario dividido',
    description: 'Un color y dos adyacentes al opuesto',
    angles: [0, 150, 180, 210, 30]
  },
  doubleComplementary: {
    name: 'Doble complementario',
    description: 'Dos pares de complementarios',
    angles: [0, 30, 180, 210, 60]
  },
  square: {
    name: 'Cuadrado',
    description: 'Cuatro colores equidistantes',
    angles: [0, 90, 180, 270, 45]
  },
  compound: {
    name: 'Compuesto',
    description: 'Combinación armónica',
    angles: [0, 30, 180, 150, 210]
  },
  shades: {
    name: 'Tonos',
    description: 'Diferentes intensidades',
    angles: [0, 0, 0, 0, 0],
    saturationOffsets: [-30, -15, 0, 15, 30]
  },
  custom: {
    name: 'Personalizado',
    description: 'Colores extraidos de imagen o personalizados',
    angles: [0, 0, 0, 0, 0],
    freeMode: true // Don't apply harmony constraints
  }
}

export function useColorWheel() {
  // Current harmony mode
  const currentMode = ref('analogous')

  // Active color index (which swatch is selected for display)
  const activeColorIndex = ref(2)

  // Base color index (the one that controls harmony - marked with triangle)
  const baseColorIndex = ref(2)

  // Base lightness (shared by all colors)
  const baseLightness = ref(50)

  // Individual color points - each has its own hue and saturation
  const colorPoints = ref([
    { hue: 170, saturation: 80 },
    { hue: 185, saturation: 80 },
    { hue: 200, saturation: 80 },
    { hue: 215, saturation: 80 },
    { hue: 230, saturation: 80 }
  ])

  // Apply harmony mode - recalculate all points based on base color
  const applyHarmony = () => {
    const mode = harmonyModes[currentMode.value]
    const baseIdx = baseColorIndex.value
    const baseHue = colorPoints.value[baseIdx].hue
    const baseSat = colorPoints.value[baseIdx].saturation

    // Find the angle offset for the base color in the mode
    const baseAngleOffset = mode.angles[baseIdx]

    colorPoints.value = colorPoints.value.map((_, i) => {
      // Calculate hue relative to base
      let h = (baseHue + (mode.angles[i] - baseAngleOffset) + 360) % 360
      let s = baseSat

      // Apply saturation offsets for shades mode
      if (mode.saturationOffsets) {
        const satOffset = mode.saturationOffsets[i] - (mode.saturationOffsets[baseIdx] || 0)
        s = Math.max(10, Math.min(100, baseSat + satOffset))
      }

      return { hue: h, saturation: s }
    })
  }

  // Update a color point - ALL points move together maintaining harmony (unless freeMode)
  const updateColorPoint = (index, hue, saturation) => {
    const newHue = (hue + 360) % 360
    const newSat = Math.max(10, Math.min(100, saturation))
    const mode = harmonyModes[currentMode.value]

    // In freeMode (custom), only move the dragged point
    if (mode.freeMode) {
      colorPoints.value = colorPoints.value.map((point, i) => {
        if (i === index) {
          return { hue: newHue, saturation: newSat }
        }
        return point
      })
      return
    }

    // Calculate the hue offset for this point in the harmony
    const pointAngleOffset = mode.angles[index]

    // Calculate the "base hue" (the reference point at angle 0)
    const baseHue = (newHue - pointAngleOffset + 360) % 360

    // Move ALL points based on the new base hue and saturation
    colorPoints.value = colorPoints.value.map((point, i) => {
      let h = (baseHue + mode.angles[i] + 360) % 360
      let s = newSat

      // Apply saturation offsets for modes that have them (shades)
      if (mode.saturationOffsets) {
        const satOffset = mode.saturationOffsets[i] - (mode.saturationOffsets[index] || 0)
        s = Math.max(10, Math.min(100, newSat + satOffset))
      }

      return { hue: h, saturation: s }
    })
  }

  // Set which color is the base (harmony controller)
  const setBaseColor = (index) => {
    baseColorIndex.value = index
  }

  // Generate palette from color points
  const palette = computed(() => {
    const mode = harmonyModes[currentMode.value]

    return colorPoints.value.map((point, i) => {
      let l = baseLightness.value

      // Apply lightness offsets for monochromatic
      if (mode.lightnessOffsets) {
        l = Math.max(10, Math.min(90, l + mode.lightnessOffsets[i]))
      }

      const [r, g, b] = hslToRgb(point.hue, point.saturation, l)
      const hex = rgbToHex(r, g, b)

      return {
        index: i,
        hue: point.hue,
        saturation: point.saturation,
        lightness: l,
        hex,
        rgb: { r, g, b },
        hsl: { h: point.hue, s: point.saturation, l },
        cssRgb: `rgb(${r}, ${g}, ${b})`,
        cssHsl: `hsl(${point.hue}, ${point.saturation}%, ${l}%)`
      }
    })
  })

  // Active color
  const activeColor = computed(() => {
    return palette.value[activeColorIndex.value]
  })

  // Set color from hex for active color
  const setColorFromHex = (hex) => {
    const [h, s, l] = hexToHsl(hex)
    updateColorPoint(activeColorIndex.value, h, s)
    baseLightness.value = l
  }

  // Set color from RGB for active color
  const setColorFromRgb = (r, g, b) => {
    const [h, s, l] = rgbToHsl(r, g, b)
    updateColorPoint(activeColorIndex.value, h, s)
    baseLightness.value = l
  }

  // Set hue from wheel click (for active color)
  const setHueFromWheel = (angle) => {
    const current = colorPoints.value[activeColorIndex.value]
    updateColorPoint(activeColorIndex.value, angle, current.saturation)
  }

  // Copy color to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }

  // Export palette
  const exportPalette = (format) => {
    const colors = palette.value

    switch (format) {
      case 'css':
        return `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')}\n}`

      case 'scss':
        return colors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join('\n')

      case 'json':
        return JSON.stringify(colors.map(c => ({
          hex: c.hex,
          rgb: c.cssRgb,
          hsl: c.cssHsl
        })), null, 2)

      case 'array':
        return `[${colors.map(c => `'${c.hex}'`).join(', ')}]`

      case 'tailwind':
        return `colors: {\n  palette: {\n${colors.map((c, i) => `    ${(i + 1) * 100}: '${c.hex}',`).join('\n')}\n  }\n}`

      default:
        return colors.map(c => c.hex).join('\n')
    }
  }

  // Random palette
  const randomize = () => {
    const baseHue = Math.floor(Math.random() * 360)
    const baseSat = Math.floor(Math.random() * 40) + 60 // 60-100
    baseLightness.value = Math.floor(Math.random() * 30) + 40 // 40-70

    // Set base color and apply harmony
    colorPoints.value[2] = { hue: baseHue, saturation: baseSat }
    applyHarmony()
  }

  // Extract colors from image using color quantization
  const extractColorsFromImage = (imageDataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'

      img.onload = () => {
        // Create canvas to read pixels
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Resize to sample (faster processing)
        const maxSize = 100
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data

        // Collect all colors with frequency
        const colorMap = new Map()

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]

          // Skip transparent pixels
          if (a < 128) continue

          // Quantize colors (group similar colors)
          const qr = Math.round(r / 32) * 32
          const qg = Math.round(g / 32) * 32
          const qb = Math.round(b / 32) * 32

          const key = `${qr},${qg},${qb}`

          if (colorMap.has(key)) {
            const entry = colorMap.get(key)
            entry.count++
            entry.r += r
            entry.g += g
            entry.b += b
          } else {
            colorMap.set(key, { r, g, b, count: 1 })
          }
        }

        // Convert to array and sort by frequency
        const sortedColors = Array.from(colorMap.values())
          .filter(c => {
            // Filter out very dark and very light colors
            const [h, s, l] = rgbToHsl(c.r / c.count, c.g / c.count, c.b / c.count)
            return l > 10 && l < 90 && s > 15
          })
          .sort((a, b) => b.count - a.count)

        // Get top 5 distinct colors
        const selectedColors = []
        const minHueDiff = 25 // Minimum hue difference between colors

        for (const color of sortedColors) {
          if (selectedColors.length >= 5) break

          const avgR = Math.round(color.r / color.count)
          const avgG = Math.round(color.g / color.count)
          const avgB = Math.round(color.b / color.count)
          const [h, s, l] = rgbToHsl(avgR, avgG, avgB)

          // Check if this hue is distinct enough from already selected
          const isDistinct = selectedColors.every(sc => {
            const hueDiff = Math.min(Math.abs(sc.hue - h), 360 - Math.abs(sc.hue - h))
            return hueDiff > minHueDiff || Math.abs(sc.saturation - s) > 20
          })

          if (isDistinct || selectedColors.length < 2) {
            selectedColors.push({ hue: h, saturation: s, lightness: l })
          }
        }

        // Fill remaining slots if needed
        while (selectedColors.length < 5) {
          const baseColor = selectedColors[0] || { hue: 200, saturation: 70, lightness: 50 }
          selectedColors.push({
            hue: (baseColor.hue + selectedColors.length * 30) % 360,
            saturation: baseColor.saturation,
            lightness: baseColor.lightness
          })
        }

        // Apply extracted colors
        colorPoints.value = selectedColors.map(c => ({
          hue: c.hue,
          saturation: c.saturation
        }))

        // Set average lightness
        const avgLightness = selectedColors.reduce((sum, c) => sum + c.lightness, 0) / selectedColors.length
        baseLightness.value = Math.round(avgLightness)

        // Switch to custom mode (don't apply harmony, keep extracted colors as-is)
        currentMode.value = 'custom'

        resolve(selectedColors)
      }

      img.onerror = () => reject(new Error('Error loading image'))
      img.src = imageDataUrl
    })
  }

  return {
    // State
    colorPoints,
    baseLightness,
    currentMode,
    activeColorIndex,
    baseColorIndex,

    // Computed
    palette,
    activeColor,
    harmonyModes,

    // Methods
    setColorFromHex,
    setColorFromRgb,
    setHueFromWheel,
    copyToClipboard,
    exportPalette,
    randomize,
    applyHarmony,
    updateColorPoint,
    setBaseColor,
    extractColorsFromImage,

    // Utils
    hslToRgb,
    rgbToHsl,
    hslToHex,
    hexToHsl,
    hexToRgb,
    rgbToHex
  }
}
