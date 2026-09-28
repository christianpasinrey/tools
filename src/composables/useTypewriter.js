import { ref, onUnmounted } from 'vue'

export function useTypewriter(phrases, { typeMs = 55, holdMs = 1800, eraseMs = 26 } = {}) {
  const text = ref(phrases[0] || '')
  let index = 0
  let pos = 0
  let phase = 'type'
  let timer = null
  let running = false

  const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  function tick() {
    const phrase = phrases[index]
    if (phase === 'type') {
      pos += 1
      text.value = phrase.slice(0, pos)
      if (pos >= phrase.length) { phase = 'hold'; timer = setTimeout(tick, holdMs); return }
      timer = setTimeout(tick, typeMs)
    } else if (phase === 'hold') {
      phase = 'erase'
      timer = setTimeout(tick, eraseMs)
    } else {
      pos -= 1
      text.value = phrase.slice(0, Math.max(pos, 0))
      if (pos <= 0) {
        index = (index + 1) % phrases.length
        phase = 'type'
        timer = setTimeout(tick, 300)
        return
      }
      timer = setTimeout(tick, eraseMs)
    }
  }

  function start() {
    if (running || reduced() || !phrases.length) return
    running = true
    pos = 0
    phase = 'type'
    text.value = ''
    timer = setTimeout(tick, typeMs)
  }

  function stop() {
    clearTimeout(timer)
    running = false
    text.value = phrases[index] || ''
  }

  onUnmounted(stop)
  return { text, start, stop }
}
