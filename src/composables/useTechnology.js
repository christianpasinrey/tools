import { ref, watch, onMounted, onUnmounted } from 'vue'

const validTabs = ['dev', 'security', 'phone']

// Map hash names to internal tab names
const hashToTab = {
  'dev': 'dev',
  'devtools': 'dev',
  'developer': 'dev',
  'security': 'security',
  'cyber': 'security',
  'phone': 'phone',
  'tester': 'phone',
  'mobile': 'phone'
}

// Map internal tab names to hash names
const tabToHash = {
  'dev': 'dev',
  'security': 'security',
  'phone': 'phone'
}

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || 'dev'
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || 'dev'
  const newUrl = `${window.location.pathname}#${hash}`
  window.history.replaceState(null, '', newUrl)
}

export function useTechnology() {
  const activeTab = ref(getTabFromHash())
  const themeColor = ref('#06b6d4')

  // Theme colors per tab
  const tabColors = {
    'dev': '#06b6d4',
    'security': '#ef4444',
    'phone': '#10b981'
  }

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Update theme color when tab changes
  watch(activeTab, (newTab) => {
    setHashFromTab(newTab)
    themeColor.value = tabColors[newTab] || '#06b6d4'
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
    themeColor.value = tabColors[activeTab.value] || '#06b6d4'
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
