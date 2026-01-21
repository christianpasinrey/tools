import { ref, watch, onMounted, onUnmounted } from 'vue'
import { sheets, categories } from '@/data/cheatsheets'

// Get all valid sheet IDs
const validSheets = sheets.map(s => s.id)

function getSheetFromHash() {
  const hash = window.location.hash.slice(1).toLowerCase()
  if (validSheets.includes(hash)) {
    return hash
  }
  return 'macos' // default
}

function setHashFromSheet(sheetId) {
  const newUrl = `${window.location.pathname}#${sheetId}`
  window.history.replaceState(null, '', newUrl)
}

export function useCheatsheets() {
  const activeSheet = ref(getSheetFromHash())

  // Listen for hash changes
  const onHashChange = () => {
    activeSheet.value = getSheetFromHash()
  }

  onMounted(() => {
    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      setHashFromSheet(activeSheet.value)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', onHashChange)
  })

  // Update hash when sheet changes
  watch(activeSheet, (newSheet) => {
    setHashFromSheet(newSheet)
  })

  return {
    activeSheet,
    sheets,
    categories
  }
}
