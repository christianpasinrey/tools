<script setup>
import { ref } from 'vue'
import DotField from '../components/home/DotField.vue'
import HomeHero from '../components/home/HomeHero.vue'
import ToolBench from '../components/home/ToolBench.vue'
import FileDropZone from '../components/home/FileDropZone.vue'

const query = ref('')
const drop = ref(null)
</script>

<template>
  <div class="tb-home relative min-h-full font-ui text-tb-ink">
    <DotField />
    <FileDropZone ref="drop" />
    <div class="relative z-10">
      <HomeHero v-model="query" @pick-file="drop?.pick()" />
      <ToolBench v-model:query="query" />
    </div>
  </div>
</template>
