<script setup>
import { useLocation } from '../composables/useLocation'
import LocationTabs from '../components/location/LocationTabs.vue'
import MapEditor from './MapEditor.vue'

const location = useLocation()
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 text-neutral-300">
    <LocationTabs
      :active-tab="location.activeTab.value"
      :theme-color="location.themeColor.value"
      @change="(tab) => location.activeTab.value = tab"
    />

    <div class="flex-1 overflow-hidden relative">
      <MapEditor v-if="location.activeTab.value === 'map'" class="absolute inset-0" />
    </div>
  </div>
</template>
