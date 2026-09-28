<script setup>
defineProps({ active: Boolean, entry: Object })
const LINES = [[0, 30], [14, 60], [14, 48], [28, 40], [14, 54], [0, 20]]
</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-sheet" x="20" y="10" width="160" height="100" rx="8" />
    <circle cx="32" cy="22" r="3" style="fill:#fa5252" /><circle cx="42" cy="22" r="3" style="fill:#fab005" /><circle cx="52" cy="22" r="3" style="fill:#40c057" />
    <g v-for="(l, i) in LINES" :key="i" class="cd-line" :style="{ '--i': i, '--x': l[0] + 'px' }">
      <rect x="32" :y="36 + i * 11" :width="l[1]" height="5" rx="2.5" :style="{ fill: i % 2 ? 'var(--cat)' : 'var(--tb-line-strong)' }" />
    </g>
  </svg>
</template>
<style scoped>
.cd-line { animation: cd 3.4s calc(var(--i) * .08s) var(--tb-spring) infinite; }
@keyframes cd { 0%, 20% { transform: translateX(calc(var(--i) * 9px - 20px)); } 45%, 92% { transform: translateX(var(--x)); } 100% { transform: translateX(var(--x)); opacity: 0; } }
</style>
