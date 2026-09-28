<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-sheet" x="14" y="14" width="80" height="92" rx="6" />
    <rect class="pv-paper" x="106" y="14" width="80" height="92" rx="6" />
    <text class="pv-text" x="24" y="36"># Hola</text>
    <text class="pv-text" x="24" y="56">**mundo**</text>
    <text class="pv-text" x="24" y="76">- lista</text>
    <text class="md-h" x="116" y="40" style="font-family:var(--font-display);font-size:18px;font-weight:800;fill:var(--tb-ink)">Hola</text>
    <text class="md-b" x="116" y="58" style="font-size:11px;font-weight:700;fill:var(--cat)">mundo</text>
    <circle class="md-b pv-cat" cx="119" cy="73" r="2" /><rect class="md-b" x="125" y="71" width="30" height="4" rx="2" style="fill:var(--tb-line-strong)" />
  </svg>
</template>
<style scoped>
.md-h, .md-b { animation: md 3.6s var(--tb-ease-out) infinite; }
.md-b { animation-delay: .4s; }
@keyframes md { 0%, 15% { opacity: 0; transform: translateX(-12px); } 35%, 88% { opacity: 1; transform: none; } 100% { opacity: 0; } }
</style>
