<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="52" y="6" width="96" height="108" rx="6" />
    <text class="pv-text-ink" x="62" y="24">FACTURA</text>
    <g v-for="i in 3" :key="i">
      <line class="pv-line" x1="62" :y1="36 + i * 12" x2="110" :y2="36 + i * 12" style="stroke-width:2.5" />
      <text class="pv-text" x="118" :y="40 + i * 12">{{ ['120', '80', '45'][i - 1] }}</text>
    </g>
    <line x1="62" y1="88" x2="138" y2="88" class="pv-line" style="stroke-width:1" />
    <text class="pv-text-ink" x="112" y="102" style="fill:var(--cat)">245 €</text>
    <g class="iv-stamp">
      <rect x="64" y="58" width="60" height="20" rx="4" style="fill:none;stroke:var(--cat);stroke-width:2" />
      <text x="94" y="72" text-anchor="middle" class="pv-text-ink" style="fill:var(--cat);font-size:10px">PAGADA</text>
    </g>
  </svg>
</template>
<style scoped>
.iv-stamp { transform-origin: 94px 68px; animation: iv 4s var(--tb-spring) infinite; }
@keyframes iv { 0%, 45% { transform: scale(2) rotate(-12deg); opacity: 0; } 60%, 92% { transform: rotate(-12deg); opacity: .9; } 100% { opacity: 0; } }
</style>
