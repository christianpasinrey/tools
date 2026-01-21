<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

const props = defineProps({
  visible: Boolean,
  pageIndex: Number,
  pdfBytes: Object,
  totalPages: Number,
  themeColor: String
})

const emit = defineEmits(['close', 'prev', 'next'])

const canvas = ref(null)
const zoom = ref(1)
const isRendering = ref(false)
const pageRef = ref(null)

const zoomLevels = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

const canPrev = computed(() => props.pageIndex > 0)
const canNext = computed(() => props.pageIndex < props.totalPages - 1)

const renderPage = async () => {
  if (!props.pdfBytes || props.pageIndex === null || !canvas.value) return

  isRendering.value = true

  try {
    const pdfJsDoc = await pdfjsLib.getDocument({ data: props.pdfBytes.slice() }).promise
    const page = await pdfJsDoc.getPage(props.pageIndex + 1)
    pageRef.value = page

    const scale = zoom.value * 1.5 // Higher base resolution
    const viewport = page.getViewport({ scale })

    canvas.value.width = viewport.width
    canvas.value.height = viewport.height

    const ctx = canvas.value.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    pdfJsDoc.destroy()
  } catch (error) {
    console.error('Error rendering page:', error)
  } finally {
    isRendering.value = false
  }
}

const zoomIn = () => {
  const idx = zoomLevels.findIndex(z => z >= zoom.value)
  if (idx < zoomLevels.length - 1) {
    zoom.value = zoomLevels[idx + 1]
  }
}

const zoomOut = () => {
  const idx = zoomLevels.findIndex(z => z >= zoom.value)
  if (idx > 0) {
    zoom.value = zoomLevels[idx - 1]
  }
}

const handleKeydown = (e) => {
  if (!props.visible) return

  switch (e.key) {
    case 'Escape':
      emit('close')
      break
    case 'ArrowLeft':
      if (canPrev.value) emit('prev')
      break
    case 'ArrowRight':
      if (canNext.value) emit('next')
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
  }
}

watch([() => props.visible, () => props.pageIndex, zoom], () => {
  if (props.visible && props.pageIndex !== null) {
    renderPage()
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex flex-col bg-black/95"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div class="flex items-center gap-4">
            <span class="text-sm text-neutral-400">
              Página {{ pageIndex + 1 }} de {{ totalPages }}
            </span>
          </div>

          <!-- Zoom controls -->
          <div class="flex items-center gap-2">
            <button
              @click="zoomOut"
              :disabled="zoom <= zoomLevels[0]"
              class="p-2 rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>
            <span class="text-sm text-neutral-300 w-16 text-center font-mono">
              {{ Math.round(zoom * 100) }}%
            </span>
            <button
              @click="zoomIn"
              :disabled="zoom >= zoomLevels[zoomLevels.length - 1]"
              class="p-2 rounded hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Close button -->
          <button
            @click="emit('close')"
            class="p-2 rounded hover:bg-neutral-800 transition-colors"
          >
            <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Canvas area -->
        <div class="flex-1 overflow-auto flex items-center justify-center p-4">
          <div class="relative">
            <canvas
              ref="canvas"
              class="max-w-full shadow-2xl bg-white"
              :style="{ opacity: isRendering ? 0.5 : 1 }"
            />
            <div v-if="isRendering" class="absolute inset-0 flex items-center justify-center">
              <div
                class="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                :style="{ borderColor: themeColor, borderTopColor: 'transparent' }"
              />
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-center gap-4 py-3 border-t border-neutral-800">
          <button
            @click="emit('prev')"
            :disabled="!canPrev"
            class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="canPrev ? 'hover:bg-neutral-800 text-neutral-300' : 'text-neutral-600'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
          <button
            @click="emit('next')"
            :disabled="!canNext"
            class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="canNext ? 'hover:bg-neutral-800 text-neutral-300' : 'text-neutral-600'"
          >
            Siguiente
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Keyboard shortcuts hint -->
        <div class="text-center py-2 text-xs text-neutral-600">
          Usa las flechas ← → para navegar, +/- para zoom, Esc para cerrar
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: all 0.2s ease-out;
}
.modal-leave-active {
  transition: all 0.15s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
