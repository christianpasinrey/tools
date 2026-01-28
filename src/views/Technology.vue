<script setup>
import { useTechnology } from '../composables/useTechnology'
import TechnologyTabs from '../components/technology/TechnologyTabs.vue'

// Import technology tools
import DevTools from './DevTools.vue'
import CyberSecurity from './CyberSecurity.vue'
import PhoneTester from './PhoneTester.vue'
import ApiTester from './ApiTester.vue'
import StorageEditor from '../components/cybersecurity/StorageEditor.vue'

const tech = useTechnology()
</script>

<template>
  <div class="app-container">
    <TechnologyTabs
      :active-tab="tech.activeTab.value"
      :theme-color="tech.themeColor.value"
      @change="(tab) => tech.activeTab.value = tab"
    />

    <div class="flex-1 overflow-auto">
      <DevTools v-if="tech.activeTab.value === 'dev'" />
      <CyberSecurity v-if="tech.activeTab.value === 'security'" />
      <PhoneTester v-if="tech.activeTab.value === 'phone'" />
      <ApiTester v-if="tech.activeTab.value === 'api'" />
      <StorageEditor v-if="tech.activeTab.value === 'storage'" :theme-color="tech.themeColor.value" />
    </div>
  </div>
</template>
