<script setup>
import { useRoute } from 'vue-router'
import Dock from './components/Dock.vue'
import CryptoLockButton from './components/common/CryptoLockButton.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-neutral-950">
    <Dock />
    <div class="fixed top-2 right-3 z-[100]">
      <CryptoLockButton />
    </div>
    <router-view />
  </div>
</template>
