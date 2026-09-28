<script setup>
defineProps({ active: Boolean, entry: Object })
const KEYS = ['⌘', 'C', 'git', 'Σ']
</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <g v-for="(k, i) in KEYS" :key="i" :transform="`translate(${22 + i * 42} 38)`">
      <g class="cs-key" :style="{ '--i': i }">
        <rect width="36" height="40" rx="7" class="pv-paper" /><rect y="34" width="36" height="6" rx="3" class="pv-cat-soft" />
        <text x="18" y="25" text-anchor="middle" class="pv-text-ink" style="font-size:14px">{{ k }}</text>
      </g>
    </g>
  </svg>
</template>
<style scoped>
.cs-key { animation: cs 3.2s calc(var(--i) * .2s) var(--tb-spring) infinite; }
@keyframes cs { 0%, 10% { transform: translateY(0); } 20% { transform: translateY(4px); } 30%, 100% { transform: translateY(0); } }
</style>
