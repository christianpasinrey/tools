<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="10" y="18" width="82" height="26" rx="13" />
    <text class="pv-text-ink" x="22" y="35" style="fill:var(--cat)">GET</text><text class="pv-text" x="48" y="35">/users</text>
    <line x1="92" y1="31" x2="150" y2="31" class="pv-line" style="stroke-width:1.5;stroke-dasharray:3 4" />
    <circle class="ar-packet pv-cat" cx="96" cy="31" r="4" />
    <g class="ar-res">
      <rect x="112" y="52" width="78" height="22" rx="11" style="fill:color-mix(in srgb, var(--cat-apps) 18%, transparent)" />
      <text class="pv-text-ink" x="124" y="67" style="fill:var(--cat-apps)">200 OK</text>
      <rect class="pv-sheet" x="112" y="80" width="78" height="30" rx="6" />
      <text class="pv-text" x="120" y="93" style="font-size:9px">{ "id": 1,</text>
      <text class="pv-text" x="120" y="104" style="font-size:9px">  "ok": true }</text>
    </g>
  </svg>
</template>
<style scoped>
.ar-packet { animation: ar-p 3s ease-in-out infinite; }
@keyframes ar-p { 0% { transform: none; opacity: 1; } 35% { transform: translateX(54px); opacity: 1; } 40%, 100% { transform: translateX(54px); opacity: 0; } }
.ar-res { transform-origin: 150px 60px; animation: ar-r 3s var(--tb-spring) infinite; }
@keyframes ar-r { 0%, 38% { transform: scale(.6); opacity: 0; } 55%, 92% { transform: none; opacity: 1; } 100% { opacity: 0; } }
</style>
