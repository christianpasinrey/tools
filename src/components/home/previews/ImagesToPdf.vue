<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="68" y="30" width="64" height="82" rx="6" />
    <rect class="pv-cat" x="68" y="30" width="64" height="14" rx="6" />
    <g v-for="i in 3" :key="i" class="i2p" :style="{ '--i': i }">
      <rect class="pv-paper" x="80" :y="50 + (i - 1) * 18" width="40" height="14" rx="2" />
      <path class="pv-cat-soft" :d="`M82 ${62 + (i - 1) * 18} l10 -8 8 5 6 -3 12 6z`" />
    </g>
  </svg>
</template>
<style scoped>
.i2p { animation: i2p 3.4s calc(var(--i) * .3s) var(--tb-spring) infinite; }
@keyframes i2p { 0% { transform: translateY(-80px) rotate(-8deg); opacity: 0; } 30%, 85% { transform: none; opacity: 1; } 100% { opacity: 0; } }
</style>
