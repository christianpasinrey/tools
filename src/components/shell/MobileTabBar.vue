<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { onKeyStroke } from '@vueuse/core'
import Icon from '../icons/Icon.vue'
import { CATEGORIES, benchTasks, getCategory } from '@/config/catalog'
import { usePalette } from '@/composables/usePalette'
import { useRecentTools } from '@/composables/useRecentTools'
import { openTool } from '@/lib/openTool'

const router = useRouter()
const route = useRoute()
const { open: openPalette } = usePalette()
const { recent, recordVisit } = useRecentTools()
const sheet = ref(null) // 'categories' | 'recent' | null

onKeyStroke('Escape', () => { sheet.value = null })

function choose(entry) {
  if (!entry.mobile) return
  sheet.value = null
  openTool(router, entry, { recordVisit })
}
</script>

<template>
  <nav aria-label="Navegación principal" class="fixed inset-x-0 bottom-0 z-50 border-t border-tb-line bg-tb-bg/90 backdrop-blur-md font-ui pb-[env(safe-area-inset-bottom)]">
    <div class="grid grid-cols-4 h-[60px]">
      <router-link to="/" class="tb-tab" :class="route.path === '/' && 'is-active'" @click="sheet = null">
        <Icon name="home" :size="20" /><span>Inicio</span>
      </router-link>
      <button type="button" class="tb-tab" data-test="tab-search" @click="sheet = null; openPalette()">
        <Icon name="search" :size="20" /><span>Buscar</span>
      </button>
      <button type="button" class="tb-tab" data-test="tab-categories" :class="sheet === 'categories' && 'is-active'" :aria-expanded="sheet === 'categories'" @click="sheet = sheet === 'categories' ? null : 'categories'">
        <Icon name="apps" :size="20" /><span>Categorías</span>
      </button>
      <button type="button" class="tb-tab" :class="sheet === 'recent' && 'is-active'" :aria-expanded="sheet === 'recent'" @click="sheet = sheet === 'recent' ? null : 'recent'">
        <Icon name="clock" :size="20" /><span>Recientes</span>
      </button>
    </div>
  </nav>

  <Teleport to="body">
    <Transition name="tb-sheet">
      <div v-if="sheet" class="fixed inset-0 z-[45] font-ui">
        <div class="tb-sheet-backdrop absolute inset-0 bg-black/30" aria-hidden="true" @click="sheet = null"></div>
        <section role="dialog" aria-modal="true" :aria-label="sheet === 'categories' ? 'Categorías' : 'Recientes'"
                 class="tb-sheet-panel absolute inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-tb-line bg-tb-surface text-tb-ink p-3">
          <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-tb-line-strong" aria-hidden="true"></div>
          <template v-if="sheet === 'categories'">
            <div v-for="c in CATEGORIES" :key="c.id" class="mb-4" :style="{ '--cat': `var(--cat-${c.id})` }">
              <h2 class="flex items-center gap-2 px-2 mb-1 font-display font-semibold">
                <span class="w-2 h-2 rounded-full" style="background: var(--cat)"></span>{{ c.name }}
              </h2>
              <button v-for="entry in benchTasks(c.id)" :key="entry.id" type="button" data-test="sheet-item"
                      :aria-disabled="!entry.mobile" class="w-full text-left px-3 py-2.5 rounded-xl active:bg-tb-surface-2"
                      :class="!entry.mobile && 'opacity-50'" @click="choose(entry)">
                <span class="block text-sm font-medium">{{ entry.name }}</span>
                <span class="block text-xs text-tb-muted">{{ entry.mobile ? entry.task : 'Disponible en escritorio' }}</span>
              </button>
            </div>
          </template>
          <template v-else>
            <p v-if="!recent.length" class="px-3 py-8 text-center text-sm text-tb-muted">Aún no has abierto ninguna herramienta.</p>
            <button v-for="entry in recent" :key="entry.id" type="button" data-test="sheet-item"
                    :aria-disabled="!entry.mobile" class="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl active:bg-tb-surface-2"
                    :class="!entry.mobile && 'opacity-50'" @click="choose(entry)">
              <span class="grid place-items-center w-8 h-8 rounded-lg" :style="{ color: `var(--cat-${entry.category})`, background: `color-mix(in srgb, var(--cat-${entry.category}) 14%, transparent)` }">
                <Icon :name="getCategory(entry.category).icon" :size="16" />
              </span>
              <span class="text-sm font-medium">{{ entry.name }}</span>
            </button>
          </template>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
