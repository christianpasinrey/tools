<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="20" y="16" width="60" height="84" rx="6" />
    <text class="pv-text-ink" x="30" y="34" style="fill:var(--cat-documents)">PDF</text>
    <rect class="pv-paper" x="120" y="16" width="60" height="84" rx="6" />
    <text class="pv-text-ink" x="130" y="34" style="fill:var(--cat-cheatsheets)">DOCX</text>
    <line v-for="i in 4" :key="i" class="p2d-line pv-line" x1="30" :y1="44 + i * 11" x2="70" :y2="44 + i * 11" :style="{ '--i': i }" />
  </svg>
</template>
<style scoped>
.p2d-line { animation: p2d 3.2s calc(var(--i) * .18s) var(--tb-ease-out) infinite; }
@keyframes p2d { 0%, 10% { transform: none; stroke: var(--tb-line-strong); } 45%, 90% { transform: translateX(100px); stroke: var(--cat-cheatsheets); } 100% { transform: translateX(100px); opacity: 0; } }
</style>
