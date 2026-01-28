<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useColorWheel } from '../composables/useColorWheel'

const colorWheel = useColorWheel()

const wheelCanvasRef = ref(null)
const wheelContainerRef = ref(null)
const draggingPointIndex = ref(null)
const copiedIndex = ref(null)
const activeTab = ref('wheel') // 'wheel' | 'palette' | 'export'

// Wheel dimensions - smaller for mobile
const wheelSize = 260
const wheelCenter = wheelSize / 2
const wheelRadius = 110

// Draw the color wheel
const drawWheel = () => {
  const canvas = wheelCanvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, wheelSize, wheelSize)

  for (let angle = 0; angle < 360; angle += 1) {
    for (let r = 0; r <= wheelRadius; r += 2) {
      const startAngle = (angle - 90 - 0.5) * Math.PI / 180
      const endAngle = (angle - 90 + 1.5) * Math.PI / 180

      ctx.beginPath()
      ctx.arc(wheelSize / 2, wheelSize / 2, r + 1, startAngle, endAngle)
      ctx.arc(wheelSize / 2, wheelSize / 2, Math.max(0, r - 1), endAngle, startAngle, true)
      ctx.closePath()

      const saturation = (r / wheelRadius) * 100
      ctx.fillStyle = `hsl(${angle}, ${saturation}%, ${colorWheel.baseLightness.value}%)`
      ctx.fill()
    }
  }
}

onMounted(() => {
  drawWheel()
  colorWheel.applyHarmony()
  document.addEventListener('touchmove', onGlobalDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
})

onUnmounted(() => {
  document.removeEventListener('touchmove', onGlobalDrag)
  document.removeEventListener('touchend', endDrag)
})

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

const onGlobalDrag = (event) => {
  if (draggingPointIndex.value !== null) {
    event.preventDefault()
    const touch = event.touches[0]
    handlePointDrag({ clientX: touch.clientX, clientY: touch.clientY })
  }
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

const exportFormat = ref('css')
const exportContent = computed(() => colorWheel.exportPalette(exportFormat.value))
const copyExport = async () => await colorWheel.copyToClipboard(exportContent.value)

// Harmony modes as array for easier display
const harmonyOptions = computed(() =>
  Object.entries(colorWheel.harmonyModes).map(([key, mode]) => ({
    key,
    name: mode.name
  }))
)
</script>

<template>
  <div class="flex flex-col h-full app-bg">
    <!-- Header with color strip -->
    <div class="shrink-0">
      <!-- Active color bar -->
      <div
        class="h-16 flex items-end p-3"
        :style="{ backgroundColor: colorWheel.activeColor.value?.hex }"
      >
        <div class="flex items-center justify-between w-full">
          <div>
            <span class="text-white text-lg font-bold drop-shadow-lg">
              {{ colorWheel.activeColor.value?.hex }}
            </span>
            <span class="text-white/70 text-xs drop-shadow ml-2">
              Color {{ colorWheel.activeColorIndex.value + 1 }}
            </span>
          </div>
          <button
            @click="copyColor(colorWheel.activeColor.value, 'hex', colorWheel.activeColorIndex.value)"
            class="px-3 py-1.5 bg-black/30 rounded-lg text-white text-xs backdrop-blur-sm"
          >
            {{ copiedIndex === colorWheel.activeColorIndex.value ? '¡Copiado!' : 'Copiar' }}
          </button>
        </div>
      </div>

      <!-- Palette strip -->
      <div class="flex h-12 border-b border-neutral-800">
        <div
          v-for="(color, index) in colorWheel.palette.value"
          :key="index"
          @click="colorWheel.activeColorIndex.value = index"
          class="flex-1 relative transition-all"
          :class="colorWheel.activeColorIndex.value === index ? 'flex-[1.5]' : ''"
          :style="{ backgroundColor: color.hex }"
        >
          <div
            v-if="colorWheel.activeColorIndex.value === index"
            class="absolute inset-x-0 bottom-0 h-1 bg-white"
          ></div>
          <span class="absolute top-1 left-1 text-[10px] text-white/80 font-bold drop-shadow">
            {{ index + 1 }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-neutral-800 bg-neutral-900/50 shrink-0">
      <button
        @click="activeTab = 'wheel'"
        class="flex-1 py-3 text-xs font-medium transition-colors relative"
        :class="activeTab === 'wheel' ? 'text-pink-400' : 'text-neutral-500'"
      >
        Rueda
        <div v-if="activeTab === 'wheel'" class="absolute bottom-0 inset-x-4 h-0.5 bg-pink-500 rounded-full"></div>
      </button>
      <button
        @click="activeTab = 'palette'"
        class="flex-1 py-3 text-xs font-medium transition-colors relative"
        :class="activeTab === 'palette' ? 'text-pink-400' : 'text-neutral-500'"
      >
        Paleta
        <div v-if="activeTab === 'palette'" class="absolute bottom-0 inset-x-4 h-0.5 bg-pink-500 rounded-full"></div>
      </button>
      <button
        @click="activeTab = 'export'"
        class="flex-1 py-3 text-xs font-medium transition-colors relative"
        :class="activeTab === 'export' ? 'text-pink-400' : 'text-neutral-500'"
      >
        Exportar
        <div v-if="activeTab === 'export'" class="absolute bottom-0 inset-x-4 h-0.5 bg-pink-500 rounded-full"></div>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto pb-24">
      <!-- Wheel Tab -->
      <div v-if="activeTab === 'wheel'" class="p-4 space-y-4">
        <!-- Harmony selector -->
        <div class="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <button
            v-for="mode in harmonyOptions"
            :key="mode.key"
            @click="colorWheel.currentMode.value = mode.key"
            class="px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-all"
            :class="colorWheel.currentMode.value === mode.key
              ? 'bg-pink-500/20 border-pink-500 text-pink-400'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400'"
          >
            {{ mode.name }}
          </button>
        </div>

        <!-- Color Wheel -->
        <div class="flex justify-center">
          <div
            ref="wheelContainerRef"
            class="relative touch-none"
            :style="{ width: wheelSize + 'px', height: wheelSize + 'px' }"
          >
            <canvas
              ref="wheelCanvasRef"
              :width="wheelSize"
              :height="wheelSize"
              class="absolute inset-0 rounded-full"
            />
            <svg :width="wheelSize" :height="wheelSize" class="absolute inset-0">
              <!-- Connection lines -->
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
              <!-- Closing line -->
              <line
                :x1="getPositionFromColor(colorWheel.palette.value[4].hue, colorWheel.palette.value[4].saturation).x"
                :y1="getPositionFromColor(colorWheel.palette.value[4].hue, colorWheel.palette.value[4].saturation).y"
                :x2="getPositionFromColor(colorWheel.palette.value[0].hue, colorWheel.palette.value[0].saturation).x"
                :y2="getPositionFromColor(colorWheel.palette.value[0].hue, colorWheel.palette.value[0].saturation).y"
                stroke="rgba(255,255,255,0.4)"
                stroke-width="2"
                stroke-dasharray="4,4"
              />
              <!-- Color points -->
              <g v-for="(color, index) in colorWheel.palette.value" :key="'point-' + index">
                <circle
                  :cx="getPositionFromColor(color.hue, color.saturation).x"
                  :cy="getPositionFromColor(color.hue, color.saturation).y"
                  :r="colorWheel.activeColorIndex.value === index ? 18 : 14"
                  :fill="color.hex"
                  stroke="white"
                  stroke-width="2"
                  class="cursor-grab"
                  :style="{
                    filter: colorWheel.activeColorIndex.value === index
                      ? 'drop-shadow(0 0 10px rgba(255,255,255,0.6))'
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                  }"
                  @touchstart.prevent="startPointDrag($event, index)"
                />
                <text
                  :x="getPositionFromColor(color.hue, color.saturation).x"
                  :y="getPositionFromColor(color.hue, color.saturation).y + 1"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="white"
                  font-size="11"
                  font-weight="bold"
                  class="pointer-events-none select-none"
                >
                  {{ index + 1 }}
                </text>
              </g>
            </svg>
          </div>
        </div>

        <!-- Lightness slider -->
        <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-4">
          <div class="flex justify-between text-xs mb-2">
            <span class="text-neutral-500">Luminosidad</span>
            <span class="text-neutral-300">{{ colorWheel.baseLightness.value }}%</span>
          </div>
          <input
            type="range"
            v-model.number="colorWheel.baseLightness.value"
            min="10"
            max="90"
            class="w-full h-3 rounded-full appearance-none cursor-pointer"
            :style="{ background: `linear-gradient(to right, hsl(0, 0%, 10%), hsl(0, 0%, 50%), hsl(0, 0%, 90%))` }"
          />
        </div>

        <!-- Action buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="colorWheel.applyHarmony()"
            class="py-3 bg-pink-500/20 active:bg-pink-500/30 text-pink-400 rounded-xl text-sm font-medium"
          >
            Reajustar
          </button>
          <button
            @click="colorWheel.randomize()"
            class="py-3 bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-xl text-sm font-medium"
          >
            Aleatorio
          </button>
        </div>

        <!-- Harmony description -->
        <div class="p-3 bg-neutral-900/30 rounded-xl border border-neutral-800">
          <p class="text-pink-400 text-sm font-medium mb-1">
            {{ colorWheel.harmonyModes[colorWheel.currentMode.value].name }}
          </p>
          <p class="text-neutral-500 text-xs">
            {{ colorWheel.harmonyModes[colorWheel.currentMode.value].description }}
          </p>
        </div>
      </div>

      <!-- Palette Tab -->
      <div v-if="activeTab === 'palette'" class="p-4 space-y-3">
        <div
          v-for="(color, index) in colorWheel.palette.value"
          :key="index"
          class="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden"
        >
          <div
            class="h-20 flex items-end p-3"
            :style="{ backgroundColor: color.hex }"
            @click="colorWheel.activeColorIndex.value = index"
          >
            <div class="flex items-center justify-between w-full">
              <span class="text-white font-mono font-bold drop-shadow-lg">{{ color.hex }}</span>
              <span class="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center text-white text-xs font-bold">
                {{ index + 1 }}
              </span>
            </div>
          </div>
          <div class="p-3 space-y-2">
            <div class="flex gap-2 text-xs">
              <span class="text-neutral-500 w-10">RGB</span>
              <span class="text-neutral-300 font-mono">{{ color.cssRgb }}</span>
            </div>
            <div class="flex gap-2 text-xs">
              <span class="text-neutral-500 w-10">HSL</span>
              <span class="text-neutral-300 font-mono">{{ color.cssHsl }}</span>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                @click="copyColor(color, 'hex', index)"
                class="flex-1 py-2 bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
              >
                {{ copiedIndex === index ? '¡Copiado!' : 'HEX' }}
              </button>
              <button
                @click="copyColor(color, 'rgb', index)"
                class="flex-1 py-2 bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
              >
                RGB
              </button>
              <button
                @click="copyColor(color, 'hsl', index)"
                class="flex-1 py-2 bg-neutral-800 active:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
              >
                HSL
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Tab -->
      <div v-if="activeTab === 'export'" class="p-4 space-y-4">
        <!-- Format selector -->
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="format in ['css', 'scss', 'tailwind', 'json', 'array', 'hex']"
            :key="format"
            @click="exportFormat = format"
            class="px-3 py-2 text-xs rounded-lg border transition-all uppercase"
            :class="exportFormat === format
              ? 'bg-pink-500/20 border-pink-500 text-pink-400'
              : 'bg-neutral-900 border-neutral-700 text-neutral-400'"
          >
            {{ format }}
          </button>
        </div>

        <!-- Export content -->
        <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
          <pre class="text-xs text-neutral-300 font-mono overflow-x-auto whitespace-pre-wrap">{{ exportContent }}</pre>
        </div>

        <!-- Copy button -->
        <button
          @click="copyExport"
          class="w-full py-3 bg-pink-500/20 active:bg-pink-500/30 text-pink-400 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copiar código
        </button>

        <!-- Quick copy all -->
        <div class="bg-neutral-900/50 rounded-xl border border-neutral-800 p-3">
          <h3 class="text-xs text-neutral-500 uppercase tracking-wider mb-3">Copiar rápido</h3>
          <div class="space-y-2">
            <div
              v-for="(color, index) in colorWheel.palette.value"
              :key="index"
              class="flex items-center gap-3"
            >
              <div class="w-8 h-8 rounded-lg shrink-0" :style="{ backgroundColor: color.hex }"></div>
              <button
                @click="copyColor(color, 'hex', index)"
                class="flex-1 text-left text-sm font-mono text-neutral-300 active:text-white"
              >
                {{ color.hex }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 2px solid #333;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
</style>
