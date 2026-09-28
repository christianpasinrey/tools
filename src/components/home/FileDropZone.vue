<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { onKeyStroke } from '@vueuse/core'
import Icon from '../icons/Icon.vue'
import { matchFile, fileExtension } from '@/lib/fileMatch'
import { getCategory } from '@/config/catalog'
import { useRecentTools } from '@/composables/useRecentTools'
import { useDevice } from '@/composables/useDevice'
import { openTool } from '@/lib/openTool'

const router = useRouter()
const { recordVisit } = useRecentTools()
const { isMobile } = useDevice()
const dragging = ref(false)
const dropped = ref(null)
const input = ref(null)
let depth = 0

const options = computed(() => dropped.value ? matchFile(dropped.value) : [])
const hasFiles = (e) => Array.from(e.dataTransfer?.types || []).includes('Files')
const sizeLabel = (bytes) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

function onEnter(e) { if (!hasFiles(e)) return; e.preventDefault(); depth += 1; dragging.value = true }
function onOver(e) { if (hasFiles(e)) e.preventDefault() }
function onLeave(e) { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) dragging.value = false }
function onDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  depth = 0
  dragging.value = false
  if (!file) return
  e.preventDefault()
  dropped.value = file
}
function onPick(e) {
  const file = e.target.files?.[0]
  if (file) dropped.value = file
  e.target.value = ''
}
function choose(entry) {
  if (isMobile.value && !entry.mobile) return
  const file = dropped.value
  dropped.value = null
  openTool(router, entry, { file, recordVisit })
}

onKeyStroke('Escape', () => { dropped.value = null; dragging.value = false })
onMounted(() => {
  window.addEventListener('dragenter', onEnter)
  window.addEventListener('dragover', onOver)
  window.addEventListener('dragleave', onLeave)
  window.addEventListener('drop', onDrop)
})
onUnmounted(() => {
  window.removeEventListener('dragenter', onEnter)
  window.removeEventListener('dragover', onOver)
  window.removeEventListener('dragleave', onLeave)
  window.removeEventListener('drop', onDrop)
})

defineExpose({ pick: () => input.value?.click() })
</script>

<template>
  <input ref="input" type="file" class="sr-only" tabindex="-1" aria-hidden="true" data-test="drop-input" @change="onPick" />
  <Teleport to="body">
    <Transition name="tb-drop">
      <div v-if="dragging" data-test="drop-overlay" class="tb-drop-overlay fixed inset-0 z-[150] grid place-items-center p-6 font-ui pointer-events-none">
        <div class="tb-drop-frame">
          <Icon name="upload" :size="44" class="tb-drop-icon" />
          <p class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Suéltalo aquí</p>
          <p class="text-tb-muted mt-2">y te digo qué puedes hacer con él</p>
        </div>
      </div>
    </Transition>
    <Transition name="tb-palette">
      <div v-if="dropped" class="fixed inset-0 z-[160] flex items-end sm:items-center justify-center sm:p-4 font-ui">
        <div class="tb-palette-backdrop absolute inset-0 bg-black/35 backdrop-blur-[3px]" aria-hidden="true" @click="dropped = null"></div>
        <section role="dialog" aria-modal="true" aria-labelledby="tb-drop-title"
                 class="tb-palette-panel relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-tb-line bg-tb-surface text-tb-ink shadow-[var(--tb-shadow-lift)] p-5">
          <div class="flex items-center gap-3">
            <span class="grid place-items-center w-11 h-11 rounded-xl bg-tb-surface-2"><Icon name="file" :size="22" /></span>
            <div class="min-w-0">
              <p id="tb-drop-title" class="font-display text-lg font-bold truncate">{{ dropped.name }}</p>
              <p class="text-xs text-tb-muted font-code">{{ fileExtension(dropped.name) || 'sin extensión' }} · {{ sizeLabel(dropped.size) }}</p>
            </div>
            <button type="button" class="ml-auto p-2 rounded-lg hover:bg-tb-surface-2" aria-label="Cerrar" @click="dropped = null"><Icon name="x" :size="18" /></button>
          </div>
          <p v-if="options.length" class="mt-5 mb-2 text-sm text-tb-muted">¿Qué quieres hacer?</p>
          <div v-if="options.length" class="grid gap-2">
            <button v-for="entry in options" :key="entry.id" type="button" data-test="drop-option"
                    class="tb-drop-option" :style="{ '--cat': `var(--cat-${entry.category})` }"
                    :aria-disabled="isMobile && !entry.mobile" @click="choose(entry)">
              <span class="grid place-items-center w-9 h-9 rounded-lg shrink-0" style="color: var(--cat); background: color-mix(in srgb, var(--cat) 14%, transparent)">
                <Icon :name="getCategory(entry.category).icon" :size="18" />
              </span>
              <span class="min-w-0 text-left">
                <span class="block font-medium">{{ entry.name }}</span>
                <span class="block text-xs text-tb-muted">{{ isMobile && !entry.mobile ? 'Disponible en escritorio' : entry.task }}</span>
              </span>
              <Icon name="arrow-right" :size="16" class="ml-auto text-tb-muted" />
            </button>
          </div>
          <p v-else class="mt-5 text-sm text-tb-muted">
            Todavía no tengo ninguna herramienta para archivos <strong class="text-tb-ink">{{ fileExtension(dropped.name) || dropped.type || 'de este tipo' }}</strong>.
            Prueba con un PDF, una imagen o un audio.
          </p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
