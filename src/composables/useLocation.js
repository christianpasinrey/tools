import { ref, watch, onMounted, onUnmounted } from 'vue'

const validTabs = ['map']

const hashToTab = {
  'map': 'map',
  'maps': 'map',
  'editor': 'map'
}

const tabToHash = {
  'map': 'map'
}

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || 'map'
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || 'map'
  const newUrl = `${window.location.pathname}#${hash}`
  window.history.replaceState(null, '', newUrl)
}

export function useLocation() {
  const activeTab = ref(getTabFromHash())
  const themeColor = ref('#2563eb')

  const tabColors = {
    'map': '#2563eb'
  }

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  watch(activeTab, (newTab) => {
    setHashFromTab(newTab)
    themeColor.value = tabColors[newTab] || '#2563eb'
  }, { immediate: true })

  const onHashChange = () => {
    activeTab.value = getTabFromHash()
  }

  onMounted(() => {
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      setHashFromTab(activeTab.value)
    }
    themeColor.value = tabColors[activeTab.value] || '#2563eb'
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
