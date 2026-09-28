import { ref, computed } from 'vue'
import { getEntry } from '@/config/catalog'

const KEY_RECENT = 'tb:recent'
const KEY_FAVORITES = 'tb:favorites'
const MAX_RECENT = 8

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter(x => typeof x === 'string') : []
  } catch {
    return []
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* sin almacenamiento: solo en memoria */ }
}

const recentIds = ref(read(KEY_RECENT))
const favoriteIds = ref(read(KEY_FAVORITES))

export function _reloadRecentTools() {
  recentIds.value = read(KEY_RECENT)
  favoriteIds.value = read(KEY_FAVORITES)
}

const toEntries = (ids) => ids.map(getEntry).filter(Boolean)

export function useRecentTools() {
  const recent = computed(() => toEntries(recentIds.value))
  const favorites = computed(() => toEntries(favoriteIds.value))

  function recordVisit(id) {
    if (!getEntry(id)) return
    recentIds.value = [id, ...recentIds.value.filter(x => x !== id)].slice(0, MAX_RECENT)
    write(KEY_RECENT, recentIds.value)
  }

  function toggleFavorite(id) {
    if (!getEntry(id)) return
    favoriteIds.value = favoriteIds.value.includes(id)
      ? favoriteIds.value.filter(x => x !== id)
      : [...favoriteIds.value, id]
    write(KEY_FAVORITES, favoriteIds.value)
  }

  const isFavorite = (id) => favoriteIds.value.includes(id)

  return { recent, favorites, recordVisit, toggleFavorite, isFavorite }
}
