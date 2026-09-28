<script setup>
import { defineAsyncComponent } from 'vue'
import TopBar from './components/shell/TopBar.vue'
import TbToaster from './components/ui/TbToaster.vue'
import TbConfirmHost from './components/ui/TbConfirmHost.vue'
import { useDevice } from './composables/useDevice'

const MobileTabBar = defineAsyncComponent(() => import('./components/shell/MobileTabBar.vue'))
const CommandPalette = defineAsyncComponent(() => import('./components/shell/CommandPalette.vue'))
const { isMobile } = useDevice()
</script>

<template>
  <div class="h-dvh flex flex-col bg-tb-bg text-tb-ink transition-colors duration-300">
    <a href="#app-main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[300] focus:px-3 focus:py-2 focus:rounded-lg focus:bg-tb-surface">Saltar al contenido</a>
    <TopBar />
    <main id="app-main" tabindex="-1" class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative outline-none"
          :class="isMobile && 'pb-[calc(60px+env(safe-area-inset-bottom))]'">
      <router-view />
    </main>
    <MobileTabBar v-if="isMobile" />
    <CommandPalette />
    <TbToaster />
    <TbConfirmHost />
  </div>
</template>
