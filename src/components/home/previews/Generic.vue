<script setup>
import { computed } from 'vue'
import { ICONS } from '../../icons/paths'
import { getCategory } from '@/config/catalog'
const props = defineProps({ active: Boolean, entry: Object })
const d = computed(() => ICONS[getCategory(props.entry?.category)?.icon] || ICONS.apps)
</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <circle v-for="i in 3" :key="i" class="g-ring pv-cat-stroke" cx="100" cy="60" r="22" :style="{ animationDelay: `${(i - 1) * 0.8}s` }" />
    <circle class="pv-cat-soft" cx="100" cy="60" r="22" />
    <g transform="translate(88 48)"><path :d="d" class="pv-cat-stroke" stroke-width="1.8" /></g>
  </svg>
</template>
<style scoped>
.g-ring { transform-origin: 100px 60px; animation: g-ring 2.4s ease-out infinite; opacity: 0; stroke-width: 1.5; }
@keyframes g-ring { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(2.4); opacity: 0; } }
</style>
