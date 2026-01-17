<script setup>
const props = defineProps({
  fileName: String,
  fileInfo: Object,
  historyIndex: Number,
  historyLength: Number,
  themeColor: String,
  adjustments: Object
})

const emit = defineEmits(['close', 'export', 'adjustment'])

const adjustmentControls = [
  { id: 'exposure', name: 'Exposición', min: -100, max: 100 },
  { id: 'brightness', name: 'Brillo', min: -100, max: 100 },
  { id: 'contrast', name: 'Contraste', min: -100, max: 100 },
  { id: 'highlights', name: 'Luces', min: -100, max: 100 },
  { id: 'shadows', name: 'Sombras', min: -100, max: 100 },
  { id: 'saturation', name: 'Saturación', min: -100, max: 100 },
  { id: 'temperature', name: 'Temperatura', min: -100, max: 100 },
  { id: 'blur', name: 'Desenfoque', min: 0, max: 20 }
]
</script>

<template>
  <div class="w-64 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0 overflow-hidden">
    <!-- Header -->
    <div class="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" :style="{ color: themeColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <span class="text-neutral-300 text-xs font-medium truncate">{{ fileName }}</span>
      </div>
      <button
        @click="emit('close')"
        class="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Cerrar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- File Info -->
    <div v-if="fileInfo" class="px-3 py-2 border-b border-neutral-800">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span class="text-neutral-600">Ancho</span>
          <p class="text-neutral-400 font-mono">{{ fileInfo.width }}px</p>
        </div>
        <div>
          <span class="text-neutral-600">Alto</span>
          <p class="text-neutral-400 font-mono">{{ fileInfo.height }}px</p>
        </div>
        <div>
          <span class="text-neutral-600">Aspecto</span>
          <p class="text-neutral-400 font-mono">{{ fileInfo.aspectRatio }}</p>
        </div>
        <div>
          <span class="text-neutral-600">Historial</span>
          <div class="flex items-center gap-1">
            <div
              class="h-1.5 rounded-full flex-1 bg-neutral-800 overflow-hidden"
            >
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: historyLength > 0 ? ((historyIndex + 1) / historyLength * 100) + '%' : '0%',
                  backgroundColor: themeColor
                }"
              ></div>
            </div>
            <span class="text-neutral-500 font-mono">{{ historyIndex + 1 }}/{{ historyLength }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Adjustments -->
    <div class="flex-1 overflow-y-auto scrollbar-thin">
      <div class="px-3 py-2">
        <h3 class="text-neutral-500 text-[10px] uppercase tracking-wider mb-3">Ajustes</h3>

        <div class="space-y-3">
          <div v-for="ctrl in adjustmentControls" :key="ctrl.id" class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-neutral-400 text-xs">{{ ctrl.name }}</label>
              <span class="text-neutral-500 text-xs font-mono w-8 text-right">{{ adjustments[ctrl.id] }}</span>
            </div>
            <input
              type="range"
              :min="ctrl.min"
              :max="ctrl.max"
              :value="adjustments[ctrl.id]"
              @input="emit('adjustment', ctrl.id, parseInt($event.target.value))"
              class="w-full h-1 bg-neutral-700 rounded appearance-none cursor-pointer"
              :style="{ accentColor: themeColor }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Export Button -->
    <div class="p-3 border-t border-neutral-800">
      <button
        @click="emit('export')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors"
        :style="{ backgroundColor: themeColor, color: 'white' }"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Exportar imagen
      </button>
    </div>
  </div>
</template>
