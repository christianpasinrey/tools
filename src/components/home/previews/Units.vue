<script setup>
defineProps({ active: Boolean, entry: Object })
const PAIRS = [['1 km', '0,62 mi'], ['100 °C', '212 °F'], ['1 kg', '2,2 lb'], ['1 GB', '1024 MB'], ['1 km', '0,62 mi']]
</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <defs><clipPath id="un-clip"><rect x="10" y="30" width="180" height="60" /></clipPath></defs>
    <g clip-path="url(#un-clip)">
      <g class="un-roll">
        <g v-for="(p, i) in PAIRS" :key="i" :transform="`translate(0 ${i * 60})`">
          <text x="54" y="68" text-anchor="middle" style="font-family:var(--font-display);font-size:22px;font-weight:800;fill:var(--tb-ink)">{{ p[0] }}</text>
          <text x="100" y="66" text-anchor="middle" class="pv-text" style="font-size:16px">⇄</text>
          <text x="148" y="68" text-anchor="middle" style="font-family:var(--font-display);font-size:22px;font-weight:800;fill:var(--cat)">{{ p[1] }}</text>
        </g>
      </g>
    </g>
  </svg>
</template>
<style scoped>
.un-roll { animation: un 8s var(--tb-spring) infinite; }
@keyframes un { 0%, 20% { transform: translateY(0); } 25%, 45% { transform: translateY(-60px); } 50%, 70% { transform: translateY(-120px); } 75%, 95% { transform: translateY(-180px); } 100% { transform: translateY(-240px); } }
</style>
