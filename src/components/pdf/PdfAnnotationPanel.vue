<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  annotations: Array,
  selectedPageIndex: Number,
  themeColor: String
})

const emit = defineEmits(['close', 'add', 'remove', 'clear', 'update'])

const selectedAnnotationId = ref(null)
const textContent = ref('')
const textColor = ref('#000000')
const textSize = ref(14)
const positionX = ref(50)
const positionY = ref(50)
const hasBg = ref(false)
const bgColor = ref('#ffff00')

const colors = ['#000000', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ffffff']
const bgColors = ['#ffff00', '#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#000000', '#ffffff']

const isEditing = computed(() => selectedAnnotationId.value !== null)

const pageAnnotations = computed(() => {
  return props.annotations.filter(a => a.pageIndex === props.selectedPageIndex)
})

const selectAnnotation = (ann) => {
  selectedAnnotationId.value = ann.id
  textContent.value = ann.content
  textColor.value = ann.color
  textSize.value = ann.size
  positionX.value = ann.x
  positionY.value = ann.y
  hasBg.value = ann.hasBg || false
  bgColor.value = ann.bgColor || '#ffff00'
}

const clearSelection = () => {
  selectedAnnotationId.value = null
  textContent.value = ''
  textColor.value = '#000000'
  textSize.value = 14
  positionX.value = 50
  positionY.value = 50
  hasBg.value = false
  bgColor.value = '#ffff00'
}

const handleSubmit = () => {
  if (!textContent.value.trim()) return

  if (isEditing.value) {
    // Update existing
    emit('update', {
      id: selectedAnnotationId.value,
      content: textContent.value,
      color: textColor.value,
      size: textSize.value,
      x: positionX.value,
      y: positionY.value,
      hasBg: hasBg.value,
      bgColor: bgColor.value
    })
    clearSelection()
  } else {
    // Add new
    emit('add', {
      id: `ann-${Date.now()}`,
      type: 'text',
      pageIndex: props.selectedPageIndex,
      content: textContent.value,
      color: textColor.value,
      size: textSize.value,
      x: positionX.value,
      y: positionY.value,
      hasBg: hasBg.value,
      bgColor: bgColor.value
    })
    textContent.value = ''
  }
}

// Clear selection when changing pages
watch(() => props.selectedPageIndex, () => {
  clearSelection()
})

// Auto-update annotation while editing
watch([textContent, textColor, textSize, positionX, positionY, hasBg, bgColor], () => {
  if (isEditing.value) {
    emit('update', {
      id: selectedAnnotationId.value,
      content: textContent.value,
      color: textColor.value,
      size: textSize.value,
      x: positionX.value,
      y: positionY.value,
      hasBg: hasBg.value,
      bgColor: bgColor.value
    })
  }
})
</script>

<template>
  <Transition name="slide">
    <div
      v-if="visible"
      class="absolute right-0 top-0 bottom-0 w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col z-10"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 class="text-sm font-medium text-white">
          {{ isEditing ? 'Editar anotación' : 'Nueva anotación' }}
        </h3>
        <button
          @click="emit('close')"
          class="p-1 hover:bg-neutral-800 rounded transition-colors"
        >
          <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Add annotation form -->
      <div class="p-4 border-b border-neutral-800 space-y-4">
        <div>
          <label class="text-xs text-neutral-500 block mb-2">Texto</label>
          <textarea
            v-model="textContent"
            placeholder="Escribe tu anotación..."
            rows="2"
            class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-300 resize-none focus:outline-none focus:border-neutral-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-neutral-500 block mb-2">Color texto</label>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="color in colors"
                :key="color"
                @click="textColor = color"
                class="w-5 h-5 rounded transition-transform hover:scale-110 border border-neutral-600"
                :class="textColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900' : ''"
                :style="{ backgroundColor: color }"
              />
            </div>
          </div>
          <div>
            <label class="text-xs text-neutral-500 block mb-2">Tamaño</label>
            <input
              v-model.number="textSize"
              type="number"
              min="1"
              max="200"
              class="w-full px-2 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-sm text-neutral-300 focus:outline-none"
            />
          </div>
        </div>

        <!-- Background -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="hasBg"
              v-model="hasBg"
              class="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-green-500 focus:ring-0"
            />
            <label for="hasBg" class="text-xs text-neutral-500 cursor-pointer">Fondo</label>
          </div>
          <div v-if="hasBg" class="flex flex-wrap gap-1">
            <button
              v-for="color in bgColors"
              :key="'bg-' + color"
              @click="bgColor = color"
              class="w-5 h-5 rounded transition-transform hover:scale-110 border border-neutral-600"
              :class="bgColor === color ? 'ring-2 ring-white ring-offset-1 ring-offset-neutral-900' : ''"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-neutral-500 block mb-2">Posición X (%)</label>
            <input
              v-model.number="positionX"
              type="range"
              min="0"
              max="100"
              class="w-full"
              :style="{ accentColor: themeColor }"
            />
            <span class="text-xs text-neutral-500">{{ positionX }}%</span>
          </div>
          <div>
            <label class="text-xs text-neutral-500 block mb-2">Posición Y (%)</label>
            <input
              v-model.number="positionY"
              type="range"
              min="0"
              max="100"
              class="w-full"
              :style="{ accentColor: themeColor }"
            />
            <span class="text-xs text-neutral-500">{{ positionY }}%</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            v-if="isEditing"
            @click="clearSelection"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors bg-neutral-700 hover:bg-neutral-600 text-white"
          >
            Cancelar
          </button>
          <button
            @click="handleSubmit"
            :disabled="!textContent.trim() || selectedPageIndex === null"
            class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :style="{ backgroundColor: themeColor, color: 'white' }"
          >
            {{ isEditing ? 'Guardar cambios' : 'Añadir anotación' }}
          </button>
        </div>

        <p v-if="selectedPageIndex === null" class="text-xs text-yellow-500 text-center">
          Selecciona una página para añadir anotaciones
        </p>
      </div>

      <!-- Annotations list -->
      <div class="flex-1 overflow-auto">
        <div v-if="annotations.length === 0" class="p-4 text-center text-sm text-neutral-600">
          No hay anotaciones
        </div>
        <div v-else class="divide-y divide-neutral-800">
          <div
            v-for="ann in annotations"
            :key="ann.id"
            @click="selectAnnotation(ann)"
            class="px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors"
            :class="selectedAnnotationId === ann.id ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'"
            :style="selectedAnnotationId === ann.id ? { borderLeft: `3px solid ${themeColor}` } : {}"
          >
            <div
              class="w-3 h-3 rounded-full shrink-0 mt-1 border border-neutral-600"
              :style="{ backgroundColor: ann.color }"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-neutral-300 truncate">{{ ann.content }}</p>
              <p class="text-xs text-neutral-600">
                Página {{ ann.pageIndex + 1 }} · {{ ann.size }}px
              </p>
            </div>
            <button
              @click.stop="emit('remove', ann.id)"
              class="p-1 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="annotations.length > 0" class="p-4 border-t border-neutral-800">
        <button
          @click="emit('clear')"
          class="w-full py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Eliminar todas las anotaciones
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active {
  transition: transform 0.2s ease-out;
}
.slide-leave-active {
  transition: transform 0.15s ease-in;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
