<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TbSegmented from '../ui/TbSegmented.vue'
import { sectionTools } from '@/config/catalog'
import { currentHash, goToSectionTool } from '@/lib/sectionHash'

const props = defineProps({ category: { type: Object, required: true } })
const router = useRouter()
const tools = computed(() => sectionTools(props.category.id))
const options = computed(() => tools.value.map(t => ({ value: t.hash, label: t.short, icon: t.icon, title: t.name })))
const active = computed(() => {
  const h = currentHash.value.replace(/^#/, '')
  return tools.value.some(t => t.hash === h) ? h : tools.value[0]?.hash
})
const select = (hash) => { if (hash !== active.value) goToSectionTool(router, props.category.path, hash) }
</script>

<template>
  <TbSegmented v-if="tools.length" data-test="tool-switcher" :model-value="active" :options="options"
               :label="`Herramientas de ${category.name}`" size="sm"
               :style="{ '--cat': `var(--cat-${category.id})` }" @update:model-value="select" />
</template>
