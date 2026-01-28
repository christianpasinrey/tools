<script setup>
import { useApps } from '../composables/useApps'
import { useDevice } from '../composables/useDevice'
import AppsTabs from '../components/apps/AppsTabs.vue'
import MapEditor from './MapEditor.vue'
import MobileMapEditor from './MobileMapEditor.vue'
import TodoKanban from '../components/apps/TodoKanban.vue'
import MobileTodoKanban from '../components/apps/MobileTodoKanban.vue'
import InvoiceGenerator from '../components/apps/InvoiceGenerator.vue'
import MobileInvoiceGenerator from '../components/apps/MobileInvoiceGenerator.vue'

const apps = useApps()
const { isMobile } = useDevice()
</script>

<template>
  <div class="app-container">
    <AppsTabs
      :active-tab="apps.activeTab.value"
      :theme-color="apps.themeColor.value"
      @change="(tab) => apps.activeTab.value = tab"
    />

    <div class="flex-1 overflow-hidden relative">
      <MobileMapEditor v-if="apps.activeTab.value === 'map' && isMobile" class="absolute inset-0" />
      <MapEditor v-if="apps.activeTab.value === 'map' && !isMobile" class="absolute inset-0" />
      <MobileTodoKanban v-if="apps.activeTab.value === 'todo' && isMobile" class="absolute inset-0" />
      <TodoKanban v-if="apps.activeTab.value === 'todo' && !isMobile" class="absolute inset-0" />
      <MobileInvoiceGenerator v-if="apps.activeTab.value === 'invoice' && isMobile" class="absolute inset-0" />
      <InvoiceGenerator v-if="apps.activeTab.value === 'invoice' && !isMobile" class="absolute inset-0" />
    </div>
  </div>
</template>
