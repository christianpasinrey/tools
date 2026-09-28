<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <defs><clipPath id="ia-clip"><rect x="40" y="8" width="120" height="80" rx="8" /></clipPath></defs>
    <g class="ia-photo" clip-path="url(#ia-clip)">
      <rect x="40" y="8" width="120" height="80" style="fill:color-mix(in srgb, var(--cat) 22%, var(--tb-surface))" />
      <circle cx="128" cy="30" r="10" style="fill:#f59f00" />
      <path d="M40 88 L78 46 L104 72 L122 56 L160 88Z" class="pv-cat" />
    </g>
    <rect class="ia-crop" x="40" y="8" width="120" height="80" rx="8" />
    <line x1="50" y1="104" x2="150" y2="104" class="pv-line" />
    <circle class="ia-knob pv-cat" cx="60" cy="104" r="6" />
  </svg>
</template>
<style scoped>
.ia-photo { animation: ia-b 4s ease-in-out infinite; }
@keyframes ia-b { 0%, 100% { filter: brightness(.75) saturate(.6); } 50% { filter: brightness(1.15) saturate(1.3); } }
.ia-knob { animation: ia-k 4s ease-in-out infinite; }
@keyframes ia-k { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(80px); } }
.ia-crop { fill: none; stroke: var(--tb-ink); stroke-width: 1.5; stroke-dasharray: 5 4; animation: ia-c 4s ease-in-out infinite; transform-origin: 100px 48px; }
@keyframes ia-c { 0%, 100% { transform: scale(1); } 50% { transform: scale(.82); } }
</style>
