<script setup>
import { ref, computed, watch, useId } from 'vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbButton from '../ui/TbButton.vue'

const uid = useId()

const props = defineProps({
  visible: Boolean,
  annotations: Array,
  selectedPageIndex: Number
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

const colors = [
  { value: '#000000', name: 'Negro' }, { value: '#ef4444', name: 'Rojo' }, { value: '#22c55e', name: 'Verde' },
  { value: '#3b82f6', name: 'Azul' }, { value: '#f59e0b', name: 'Ámbar' }, { value: '#8b5cf6', name: 'Violeta' }, { value: '#ffffff', name: 'Blanco' }
]
const bgColors = [
  { value: '#ffff00', name: 'Amarillo' }, { value: '#22c55e', name: 'Verde' }, { value: '#3b82f6', name: 'Azul' },
  { value: '#ef4444', name: 'Rojo' }, { value: '#f59e0b', name: 'Ámbar' }, { value: '#000000', name: 'Negro' }, { value: '#ffffff', name: 'Blanco' }
]

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
    <aside
      v-if="visible"
      class="absolute right-0 top-0 bottom-0 w-80 max-w-full flex flex-col z-10 border-l border-tb-line bg-tb-surface shadow-[var(--tb-shadow-lift)]"
      aria-label="Anotaciones"
    >
      <header class="flex items-center justify-between h-12 px-4 border-b border-tb-line">
        <h3 class="font-display text-base font-bold text-tb-ink">
          {{ isEditing ? 'Editar anotación' : 'Nueva anotación' }}
        </h3>
        <TbIconButton icon="x" label="Cerrar anotaciones" @click="emit('close')" />
      </header>

      <div class="p-4 border-b border-tb-line space-y-4">
        <div>
          <label :for="`${uid}-text`" class="block mb-1.5 text-xs text-tb-muted">Texto</label>
          <textarea
            :id="`${uid}-text`"
            v-model="textContent"
            placeholder="Escribe tu anotación…"
            rows="2"
            class="ann-field w-full px-3 py-2 text-sm resize-none"
          />
        </div>

        <div class="grid grid-cols-[1fr_auto] gap-3">
          <fieldset>
            <legend class="mb-1.5 text-xs text-tb-muted">Color del texto</legend>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="c in colors"
                :key="c.value"
                type="button"
                class="ann-swatch"
                :aria-label="c.name"
                :aria-pressed="String(textColor === c.value)"
                :style="{ backgroundColor: c.value }"
                @click="textColor = c.value"
              />
            </div>
          </fieldset>
          <div>
            <label :for="`${uid}-size`" class="block mb-1.5 text-xs text-tb-muted">Tamaño</label>
            <input :id="`${uid}-size`" v-model.number="textSize" type="number" min="1" max="200" class="ann-field w-20 h-8 px-2 text-sm font-code" />
          </div>
        </div>

        <fieldset>
          <label class="flex items-center gap-2 mb-1.5 text-xs text-tb-muted cursor-pointer">
            <input v-model="hasBg" type="checkbox" class="w-4 h-4 accent-[var(--cat)]" />
            Fondo
          </label>
          <div v-if="hasBg" class="flex flex-wrap gap-1.5">
            <button
              v-for="c in bgColors"
              :key="'bg-' + c.value"
              type="button"
              class="ann-swatch"
              :aria-label="`Fondo ${c.name.toLowerCase()}`"
              :aria-pressed="String(bgColor === c.value)"
              :style="{ backgroundColor: c.value }"
              @click="bgColor = c.value"
            />
          </div>
        </fieldset>

        <div class="grid grid-cols-2 gap-3">
          <label class="text-xs text-tb-muted">
            Horizontal <span class="font-code text-tb-ink">{{ positionX }} %</span>
            <input v-model.number="positionX" type="range" min="0" max="100" class="w-full mt-1 accent-[var(--cat)]" />
          </label>
          <label class="text-xs text-tb-muted">
            Vertical <span class="font-code text-tb-ink">{{ positionY }} %</span>
            <input v-model.number="positionY" type="range" min="0" max="100" class="w-full mt-1 accent-[var(--cat)]" />
          </label>
        </div>
        <p class="text-xs text-tb-muted">También puedes arrastrar la anotación sobre la página.</p>

        <div class="flex gap-2">
          <TbButton v-if="isEditing" class="flex-1" @click="clearSelection">Listo</TbButton>
          <TbButton
            v-else
            variant="primary"
            icon="plus"
            class="flex-1"
            :disabled="!textContent.trim() || selectedPageIndex === null"
            @click="handleSubmit"
          >
            Añadir a la página {{ selectedPageIndex + 1 }}
          </TbButton>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <p v-if="annotations.length === 0" class="p-6 text-center text-sm text-tb-muted">
          Aún no hay anotaciones.
        </p>
        <ul v-else class="divide-y divide-[var(--tb-line)]">
          <li
            v-for="ann in annotations"
            :key="ann.id"
            class="flex items-center gap-3 pl-4 pr-2 py-2.5 transition-colors"
            :class="selectedAnnotationId === ann.id ? 'bg-[color-mix(in_srgb,var(--cat)_10%,transparent)] shadow-[inset_3px_0_0_var(--cat)]' : 'hover:bg-tb-surface-2'"
          >
            <span class="w-3 h-3 rounded-full shrink-0 ring-1 ring-tb-line-strong" :style="{ backgroundColor: ann.color }" />
            <button type="button" class="flex-1 min-w-0 text-left" @click="selectAnnotation(ann)">
              <span class="block text-sm text-tb-ink truncate">{{ ann.content }}</span>
              <span class="block text-xs text-tb-muted">Página {{ ann.pageIndex + 1 }} · {{ ann.size }} px</span>
            </button>
            <TbIconButton size="sm" icon="trash" tone="danger" :label="`Eliminar «${ann.content}»`" @click="emit('remove', ann.id)" />
          </li>
        </ul>
      </div>

      <footer v-if="annotations.length > 0" class="p-3 border-t border-tb-line">
        <TbButton variant="ghost" icon="trash" class="w-full text-red-700! dark:text-red-300!" @click="emit('clear')">
          Eliminar todas las anotaciones
        </TbButton>
      </footer>
    </aside>
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
.ann-field { border-radius: 9px; border: 1px solid var(--tb-line-strong); background: var(--tb-surface); color: var(--tb-ink); }
.ann-field:focus { outline: none; border-color: var(--cat); box-shadow: 0 0 0 3px color-mix(in srgb, var(--cat) 20%, transparent); }
.ann-swatch { width: 22px; height: 22px; border-radius: 6px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .18); transition: transform .15s; }
.ann-swatch:hover { transform: scale(1.1); }
.ann-swatch[aria-pressed="true"] { outline: 2px solid var(--cat); outline-offset: 2px; }
</style>
