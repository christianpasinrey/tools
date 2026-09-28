<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
const GAP = 26
const RADIUS = 150
let ctx, w = 0, h = 0, dpr = 1, raf = 0
let pointer = { x: -9999, y: -9999 }
let colors = { dot: 'rgba(0,0,0,.15)', accent: '#c2410c' }
let animated = true
let observer, resizeObs

function readColors() {
  const s = getComputedStyle(document.documentElement)
  colors = { dot: s.getPropertyValue('--tb-dot').trim(), accent: s.getPropertyValue('--tb-accent').trim() }
}

function resize() {
  const el = canvas.value
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = el.clientWidth; h = el.clientHeight
  el.width = w * dpr; el.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw()
}

function draw() {
  raf = 0
  ctx.clearRect(0, 0, w, h)
  for (let y = GAP / 2; y < h; y += GAP) {
    for (let x = GAP / 2; x < w; x += GAP) {
      const d = Math.hypot(x - pointer.x, y - pointer.y)
      const t = animated ? Math.max(0, 1 - d / RADIUS) : 0
      ctx.beginPath()
      ctx.fillStyle = t > 0.02 ? colors.accent : colors.dot
      ctx.globalAlpha = t > 0.02 ? 0.25 + t * 0.6 : 1
      ctx.arc(x, y, 1 + t * 1.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

function onPointer(e) {
  pointer = { x: e.clientX, y: e.clientY - canvas.value.getBoundingClientRect().top }
  if (!raf) raf = requestAnimationFrame(draw)
}
function onLeave() {
  pointer = { x: -9999, y: -9999 }
  if (!raf) raf = requestAnimationFrame(draw)
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  if (!ctx) return
  animated = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  readColors()
  resize()
  resizeObs = new ResizeObserver(resize)
  resizeObs.observe(canvas.value)
  observer = new MutationObserver(() => { readColors(); draw() })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  if (animated) {
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('pointerleave', onLeave)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  resizeObs?.disconnect()
  observer?.disconnect()
  window.removeEventListener('pointermove', onPointer)
  document.removeEventListener('pointerleave', onLeave)
})
</script>

<template>
  <canvas ref="canvas" class="tb-dotfield fixed left-0 right-0 bottom-0 top-12 w-full h-[calc(100dvh-3rem)] pointer-events-none z-0" aria-hidden="true"></canvas>
</template>
