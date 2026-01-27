<script setup>
import { useRoute } from 'vue-router'
import Dock from './components/Dock.vue'
import MobileDock from './components/MobileDock.vue'
import SyncAccountButton from './components/common/SyncAccountButton.vue'
import { useDevice } from './composables/useDevice'

const route = useRoute()
const { isMobile } = useDevice()
</script>

<template>
  <div class="min-h-screen bg-neutral-950">
    <MobileDock v-if="isMobile" />
    <Dock v-else />
    <div v-if="!isMobile" class="fixed top-2 right-3 z-[100]">
      <SyncAccountButton />
    </div>
    <router-view />
  </div>
</template>
