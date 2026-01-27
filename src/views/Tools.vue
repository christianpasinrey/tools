<script setup>
import { useTools } from '../composables/useTools'
import { useDevice } from '../composables/useDevice'
import ToolsTabs from '../components/tools/ToolsTabs.vue'

// Import tools
import UnitConverter from './UnitConverter.vue'
import ColorPicker from './ColorPicker.vue'
import MobileColorPicker from './MobileColorPicker.vue'

const tools = useTools()
const { isMobile } = useDevice()
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 text-neutral-300">
    <ToolsTabs
      :active-tab="tools.activeTab.value"
      :theme-color="tools.themeColor.value"
      @change="(tab) => tools.activeTab.value = tab"
    />

    <div class="flex-1 overflow-auto">
      <UnitConverter v-if="tools.activeTab.value === 'converter'" />
      <MobileColorPicker v-if="tools.activeTab.value === 'color' && isMobile" />
      <ColorPicker v-if="tools.activeTab.value === 'color' && !isMobile" />
    </div>
  </div>
</template>
