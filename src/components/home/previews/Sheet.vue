<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <rect class="pv-paper" x="30" y="12" width="140" height="96" rx="6" />
    <g v-for="r in 4" :key="r">
      <rect v-for="c in 3" :key="c" class="sh-cell" :x="38 + (c - 1) * 44" :y="20 + (r - 1) * 20" width="40" height="16" rx="2" :style="{ '--i': (r - 1) * 3 + c }" />
    </g>
    <rect class="sh-total pv-cat-soft" x="126" y="80" width="40" height="16" rx="2" />
    <text class="sh-total pv-text-ink" x="146" y="91" text-anchor="middle" style="fill:var(--cat);font-size:8.5px">Σ 1.284</text>
  </svg>
</template>
<style scoped>
.sh-cell { fill: var(--tb-bg); stroke: var(--tb-line); animation: sh-cell 4s calc(var(--i) * .12s) ease-out infinite; }
@keyframes sh-cell { 0%, 5% { fill: var(--tb-bg); } 20%, 90% { fill: color-mix(in srgb, var(--cat) 12%, var(--tb-bg)); } }
.sh-total { animation: sh-total 4s 1.6s var(--tb-spring) infinite; transform-origin: 146px 88px; }
@keyframes sh-total { 0% { transform: scale(0); } 20%, 90% { transform: scale(1); } 100% { transform: scale(1); opacity: 0; } }
</style>
