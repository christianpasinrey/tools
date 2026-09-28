<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../icons/Icon.vue'
import SectionMenu from './SectionMenu.vue'
import ToolSwitcher from './ToolSwitcher.vue'
import ThemeToggleButton from '../common/ThemeToggleButton.vue'
import SyncAccountButton from '../common/SyncAccountButton.vue'
import { CATEGORIES } from '@/config/catalog'
import { usePalette } from '@/composables/usePalette'

const route = useRoute()
const { open } = usePalette()
const currentCategory = computed(() => CATEGORIES.find(c => c.path === route.path) || null)
const isHome = computed(() => route.path === '/')
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

function scrollToCategory(id) {
  document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <header class="tb-topbar h-12 shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 border-b border-tb-line bg-tb-bg/85 backdrop-blur-md font-ui text-tb-ink relative z-40">
    <router-link to="/" class="group flex items-center gap-2 font-display font-bold text-lg tracking-tight rounded-md" aria-label="tools — inicio">
      <span class="tb-logo-mark" aria-hidden="true"></span>
      <span>tools</span>
    </router-link>

    <template v-if="currentCategory">
      <SectionMenu :category="currentCategory" class="lg:hidden" />
      <div class="hidden lg:flex items-center gap-3 ml-1">
        <span class="flex items-center gap-2 text-sm font-medium">
          <span class="w-2 h-2 rounded-full" :style="{ background: `var(--cat-${currentCategory.id})` }"></span>
          {{ currentCategory.name }}
        </span>
        <ToolSwitcher :category="currentCategory" />
      </div>
    </template>
    <nav v-else-if="isHome" aria-label="Categorías" class="hidden lg:flex items-center gap-0.5 ml-2">
      <button v-for="c in CATEGORIES" :key="c.id" type="button"
              class="px-2.5 py-1 rounded-full text-sm text-tb-muted hover:text-tb-ink hover:bg-tb-surface-2 transition-colors"
              @click="scrollToCategory(c.id)">{{ c.name }}</button>
    </nav>

    <div class="flex-1"></div>

    <button type="button" data-test="open-palette"
            class="hidden sm:flex items-center gap-2 h-8 w-60 pl-2.5 pr-1.5 rounded-lg border border-tb-line bg-tb-surface text-sm text-tb-muted hover:border-tb-line-strong hover:text-tb-ink transition-colors"
            @click="open()">
      <Icon name="search" :size="16" />
      <span class="flex-1 text-left">Buscar herramienta…</span>
      <kbd class="tb-kbd">{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
    </button>
    <ThemeToggleButton />
    <SyncAccountButton />
  </header>
</template>
