<script setup>
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'

const route = useRoute()
</script>

<template>
  <div class="min-h-screen bg-neutral-950">
    <Navbar />
    <router-view />
  </div>
</template>
