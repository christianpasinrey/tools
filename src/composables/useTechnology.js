import { ref, watch, onMounted, onUnmounted } from 'vue'
import { buildHashMap, buildTabToHash, getToolColors, getDefaultTab } from '../config/tools'

const hashToTab = buildHashMap('technology')
const tabToHash = buildTabToHash('technology')
const tabColors = getToolColors('technology')
const defaultTab = getDefaultTab('technology')

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || defaultTab
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || defaultTab
  const newUrl = `${window.location.pathname}#${hash}`
  window.history.replaceState(null, '', newUrl)
}

export function useTechnology() {
  const activeTab = ref(getTabFromHash())
  const themeColor = ref(tabColors[defaultTab])

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  watch(activeTab, (newTab) => {
    setHashFromTab(newTab)
    themeColor.value = tabColors[newTab] || tabColors[defaultTab]
  }, { immediate: true })

  const onHashChange = () => {
    activeTab.value = getTabFromHash()
  }

  onMounted(() => {
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      setHashFromTab(activeTab.value)
    }
    themeColor.value = tabColors[activeTab.value] || tabColors[defaultTab]
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
