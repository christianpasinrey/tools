<script setup>
import { useRoute } from 'vue-router'
import Dock from './components/Dock.vue'
import SyncAccountButton from './components/common/SyncAccountButton.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-neutral-950">
    <Dock />
    <div class="fixed top-2 right-3 z-[100]">
      <SyncAccountButton />
    </div>
    <router-view />
  </div>
</template>
