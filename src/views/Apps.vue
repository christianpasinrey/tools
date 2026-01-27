<script setup>
import { useApps } from '../composables/useApps'
import { useDevice } from '../composables/useDevice'
import AppsTabs from '../components/apps/AppsTabs.vue'
import MapEditor from './MapEditor.vue'
import TodoKanban from '../components/apps/TodoKanban.vue'
import MobileTodoKanban from '../components/apps/MobileTodoKanban.vue'
import InvoiceGenerator from '../components/apps/InvoiceGenerator.vue'

const apps = useApps()
const { isMobile } = useDevice()
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 text-neutral-300">
    <AppsTabs
      :active-tab="apps.activeTab.value"
      :theme-color="apps.themeColor.value"
      @change="(tab) => apps.activeTab.value = tab"
    />

    <div class="flex-1 overflow-hidden relative">
      <MapEditor v-if="apps.activeTab.value === 'map'" class="absolute inset-0" />
      <MobileTodoKanban v-if="apps.activeTab.value === 'todo' && isMobile" class="absolute inset-0" />
      <TodoKanban v-if="apps.activeTab.value === 'todo' && !isMobile" class="absolute inset-0" />
      <InvoiceGenerator v-if="apps.activeTab.value === 'invoice'" class="absolute inset-0" />
    </div>
  </div>
</template>
