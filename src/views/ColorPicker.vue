<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useColorWheel } from '../composables/useColorWheel'

const colorWheel = useColorWheel()

const wheelCanvasRef = ref(null)
const wheelContainerRef = ref(null)
const draggingPointIndex = ref(null)
const copiedIndex = ref(null)
const exportFormat = ref('css')
const imageInputRef = ref(null)
const extractedImagePreview = ref(null)
const isExtractingColors = ref(false)

// Wheel dimensions - smaller for compact layout
const wheelSize = 280
const wheelCenter = wheelSize / 2
const wheelRadius = 120
const minRadius = 20

// Draw the color wheel on canvas
const drawWheel = () => {
  const canvas = wheelCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const centerX = wheelSize / 2
  const centerY = wheelSize / 2

  ctx.clearRect(0, 0, wheelSize, wheelSize)

  for (let angle = 0; angle < 360; angle += 1) {
    for (let r = 0; r <= wheelRadius; r += 2) {
      const startAngle = (angle - 90 - 0.5) * Math.PI / 180
      const endAngle = (angle - 90 + 1.5) * Math.PI / 180

      ctx.beginPath()
      ctx.arc(centerX, centerY, r + 1, startAngle, endAngle)
      ctx.arc(centerX, centerY, Math.max(0, r - 1), endAngle, startAngle, true)
      ctx.closePath()

      const saturation = (r / wheelRadius) * 100
      const lightness = colorWheel.baseLightness.value
      ctx.fillStyle = `hsl(${angle}, ${saturation}%, ${lightness}%)`
      ctx.fill()
    }
  }
}

onMounted(() => {
  drawWheel()
  colorWheel.applyHarmony()
  document.addEventListener('mousemove', onGlobalDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onGlobalDrag)
  document.addEventListener('touchend', endDrag)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onGlobalDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onGlobalDrag)
  document.removeEventListener('touchend', endDrag)
})

const onGlobalDrag = (event) => {
  if (draggingPointIndex.value !== null) {
    handlePointDrag(getEventCoords(event))
  }
}

watch(() => colorWheel.baseLightness.value, () => drawWheel())
watch(() => colorWheel.currentMode.value, () => colorWheel.applyHarmony())

const getPositionFromColor = (hue, saturation) => {
  const angle = (hue - 90) * (Math.PI / 180)
  const r = (saturation / 100) * wheelRadius
  return {
    x: wheelCenter + r * Math.cos(angle),
    y: wheelCenter + r * Math.sin(angle)
  }
}

const getColorFromPosition = (x, y) => {
  const dx = x - wheelCenter
  const dy = y - wheelCenter
  const distance = Math.min(Math.sqrt(dx * dx + dy * dy), wheelRadius)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI)
  angle = (angle + 90 + 360) % 360
  const saturation = (distance / wheelRadius) * 100
  return { hue: angle, saturation }
}

const getEventCoords = (event) => {
  if (event.touches && event.touches.length > 0) {
    return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY }
  }
  return { clientX: event.clientX, clientY: event.clientY }
}

const handlePointDrag = (coords) => {
  if (draggingPointIndex.value === null) return
  const container = wheelContainerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const x = (coords.clientX - rect.left) * (wheelSize / rect.width)
  const y = (coords.clientY - rect.top) * (wheelSize / rect.height)

  const { hue, saturation } = getColorFromPosition(x, y)
  colorWheel.updateColorPoint(draggingPointIndex.value, hue, Math.max(10, saturation))
}

const startPointDrag = (event, index) => {
  event.stopPropagation()
  draggingPointIndex.value = index
  colorWheel.activeColorIndex.value = index
}

const onDrag = (event) => {
  if (draggingPointIndex.value !== null) {
    handlePointDrag(getEventCoords(event))
  }
}

const endDrag = () => {
  draggingPointIndex.value = null
}

const copyColor = async (color, format, index) => {
  let text
  switch (format) {
    case 'hex': text = color.hex; break
    case 'rgb': text = color.cssRgb; break
    case 'hsl': text = color.cssHsl; break
    default: text = color.hex
  }
  const success = await colorWheel.copyToClipboard(text)
  if (success) {
    copiedIndex.value = index
    setTimeout(() => copiedIndex.value = null, 1500)
  }
}

const exportContent = computed(() => colorWheel.exportPalette(exportFormat.value))
const copyExport = async () => await colorWheel.copyToClipboard(exportContent.value)

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isExtractingColors.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    const dataUrl = e.target.result
    extractedImagePreview.value = dataUrl
    try {
      await colorWheel.extractColorsFromImage(dataUrl)
    } catch (error) {
      console.error('Error extracting colors:', error)
    } finally {
      isExtractingColors.value = false
    }
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

const clearExtractedImage = () => {
  extractedImagePreview.value = null
}
</script>

<template>
  <div class="h-full bg-neutral-950 p-4 overflow-auto">
    <div class="max-w-[1600px] mx-auto h-full flex flex-col">
      <!-- Compact Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-bold text-white">Color Picker</h1>
          <p class="text-neutral-500 text-sm">Crea paletas de colores armónicas</p>
        </div>
        <!-- Harmony Mode Pills -->
        <div class="flex gap-1.5">
          <button
            v-for="(mode, key) in colorWheel.harmonyModes"
            :key="key"
            @click="colorWheel.currentMode.value = key"
            class="px-3 py-1 text-xs rounded-full border transition-all"
            :class="[
              colorWheel.currentMode.value === key
                ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600'
            ]"
          >
            {{ mode.name }}
          </button>
        </div>
      </div>

      <!-- Main Content - 3 Column Layout -->
      <div class="flex-1 grid grid-cols-[300px,1fr,320px] gap-4 min-h-0">

        <!-- Left Column: Color Wheel -->
        <div class="flex flex-col gap-3">
          <!-- Wheel Container -->
          <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-4">
            <div
              ref="wheelContainerRef"
              class="relative touch-none mx-auto"
              :style="{ width: wheelSize + 'px', height: wheelSize + 'px' }"
              @mousemove="onDrag"
              @mouseup="endDrag"
              @mouseleave="endDrag"
              @touchmove.prevent="onDrag"
              @touchend="endDrag"
            >
              <canvas
                ref="wheelCanvasRef"
                :width="wheelSize"
                :height="wheelSize"
                class="absolute inset-0 rounded-full"
              />
              <svg :width="wheelSize" :height="wheelSize" class="absolute inset-0">
                <g v-for="(color, index) in colorWheel.palette.value" :key="'line-' + index">
                  <line
                    v-if="index > 0"
                    :x1="getPositionFromColor(colorWheel.palette.value[index - 1].hue, colorWheel.palette.value[index - 1].saturation).x"
                    :y1="getPositionFromColor(colorWheel.palette.value[index - 1].hue, colorWheel.palette.value[index - 1].saturation).y"
                    :x2="getPositionFromColor(color.hue, color.saturation).x"
                    :y2="getPositionFromColor(color.hue, color.saturation).y"
                    stroke="rgba(255,255,255,0.4)"
                    stroke-width="2"
                    stroke-dasharray="4,4"
                  />
                </g>
                <line
                  :x1="getPositionFromColor(colorWheel.palette.value[4].hue, colorWheel.palette.value[4].saturation).x"
                  :y1="getPositionFromColor(colorWheel.palette.value[4].hue, colorWheel.palette.value[4].saturation).y"
                  :x2="getPositionFromColor(colorWheel.palette.value[0].hue, colorWheel.palette.value[0].saturation).x"
                  :y2="getPositionFromColor(colorWheel.palette.value[0].hue, colorWheel.palette.value[0].saturation).y"
                  stroke="rgba(255,255,255,0.4)"
                  stroke-width="2"
                  stroke-dasharray="4,4"
                />
                <g v-for="(color, index) in colorWheel.palette.value" :key="'point-' + index">
                  <circle
                    :cx="getPositionFromColor(color.hue, color.saturation).x"
                    :cy="getPositionFromColor(color.hue, color.saturation).y"
                    :r="colorWheel.activeColorIndex.value === index ? 16 : 12"
                    :fill="color.hex"
                    stroke="white"
                    stroke-width="2"
                    class="cursor-grab active:cursor-grabbing"
                    :style="{
                      filter: colorWheel.activeColorIndex.value === index
                        ? 'drop-shadow(0 0 10px rgba(255,255,255,0.6))'
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                    }"
                    @mousedown="startPointDrag($event, index)"
                    @touchstart.prevent="startPointDrag($event, index)"
                  />
                  <text
                    :x="getPositionFromColor(color.hue, color.saturation).x"
                    :y="getPositionFromColor(color.hue, color.saturation).y + 1"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="white"
                    font-size="10"
                    font-weight="bold"
                    class="pointer-events-none select-none"
                    :style="{ textShadow: '0 1px 3px rgba(0,0,0,1)' }"
                  >
                    {{ index + 1 }}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <!-- Controls -->
          <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-3 space-y-3">
            <!-- Lightness Slider -->
            <div>
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-neutral-500">Luminosidad</span>
                <span class="text-neutral-300">{{ colorWheel.baseLightness.value }}%</span>
              </div>
              <input
                type="range"
                v-model.number="colorWheel.baseLightness.value"
                min="10"
                max="90"
                class="w-full h-2 rounded-full appearance-none cursor-pointer"
                :style="{ background: `linear-gradient(to right, hsl(0, 0%, 10%), hsl(0, 0%, 50%), hsl(0, 0%, 90%))` }"
              />
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2">
              <button
                @click="colorWheel.applyHarmony()"
                class="py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reajustar
              </button>
              <button
                @click="colorWheel.randomize()"
                class="py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Aleatorio
              </button>
            </div>

            <!-- Extract from image - Compact -->
            <input ref="imageInputRef" type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
            <button
              @click="imageInputRef?.click()"
              :disabled="isExtractingColors"
              class="w-full py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <svg v-if="!isExtractingColors" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isExtractingColors ? 'Extrayendo...' : 'Extraer de imagen' }}
            </button>

            <!-- Extracted Image Preview -->
            <div v-if="extractedImagePreview" class="relative">
              <img :src="extractedImagePreview" alt="Imagen" class="w-full h-16 object-cover rounded-lg border border-neutral-700" />
              <button
                @click="clearExtractedImage"
                class="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-black rounded-full text-neutral-400 hover:text-white"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Harmony Info - Compact -->
          <div class="p-3 bg-neutral-900/30 rounded-xl border border-neutral-800">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
              <span class="text-white text-sm font-medium">{{ colorWheel.harmonyModes[colorWheel.currentMode.value].name }}</span>
            </div>
            <p class="text-neutral-500 text-xs leading-relaxed">
              {{ colorWheel.harmonyModes[colorWheel.currentMode.value].description }}
            </p>
          </div>
        </div>

        <!-- Center Column: Palette Display -->
        <div class="flex flex-col gap-3 min-h-0">
          <!-- Large Palette Swatches -->
          <div class="flex-1 grid grid-cols-5 gap-3 min-h-0">
            <div
              v-for="(color, index) in colorWheel.palette.value"
              :key="index"
              @click="colorWheel.activeColorIndex.value = index"
              class="rounded-xl cursor-pointer transition-all relative group flex flex-col"
              :class="[
                colorWheel.activeColorIndex.value === index
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-950 scale-[1.02]'
                  : 'hover:scale-[1.01]'
              ]"
              :style="{ backgroundColor: color.hex }"
            >
              <!-- Color Number -->
              <div class="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold">
                {{ index + 1 }}
              </div>

              <!-- Copy Feedback -->
              <div v-if="copiedIndex === index" class="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-green-400 text-xs">
                Copiado
              </div>

              <!-- Color Info Overlay -->
              <div class="mt-auto p-3 bg-gradient-to-t from-black/60 to-transparent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-white font-mono text-sm font-medium">{{ color.hex }}</p>
                <div class="flex gap-2 mt-2">
                  <button
                    @click.stop="copyColor(color, 'hex', index)"
                    class="flex-1 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-xs transition-colors"
                  >
                    HEX
                  </button>
                  <button
                    @click.stop="copyColor(color, 'rgb', index)"
                    class="flex-1 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-xs transition-colors"
                  >
                    RGB
                  </button>
                  <button
                    @click.stop="copyColor(color, 'hsl', index)"
                    class="flex-1 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-xs transition-colors"
                  >
                    HSL
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Palette Strip Preview -->
          <div class="h-12 flex rounded-xl overflow-hidden border border-neutral-800">
            <div
              v-for="(color, index) in colorWheel.palette.value"
              :key="'strip-' + index"
              class="flex-1 transition-all cursor-pointer"
              :class="colorWheel.activeColorIndex.value === index ? 'flex-[1.5]' : ''"
              :style="{ backgroundColor: color.hex }"
              @click="colorWheel.activeColorIndex.value = index"
            />
          </div>
        </div>

        <!-- Right Column: Color Values & Export -->
        <div class="flex flex-col gap-3 min-h-0">
          <!-- Active Color Display -->
          <div
            class="h-24 rounded-xl flex items-end p-3 shrink-0"
            :style="{ backgroundColor: colorWheel.activeColor.value?.hex }"
          >
            <div>
              <span class="text-white text-xl font-bold drop-shadow-lg block">
                {{ colorWheel.activeColor.value?.hex }}
              </span>
              <span class="text-white/70 text-xs drop-shadow">
                Color {{ colorWheel.activeColorIndex.value + 1 }}
              </span>
            </div>
          </div>

          <!-- All Color Values - Compact Table -->
          <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-3 flex-1 overflow-auto">
            <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Valores</h3>
            <div class="space-y-1.5">
              <div
                v-for="(color, index) in colorWheel.palette.value"
                :key="index"
                @click="colorWheel.activeColorIndex.value = index"
                class="flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors"
                :class="colorWheel.activeColorIndex.value === index ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'"
              >
                <div class="w-5 h-5 rounded shrink-0" :style="{ backgroundColor: color.hex }"></div>
                <span class="text-neutral-400 text-xs w-4">{{ index + 1 }}</span>
                <button
                  @click.stop="copyColor(color, 'hex', index)"
                  class="flex-1 text-left text-xs font-mono text-neutral-300 hover:text-white truncate"
                >
                  {{ color.hex }}
                </button>
                <button
                  @click.stop="copyColor(color, 'rgb', index)"
                  class="text-xs font-mono text-neutral-500 hover:text-neutral-300 hidden xl:block"
                >
                  {{ color.rgb.r }},{{ color.rgb.g }},{{ color.rgb.b }}
                </button>
              </div>
            </div>
          </div>

          <!-- Export -->
          <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-3 shrink-0">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Exportar</h3>
              <select
                v-model="exportFormat"
                class="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 focus:outline-none"
              >
                <option value="css">CSS</option>
                <option value="scss">SCSS</option>
                <option value="tailwind">Tailwind</option>
                <option value="json">JSON</option>
                <option value="array">Array</option>
                <option value="hex">HEX</option>
              </select>
            </div>

            <pre class="p-2 bg-neutral-800 rounded-lg text-[10px] text-neutral-300 font-mono overflow-x-auto max-h-28 mb-2">{{ exportContent }}</pre>

            <button
              @click="copyExport"
              class="w-full py-1.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copiar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 2px solid #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 2px solid #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
