import { ref, watch, onMounted, onUnmounted } from 'vue'
import { replaceSectionHash } from '../lib/sectionHash'
import { buildHashMap, buildTabToHash, getToolColors, getDefaultTab } from '../config/tools'

const hashToTab = buildHashMap('apps')
const tabToHash = buildTabToHash('apps')
const tabColors = getToolColors('apps')
const defaultTab = getDefaultTab('apps')

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || defaultTab
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || defaultTab
  replaceSectionHash(hash)
}

export function useApps() {
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
    // Normaliza alias (p. ej. #md → #markdown) y fija el hash inicial
    setHashFromTab(activeTab.value)
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
