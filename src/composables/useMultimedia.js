import { ref, watch, onMounted, onUnmounted } from 'vue'

const validTabs = ['image', 'audio', '3d', 'svg']

// Map hash names to internal tab names
const hashToTab = {
  'image': 'image',
  'imagen': 'image',
  'img': 'image',
  'audio': 'audio',
  'sound': 'audio',
  '3d': '3d',
  'three': '3d',
  'svg': 'svg',
  'vector': 'svg'
}

// Map internal tab names to hash names
const tabToHash = {
  'image': 'image',
  'audio': 'audio',
  '3d': '3d',
  'svg': 'svg'
}

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || 'image'
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || 'image'
  const newUrl = `${window.location.pathname}#${hash}`
  window.history.replaceState(null, '', newUrl)
}

export function useMultimedia() {
  const activeTab = ref(getTabFromHash())
  const themeColor = ref('#a855f7')

  // Theme colors per tab
  const tabColors = {
    'image': '#3b82f6',
    'audio': '#a855f7',
    '3d': '#22c55e',
    'svg': '#f97316'
  }

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Update theme color when tab changes
  watch(activeTab, (newTab) => {
    setHashFromTab(newTab)
    themeColor.value = tabColors[newTab] || '#a855f7'
  }, { immediate: true })

  // Listen for hash changes (back/forward navigation)
  const onHashChange = () => {
    activeTab.value = getTabFromHash()
  }

  onMounted(() => {
    window.addEventListener('hashchange', onHashChange)
    // Set initial hash if not present
    if (!window.location.hash) {
      setHashFromTab(activeTab.value)
    }
    // Set initial theme color
    themeColor.value = tabColors[activeTab.value] || '#a855f7'
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
