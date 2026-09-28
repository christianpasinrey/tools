<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="50" y="8" width="100" height="104" rx="6" />
    <rect class="pv-cat" x="62" y="20" width="44" height="7" rx="2" />
    <rect v-for="i in 5" :key="i" class="dw-line" x="62" :y="34 + i * 12" height="4" rx="2" :style="{ '--i': i, '--w': [70, 62, 74, 50, 66][i - 1] + 'px' }" />
  </svg>
</template>
<style scoped>
.dw-line { fill: var(--tb-line-strong); width: 0; animation: dw 5s calc(var(--i) * .5s) steps(12) infinite; }
@keyframes dw { 0% { width: 0; } 12%, 90% { width: var(--w); } 100% { width: var(--w); opacity: 0; } }
</style>
