import { ref } from 'vue'

export function useDocuments() {
  const activeTab = ref('pdf')
  const themeColor = ref('#22c55e')

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  return {
    activeTab,
    themeColor,
    setThemeColor
  }
}
