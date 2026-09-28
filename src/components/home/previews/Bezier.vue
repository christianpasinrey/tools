<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <line x1="30" y1="92" x2="62" y2="18" class="bz-handle" /><line x1="170" y1="92" x2="138" y2="18" class="bz-handle" />
    <path class="bz-path pv-cat-stroke" d="M30 92 C 62 18, 138 18, 170 92" stroke-width="4" />
    <rect x="25" y="87" width="10" height="10" class="bz-node" /><rect x="165" y="87" width="10" height="10" class="bz-node" />
    <circle cx="62" cy="18" r="5" class="bz-ctrl" /><circle cx="138" cy="18" r="5" class="bz-ctrl" />
  </svg>
</template>
<style scoped>
.bz-path { stroke-dasharray: 220; animation: bz 3.2s var(--tb-ease-out) infinite; }
@keyframes bz { 0% { stroke-dashoffset: 220; } 55%, 90% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }
.bz-handle { stroke: var(--tb-line-strong); stroke-width: 1.5; stroke-dasharray: 3 3; }
.bz-node { fill: var(--tb-surface); stroke: var(--tb-ink); stroke-width: 1.5; }
.bz-ctrl { fill: var(--cat); animation: bz-c 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes bz-c { 50% { transform: scale(1.5); } }
</style>
