<script setup>
import { useRoute } from 'vue-router'
import Dock from './components/Dock.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-neutral-950">
    <Dock />
    <router-view />
  </div>
</template>
