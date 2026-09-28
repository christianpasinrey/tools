<script setup>
import { ref } from 'vue'
import DotField from '../components/home/DotField.vue'
import HomeHero from '../components/home/HomeHero.vue'
import ToolBench from '../components/home/ToolBench.vue'

const query = ref('')
</script>

<template>
  <div class="tb-home relative min-h-full font-ui text-tb-ink">
    <DotField />
    <div class="relative z-10">
      <HomeHero v-model="query" />
      <ToolBench v-model:query="query" />
    </div>
  </div>
</template>
