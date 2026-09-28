import { ref } from 'vue'

const isOpen = ref(false)

export function usePalette() {
  return {
    isOpen,
    open: () => { isOpen.value = true },
    close: () => { isOpen.value = false },
    toggle: () => { isOpen.value = !isOpen.value }
  }
}
