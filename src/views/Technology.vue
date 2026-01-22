<script setup>
import { useTechnology } from '../composables/useTechnology'
import TechnologyTabs from '../components/technology/TechnologyTabs.vue'

// Import technology tools
import DevTools from './DevTools.vue'
import CyberSecurity from './CyberSecurity.vue'
import PhoneTester from './PhoneTester.vue'

const tech = useTechnology()
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 text-neutral-300">
    <TechnologyTabs
      :active-tab="tech.activeTab.value"
      :theme-color="tech.themeColor.value"
      @change="(tab) => tech.activeTab.value = tab"
    />

    <div class="flex-1 overflow-auto">
      <DevTools v-if="tech.activeTab.value === 'dev'" />
      <CyberSecurity v-if="tech.activeTab.value === 'security'" />
      <PhoneTester v-if="tech.activeTab.value === 'phone'" />
    </div>
  </div>
</template>
