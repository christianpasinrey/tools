<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Icon from '../icons/Icon.vue'

const root = ref(null)
const TILES = [
  { cat: 'documents', icon: 'documents', label: 'PDF', x: 8, y: 6, r: -8, depth: 18, delay: 0 },
  { cat: 'multimedia', icon: 'multimedia', label: 'IMG', x: 58, y: 0, r: 7, depth: 30, delay: 0.6 },
  { cat: 'tools', icon: 'tools', label: '#F25C', x: 70, y: 48, r: -5, depth: 22, delay: 1.2 },
  { cat: 'technology', icon: 'technology', label: 'API', x: 22, y: 56, r: 6, depth: 36, delay: 0.3 },
  { cat: 'apps', icon: 'apps', label: 'TODO', x: 44, y: 28, r: -3, depth: 12, delay: 0.9 }
]

// Parallax suavizado por fotograma: el objetivo cambia con el ratón y la posición
// actual se acerca a él con una fracción fija por frame. Sin transición CSS, que se
// reiniciaba en cada pointermove y hacía avanzar las fichas a tirones.
const EASE = 0.12
let target = { x: 0, y: 0 }
let current = { x: 0, y: 0 }
let raf = 0

function frame() {
  current.x += (target.x - current.x) * EASE
  current.y += (target.y - current.y) * EASE
  root.value?.style.setProperty('--mx', current.x.toFixed(4))
  root.value?.style.setProperty('--my', current.y.toFixed(4))
  const settled = Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001
  raf = settled ? 0 : requestAnimationFrame(frame)
}

function onMove(e) {
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  target = {
    x: Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5)),
    y: Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5))
  }
  if (!raf) raf = requestAnimationFrame(frame)
}

onMounted(() => {
  const fine = window.matchMedia('(pointer: fine)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (fine && !reduced) window.addEventListener('pointermove', onMove, { passive: true })
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('pointermove', onMove)
})
</script>

<template>
  <div ref="root" class="tb-cluster tb-motion relative w-full aspect-square max-w-[440px]" aria-hidden="true">
    <div v-for="t in TILES" :key="t.cat" class="tb-cluster-tile"
         :style="{ left: t.x + '%', top: t.y + '%', '--r': t.r + 'deg', '--depth': t.depth, '--delay': t.delay + 's', '--cat': `var(--cat-${t.cat})` }">
      <span class="grid place-items-center w-11 h-11 rounded-xl" style="color: var(--cat); background: color-mix(in srgb, var(--cat) 14%, transparent)">
        <Icon :name="t.icon" :size="22" />
      </span>
      <span class="font-code text-xs text-tb-muted">{{ t.label }}</span>
    </div>
  </div>
</template>
