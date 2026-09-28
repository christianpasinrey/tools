import { useDark, useToggle } from '@vueuse/core'

// Global dark mode (persists to localStorage)
export const isDark = useDark()
export const toggleDark = useToggle(isDark)
