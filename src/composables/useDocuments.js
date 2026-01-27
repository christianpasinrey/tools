import { ref, watch, onMounted, onUnmounted } from 'vue'

const validTabs = ['pdf', 'spreadsheet', 'docx', 'markdown']

// Map hash names to internal tab names
const hashToTab = {
  'pdf': 'pdf',
  'spreadsheet': 'spreadsheet',
  'spreadsheets': 'spreadsheet',
  'excel': 'spreadsheet',
  'docx': 'docx',
  'doc': 'docx',
  'documento': 'docx',
  'markdown': 'markdown',
  'md': 'markdown'
}

// Map internal tab names to hash names
const tabToHash = {
  'pdf': 'pdf',
  'spreadsheet': 'spreadsheet',
  'docx': 'docx',
  'markdown': 'markdown'
}

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || 'pdf'
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || 'pdf'
  const newUrl = `${window.location.pathname}#${hash}`
  window.history.replaceState(null, '', newUrl)
}

export function useDocuments() {
  const activeTab = ref(getTabFromHash())
  const themeColor = ref('#22c55e')

  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Update hash when tab changes
  watch(activeTab, (newTab) => {
    setHashFromTab(newTab)
  })

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
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', onHashChange)
  })

  return {
    activeTab,
    themeColor,
    setThemeColor
  }
}
