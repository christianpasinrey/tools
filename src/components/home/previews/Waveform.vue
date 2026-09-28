<script setup>
defineProps({ active: Boolean, entry: Object })
const bars = Array.from({ length: 34 }, (_, i) => 10 + Math.round(Math.abs(Math.sin(i * 0.7) * 28 + Math.sin(i * 1.9) * 12)))
</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect v-for="(h, i) in bars" :key="i" class="wf-bar" :x="14 + i * 5.3" :y="60 - h / 2" width="3" :height="h" rx="1.5" :style="{ '--i': i }" />
    <line class="wf-head" x1="14" y1="16" x2="14" y2="104" />
  </svg>
</template>
<style scoped>
.wf-bar { fill: var(--cat); transform-box: fill-box; transform-origin: center; animation: wf 1.1s calc(var(--i) * -0.07s) ease-in-out infinite alternate; opacity: .85; }
@keyframes wf { from { transform: scaleY(.45); } to { transform: scaleY(1); } }
.wf-head { stroke: var(--tb-ink); stroke-width: 2; animation: wf-h 4s linear infinite; }
@keyframes wf-h { from { transform: translateX(0); } to { transform: translateX(178px); } }
</style>
