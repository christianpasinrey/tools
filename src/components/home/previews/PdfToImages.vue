<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="22" y="14" width="64" height="88" rx="6" />
    <rect class="pv-cat" x="22" y="14" width="64" height="16" rx="6" />
    <text class="pv-text-ink" x="32" y="26" style="fill:#fff;font-size:10px">PDF</text>
    <line class="pv-line" x1="32" y1="44" x2="76" y2="44" /><line class="pv-line" x1="32" y1="56" x2="70" y2="56" /><line class="pv-line" x1="32" y1="68" x2="74" y2="68" />
    <g v-for="i in 3" :key="i" class="p2i-photo" :style="{ '--i': i }">
      <rect class="pv-paper" x="112" :y="10 + (i - 1) * 34" width="54" height="30" rx="4" />
      <path class="pv-cat-soft" :d="`M114 ${38 + (i - 1) * 34} l14 -12 10 8 8 -6 18 10 z`" />
      <circle class="pv-cat" :cx="154" :cy="18 + (i - 1) * 34" r="3" />
    </g>
  </svg>
</template>
<style scoped>
.p2i-photo { animation: p2i 3.6s calc(var(--i) * .25s) var(--tb-ease-out) infinite; }
@keyframes p2i { 0%, 8% { transform: translateX(-70px) scale(.6); opacity: 0; } 30%, 80% { transform: none; opacity: 1; } 100% { transform: translateX(10px); opacity: 0; } }
</style>
