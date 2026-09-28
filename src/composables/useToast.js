import { ref } from 'vue'

const MAX = 3
const toasts = ref([])
let seq = 0

function dismiss(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

/** Aviso breve global. tone: 'info' | 'success' | 'error'. */
export function toast(message, { tone = 'info', duration = 3000 } = {}) {
  const id = ++seq
  toasts.value = [...toasts.value, { id, message, tone }].slice(-MAX)
  setTimeout(() => dismiss(id), duration)
  return id
}

export const useToasts = () => ({ toasts, dismiss })
