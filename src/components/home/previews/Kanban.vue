<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <g v-for="c in 3" :key="c">
      <rect class="pv-sheet" :x="12 + (c - 1) * 62" y="12" width="54" height="96" rx="6" />
      <rect :x="18 + (c - 1) * 62" y="18" width="24" height="4" rx="2" style="fill:var(--tb-muted)" />
      <rect class="pv-paper" :x="18 + (c - 1) * 62" y="60" width="42" height="16" rx="3" />
    </g>
    <g class="kb-card"><rect x="18" y="32" width="42" height="20" rx="3" class="pv-cat" /><rect x="23" y="39" width="26" height="4" rx="2" style="fill:#fff;opacity:.8" /></g>
  </svg>
</template>
<style scoped>
.kb-card { animation: kb 5s var(--tb-spring) infinite; }
@keyframes kb { 0%, 20% { transform: none; } 35%, 55% { transform: translate(62px, 0) rotate(-3deg); } 70%, 95% { transform: translate(124px, 0); } 100% { transform: translate(124px, 0); opacity: 0; } }
</style>
