<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../icons/Icon.vue'
import { usePalette } from '@/composables/usePalette'
import { useRecentTools } from '@/composables/useRecentTools'
import { useDevice } from '@/composables/useDevice'
import { searchTools, normalize } from '@/lib/toolSearch'
import { getCategory } from '@/config/catalog'
import { openTool } from '@/lib/openTool'
import { toggleDark } from '@/composables/useTheme'

const router = useRouter()
const { isOpen, open, close, toggle } = usePalette()
const { recent, recordVisit } = useRecentTools()
const { isMobile } = useDevice()

const query = ref('')
const active = ref(0)
const input = ref(null)
const list = ref(null)
let returnFocus = null

const THEME_ACTION = { id: 'action-theme', name: 'Cambiar tema claro / oscuro', task: 'Acción', kind: 'action', category: null }
const THEME_WORDS = ['tema', 'oscuro', 'claro', 'dark', 'light', 'modo']

const items = computed(() => {
  const q = query.value.trim()
  if (!q) {
    const recentItems = recent.value.map(entry => ({ entry, group: 'Recientes' }))
    const seen = new Set(recent.value.map(e => e.id))
    const suggested = searchTools('').map(r => r.entry).filter(e => !seen.has(e.id))
      .map(entry => ({ entry, group: 'Sugerencias' }))
    return [...recentItems, ...suggested].slice(0, 12)
  }
  const found = searchTools(q, undefined, { limit: 30 }).map(({ entry }) => ({ entry, group: getCategory(entry.category)?.name || '' }))
  const nq = normalize(q)
  if (THEME_WORDS.some(w => w.startsWith(nq) || nq.startsWith(w))) found.push({ entry: THEME_ACTION, group: 'Acciones' })
  return found
})

watch(query, () => { active.value = 0 })
watch(isOpen, async (value) => {
  if (value) {
    returnFocus = document.activeElement
    query.value = ''
    active.value = 0
    await nextTick()
    input.value?.focus()
  } else if (returnFocus instanceof HTMLElement) {
    returnFocus.focus()
    returnFocus = null
  }
})

function scrollActiveIntoView() {
  nextTick(() => list.value?.querySelector(`#tb-opt-${active.value}`)?.scrollIntoView?.({ block: 'nearest' }))
}

function select(index) {
  const item = items.value[index]
  if (!item) return
  if (item.entry.kind === 'action') {
    toggleDark()
    close()
    return
  }
  if (isMobile.value && !item.entry.mobile) return
  close()
  openTool(router, item.entry, { recordVisit })
}

function onKeydown(e) {
  const n = items.value.length
  if (e.key === 'ArrowDown') { e.preventDefault(); if (n) active.value = (active.value + 1) % n; scrollActiveIntoView() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) active.value = (active.value - 1 + n) % n; scrollActiveIntoView() }
  else if (e.key === 'Enter') { e.preventDefault(); select(active.value) }
  else if (e.key === 'Escape') { e.preventDefault(); close() }
  else if (e.key === 'Tab') { e.preventDefault() }
}

function isEditable(el) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

function onGlobalKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggle(); return }
  if (e.key === '/' && !isOpen.value && !isEditable(e.target) && !isEditable(document.activeElement)) { e.preventDefault(); open() }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))

const catStyle = (entry) => {
  const c = entry.category ? `var(--cat-${entry.category})` : 'var(--tb-accent)'
  return { color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="tb-palette">
      <div v-if="isOpen" class="tb-palette fixed inset-0 z-[200] flex items-start justify-center sm:p-4 sm:pt-[12vh] font-ui">
        <div class="tb-palette-backdrop absolute inset-0 bg-black/35 backdrop-blur-[3px]" aria-hidden="true" @mousedown="close()"></div>
        <div role="dialog" aria-modal="true" aria-label="Buscar herramienta"
             class="tb-palette-panel relative w-full h-full sm:h-auto sm:max-w-xl sm:rounded-2xl border border-tb-line bg-tb-surface text-tb-ink shadow-[var(--tb-shadow-lift)] overflow-hidden flex flex-col">
          <div class="flex items-center gap-3 px-4 h-14 border-b border-tb-line shrink-0">
            <Icon name="search" :size="18" class="text-tb-muted" />
            <input ref="input" v-model="query" type="text" role="combobox" aria-expanded="true"
                   aria-controls="tb-palette-list" aria-autocomplete="list"
                   :aria-activedescendant="items.length ? `tb-opt-${active}` : undefined"
                   placeholder="¿Qué necesitas hacer?" autocomplete="off" spellcheck="false"
                   class="tb-bare-input flex-1 min-w-0 bg-transparent outline-none text-base placeholder:text-tb-muted"
                   @keydown="onKeydown" />
            <button type="button" class="tb-kbd" @click="close()">Esc</button>
          </div>
          <ul id="tb-palette-list" ref="list" role="listbox" aria-label="Resultados" class="flex-1 sm:max-h-[min(60vh,440px)] overflow-y-auto p-2">
            <template v-for="(item, i) in items" :key="item.entry.id">
              <li v-if="i === 0 || items[i - 1].group !== item.group" role="presentation"
                  class="px-3 pt-3 pb-1 text-[11px] uppercase tracking-[0.12em] text-tb-muted font-code">{{ item.group }}</li>
              <li :id="`tb-opt-${i}`" role="option" :aria-selected="i === active"
                  :aria-disabled="isMobile && item.entry.mobile === false"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                  :class="[i === active && 'bg-tb-surface-2', isMobile && item.entry.mobile === false && 'opacity-50']"
                  @mousemove="active = i" @click="select(i)">
                <span class="grid place-items-center w-8 h-8 rounded-lg shrink-0" :style="catStyle(item.entry)">
                  <Icon :name="item.entry.kind === 'action' ? 'sun' : (getCategory(item.entry.category)?.icon || 'apps')" :size="16" />
                </span>
                <span class="flex-1 min-w-0">
                  <span class="block text-sm font-medium truncate">{{ item.entry.name }}</span>
                  <span class="block text-xs text-tb-muted truncate">{{ isMobile && item.entry.mobile === false ? 'Disponible en escritorio' : item.entry.task }}</span>
                </span>
                <Icon v-if="i === active" name="arrow-right" :size="16" class="text-tb-muted shrink-0" />
              </li>
            </template>
            <li v-if="!items.length" role="presentation" class="px-4 py-12 text-center text-sm text-tb-muted">
              No encuentro nada para “{{ query }}”. Prueba con “pdf”, “color” o “audio”.
            </li>
          </ul>
          <div class="hidden sm:flex items-center gap-4 px-4 h-10 border-t border-tb-line text-xs text-tb-muted shrink-0">
            <span><kbd class="tb-kbd">↑</kbd> <kbd class="tb-kbd">↓</kbd> moverse</span>
            <span><kbd class="tb-kbd">↵</kbd> abrir</span>
            <span class="ml-auto"><kbd class="tb-kbd">/</kbd> buscar desde cualquier sitio</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
