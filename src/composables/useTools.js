import { ref, watch, onMounted, onUnmounted } from 'vue'

const validTabs = ['converter', 'color']

// Map hash names to internal tab names
const hashToTab = {
  'converter': 'converter',
  'convert': 'converter',
  'units': 'converter',
  'color': 'color',
  'colors': 'color',
  'picker': 'color'
}

// Map internal tab names to hash names
const tabToHash = {
  'converter': 'converter',
  'color': 'color'
}

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || 'converter'
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || 'converter'
  const newUrl = `${window.location.pathname}#${hash}`
  window.history.replaceState(null, '', newUrl)
}

export function useTools() {
  const activeTab = ref(getTabFromHash())
  const themeColor = ref('#10b981')

  // Theme colors per tab
  const tabColors = {
    'converter': '#10b981',
    'color': '#ec4899'
  }

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Update theme color when tab changes
  watch(activeTab, (newTab) => {
    setHashFromTab(newTab)
    themeColor.value = tabColors[newTab] || '#10b981'
  }, { immediate: true })

  // Listen for hash changes (back/forward navigation)
  const onHashChange = () => {
    activeTab.value = getTabFromHash()
  }

  onMounted(() => {
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      setHashFromTab(activeTab.value)
    }
    themeColor.value = tabColors[activeTab.value] || '#10b981'
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', onHashChange)
  })

  return {
    activeTab,
    themeColor,
    setThemeColor,
    tabColors
  }
}
