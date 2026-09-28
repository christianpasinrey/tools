<script setup>
defineProps({ active: Boolean, entry: Object })
const PINS = [[44, 80], [97, 66], [150, 44]]
</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-sheet" x="10" y="10" width="180" height="100" rx="8" />
    <path d="M10 70 C 50 60, 70 90, 110 76 S 170 50, 190 58" style="fill:none;stroke:var(--tb-line-strong);stroke-width:8;opacity:.5" />
    <path class="mp-route pv-cat-stroke" d="M44 80 C 70 40, 110 96, 150 44" stroke-dasharray="4 5" />
    <g v-for="(p, i) in PINS" :key="i" :transform="`translate(${p[0]} ${p[1]})`">
      <g class="mp-pin" :style="{ '--i': i }">
        <path d="M0 0 C -8 -10, -8 -22, 0 -22 C 8 -22, 8 -10, 0 0Z" class="pv-cat" /><circle cy="-15" r="3" style="fill:var(--tb-surface)" />
      </g>
    </g>
  </svg>
</template>
<style scoped>
.mp-pin { animation: mp 4s calc(var(--i) * .3s) var(--tb-spring) infinite; }
@keyframes mp { 0% { transform: translateY(-30px); opacity: 0; } 20%, 90% { transform: none; opacity: 1; } 100% { opacity: 0; } }
.mp-route { stroke-dashoffset: 200; animation: mp-r 4s 1s ease-in-out infinite; }
@keyframes mp-r { 0% { stroke-dashoffset: 200; } 50%, 90% { stroke-dashoffset: 0; } 100% { opacity: 0; } }
</style>
