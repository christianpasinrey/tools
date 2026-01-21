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

  // Extract colors from image using improved color quantization
  const extractColorsFromImage = (imageDataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Sample at reasonable size
        const maxSize = 150
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width = Math.floor(img.width * scale)
        canvas.height = Math.floor(img.height * scale)

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data

        // Collect pixels as RGB arrays
        const pixelList = []
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]

          if (a < 128) continue
          pixelList.push([r, g, b])
        }

        // Median cut algorithm for color quantization
        const medianCut = (pixels, depth, maxDepth = 4) => {
          if (depth >= maxDepth || pixels.length === 0) {
            if (pixels.length === 0) return []
            // Calculate average color
            const avg = pixels.reduce(
              (acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]],
              [0, 0, 0]
            ).map(v => Math.round(v / pixels.length))
            return [{ color: avg, count: pixels.length }]
          }

          // Find channel with greatest range
          const ranges = [0, 1, 2].map(ch => {
            const values = pixels.map(p => p[ch])
            return Math.max(...values) - Math.min(...values)
          })
          const maxChannel = ranges.indexOf(Math.max(...ranges))

          // Sort by that channel and split
          pixels.sort((a, b) => a[maxChannel] - b[maxChannel])
          const mid = Math.floor(pixels.length / 2)

          return [
            ...medianCut(pixels.slice(0, mid), depth + 1, maxDepth),
            ...medianCut(pixels.slice(mid), depth + 1, maxDepth)
          ]
        }

        // Get quantized colors (16 buckets)
        const quantized = medianCut(pixelList, 0, 4)
          .sort((a, b) => b.count - a.count)

        // Color distance function
        const colorDistance = (c1, c2) => {
          const [h1, s1, l1] = c1
          const [h2, s2, l2] = c2
          // Weighted distance considering hue wrapping
          const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180
          const satDiff = Math.abs(s1 - s2) / 100
          const lightDiff = Math.abs(l1 - l2) / 100
          return hueDiff * 1.5 + satDiff + lightDiff * 0.8
        }

        // Convert to HSL and filter
        const hslColors = quantized
          .map(q => {
            const [h, s, l] = rgbToHsl(q.color[0], q.color[1], q.color[2])
            return { hue: h, saturation: s, lightness: l, count: q.count, rgb: q.color }
          })
          .filter(c => {
            // Keep colors that aren't too gray (unless very light/dark which is ok)
            return c.saturation > 8 || c.lightness < 15 || c.lightness > 85
          })

        // Select 5 most distinct colors
        const selectedColors = []
        const minDistance = 0.25

        for (const color of hslColors) {
          if (selectedColors.length >= 5) break

          const isDistinct = selectedColors.every(sc =>
            colorDistance(
              [color.hue, color.saturation, color.lightness],
              [sc.hue, sc.saturation, sc.lightness]
            ) > minDistance
          )

          if (isDistinct || selectedColors.length === 0) {
            selectedColors.push(color)
          }
        }

        // If we don't have enough distinct colors, add from remaining
        if (selectedColors.length < 5) {
          for (const color of hslColors) {
            if (selectedColors.length >= 5) break
            if (!selectedColors.includes(color)) {
              selectedColors.push(color)
            }
          }
        }

        // Fill remaining with variations
        while (selectedColors.length < 5) {
          const base = selectedColors[0] || { hue: 200, saturation: 70, lightness: 50 }
          selectedColors.push({
            hue: (base.hue + selectedColors.length * 60) % 360,
            saturation: Math.max(20, base.saturation - 10),
            lightness: base.lightness
          })
        }

        // Apply extracted colors
        colorPoints.value = selectedColors.slice(0, 5).map(c => ({
          hue: c.hue,
          saturation: Math.max(10, c.saturation)
        }))

        // Set average lightness
        const avgLightness = selectedColors.slice(0, 5).reduce((sum, c) => sum + c.lightness, 0) / 5
        baseLightness.value = Math.round(Math.max(20, Math.min(80, avgLightness)))

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
