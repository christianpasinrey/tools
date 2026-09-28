<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import DotField from '../components/home/DotField.vue'
import HomeHero from '../components/home/HomeHero.vue'
import ToolBench from '../components/home/ToolBench.vue'
import FileDropZone from '../components/home/FileDropZone.vue'
import RecentStrip from '../components/home/RecentStrip.vue'
import TrustStrip from '../components/home/TrustStrip.vue'
import SiteFooter from '../components/home/SiteFooter.vue'
import { TASKS } from '../config/catalog'
import { searchTools } from '../lib/toolSearch'
import { openTool } from '../lib/openTool'
import { useRecentTools } from '../composables/useRecentTools'

const query = ref('')
const drop = ref(null)
const router = useRouter()
const { recordVisit } = useRecentTools()

// Enter en el buscador abre el primer resultado de la mesa
function openFirstResult() {
  if (!query.value.trim()) return
  const [first] = searchTools(query.value, TASKS.filter(t => t.bench !== false))
  if (first) openTool(router, first.entry, { recordVisit })
}
</script>

<template>
  <div class="tb-home relative min-h-full font-ui text-tb-ink">
    <DotField />
    <FileDropZone ref="drop" />
    <div class="relative z-10">
      <HomeHero v-model="query" @pick-file="drop?.pick()" @submit="openFirstResult" />
      <RecentStrip v-if="!query" />
      <ToolBench v-model:query="query" />
      <TrustStrip />
      <SiteFooter />
    </div>
  </div>
</template>
