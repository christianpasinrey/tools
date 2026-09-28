<script setup>defineProps({ active: Boolean, entry: Object })</script>
<template>
  <svg class="pv" :class="{ 'is-active': active }" viewBox="0 0 200 120" aria-hidden="true">
    <g class="cd-hue">
      <circle class="cd-ripple" cx="100" cy="90" r="10" />
      <path class="cd-drop" d="M100 10 C 108 24, 112 30, 112 36 A12 12 0 0 1 88 36 C 88 30, 92 24, 100 10Z" />
    </g>
    <text class="pv-text-ink" x="100" y="114" text-anchor="middle">#C2255C</text>
  </svg>
</template>
<style scoped>
.cd-hue { animation: cd-h 6s linear infinite; }
@keyframes cd-h { to { filter: hue-rotate(360deg); } }
.cd-drop { fill: var(--cat); animation: cd-d 2s ease-in infinite; }
@keyframes cd-d { 0% { transform: translateY(-20px); opacity: 0; } 20% { opacity: 1; } 60% { transform: translateY(46px); opacity: 1; } 61%, 100% { opacity: 0; transform: translateY(46px); } }
.cd-ripple { fill: none; stroke: var(--cat); stroke-width: 2; transform-origin: 100px 90px; animation: cd-r 2s ease-out infinite; }
@keyframes cd-r { 0%, 58% { transform: scale(0); opacity: 0; } 62% { opacity: 1; } 100% { transform: scale(6) scaleY(.35); opacity: 0; } }
</style>
