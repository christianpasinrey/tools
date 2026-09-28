<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <ellipse cx="100" cy="60" rx="78" ry="22" class="pv-cat-stroke" style="stroke-width:1.2;opacity:.5" />
    <g class="or-cube">
      <path d="M100 30 L128 44 L100 58 L72 44Z" class="pv-cat" style="opacity:.9" />
      <path d="M72 44 L100 58 L100 90 L72 76Z" class="pv-cat" style="opacity:.6" />
      <path d="M128 44 L100 58 L100 90 L128 76Z" class="pv-cat" style="opacity:.35" />
    </g>
    <circle class="or-dot pv-cat" r="5" cx="0" cy="0" />
  </svg>
</template>
<style scoped>
.or-cube { transform-origin: 100px 60px; animation: or-c 6s ease-in-out infinite; }
@keyframes or-c { 50% { transform: translateY(-6px) rotate(8deg); } }
.or-dot { offset-path: path('M178 60 A78 22 0 1 1 22 60 A78 22 0 1 1 178 60'); offset-distance: 0%; animation: or-d 5s linear infinite; }
@keyframes or-d { to { offset-distance: 100%; } }
</style>
