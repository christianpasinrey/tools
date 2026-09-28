<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="56" y="8" width="88" height="104" rx="6" />
    <rect class="ps-mark" x="66" y="24" width="0" height="9" rx="2" />
    <line class="pv-line" x1="68" y1="28" x2="130" y2="28" /><line class="pv-line" x1="68" y1="42" x2="124" y2="42" /><line class="pv-line" x1="68" y1="56" x2="132" y2="56" />
    <line x1="68" y1="94" x2="132" y2="94" class="pv-line" style="stroke-width:1.2" />
    <path class="ps-sign pv-cat-stroke" d="M70 90 c6 -14 10 -14 12 -4 s4 10 8 -2 6 -12 9 0 4 8 9 -2 8 -6 14 -1" />
  </svg>
</template>
<style scoped>
.ps-mark { fill: color-mix(in srgb, var(--cat) 30%, transparent); animation: ps-mark 4s var(--tb-ease-out) infinite; }
@keyframes ps-mark { 0%, 10% { width: 0; } 35%, 85% { width: 66px; } 100% { width: 66px; opacity: 0; } }
.ps-sign { stroke-dasharray: 140; animation: ps-sign 4s .6s ease-in-out infinite; }
@keyframes ps-sign { 0%, 15% { stroke-dashoffset: 140; } 55%, 90% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }
</style>
