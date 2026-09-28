import { ref, watch, onMounted, onUnmounted } from 'vue'
import { replaceSectionHash } from '../lib/sectionHash'

const validTabs = ['pdf', 'spreadsheet', 'docx', 'markdown', 'converter']

// Map hash names to internal tab names
export const hashToTab = {
  'pdf': 'pdf',
  'spreadsheet': 'spreadsheet',
  'spreadsheets': 'spreadsheet',
  'excel': 'spreadsheet',
  'docx': 'docx',
  'doc': 'docx',
  'documento': 'docx',
  'markdown': 'markdown',
  'md': 'markdown',
  'converter': 'converter',
  'convertidor': 'converter',
  'convert': 'converter'
}

// Map internal tab names to hash names
const tabToHash = {
  'pdf': 'pdf',
  'spreadsheet': 'spreadsheet',
  'docx': 'docx',
  'markdown': 'markdown',
  'converter': 'converter'
}

function getTabFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  return hashToTab[hash] || 'pdf'
}

function setHashFromTab(tab) {
  const hash = tabToHash[tab] || 'pdf'
  replaceSectionHash(hash)
}

export function useDocuments() {
  const activeTab = ref(getTabFromHash())

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
    // Normaliza alias (p. ej. #md → #markdown) y fija el hash inicial
    setHashFromTab(activeTab.value)
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', onHashChange)
  })

  return {
    activeTab
  }
}
