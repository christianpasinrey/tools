<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  themeColor: String
})

// ==========================================
// General State
// ==========================================
const activeStorageTab = ref('local') // local, indexed
const viewMode = ref('pretty') // pretty, raw
const selectedEntry = ref(null) // { source, key, value }
const copied = ref(false)

function copyValue(val) {
  navigator.clipboard.writeText(val)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatValue(val) {
  if (viewMode.value === 'raw') return typeof val === 'string' ? val : JSON.stringify(val)
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    return JSON.stringify(parsed, null, 2)
  } catch {
    return typeof val === 'string' ? val : JSON.stringify(val)
  }
}

function previewValue(val, max = 50) {
  const str = typeof val === 'string' ? val : JSON.stringify(val)
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

function getValueType(val) {
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val
    if (Array.isArray(parsed)) return 'array'
    if (parsed === null) return 'null'
    return typeof parsed
  } catch {
    return 'string'
  }
}

function getTypeColor(type) {
  const colors = { object: '#3b82f6', array: '#8b5cf6', string: '#10b981', number: '#f59e0b', boolean: '#ef4444', null: '#6b7280' }
  return colors[type] || '#6b7280'
}

// ==========================================
// localStorage
// ==========================================
const localEntries = ref([])
const localSearch = ref('')
const addingLocal = ref(false)
const editingLocal = ref(null)
const editLocalValue = ref('')
const newLocalKey = ref('')
const newLocalValue = ref('')

const filteredLocalEntries = computed(() => {
  if (!localSearch.value) return localEntries.value
  const q = localSearch.value.toLowerCase()
  return localEntries.value.filter(e => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q))
})

const localTotalSize = computed(() => {
  return localEntries.value.reduce((sum, e) => sum + e.size, 0)
})

function loadLocalStorage() {
  const entries = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const value = localStorage.getItem(key)
    entries.push({ key, value, size: new Blob([value]).size, type: getValueType(value) })
  }
  entries.sort((a, b) => a.key.localeCompare(b.key))
  localEntries.value = entries
}

function viewLocalEntry(entry) {
  selectedEntry.value = { source: 'localStorage', key: entry.key, value: entry.value }
}

function startEditLocal(entry) {
  editingLocal.value = entry.key
  try {
    editLocalValue.value = JSON.stringify(JSON.parse(entry.value), null, 2)
  } catch {
    editLocalValue.value = entry.value
  }
}

function saveLocalEdit() {
  if (!editingLocal.value) return
  let val = editLocalValue.value
  try { val = JSON.stringify(JSON.parse(val)) } catch {}
  localStorage.setItem(editingLocal.value, val)
  editingLocal.value = null
  editLocalValue.value = ''
  loadLocalStorage()
}

function deleteLocal(key) {
  localStorage.removeItem(key)
  if (selectedEntry.value?.key === key) selectedEntry.value = null
  if (editingLocal.value === key) editingLocal.value = null
  loadLocalStorage()
}

function addLocalEntry() {
  if (!newLocalKey.value.trim()) return
  localStorage.setItem(newLocalKey.value.trim(), newLocalValue.value)
  newLocalKey.value = ''
  newLocalValue.value = ''
  addingLocal.value = false
  loadLocalStorage()
}

function clearLocalStorage() {
  localStorage.clear()
  selectedEntry.value = null
  editingLocal.value = null
  loadLocalStorage()
}

// ==========================================
// IndexedDB
// ==========================================
const idbDatabases = ref([])
const idbSelectedDb = ref(null)
const idbSelectedDbVersion = ref(null)
const idbStores = ref([])
const idbSelectedStore = ref(null)
const idbEntries = ref([])
const idbLoading = ref(false)

const creatingDb = ref(false)
const newDbName = ref('')
const newDbStores = ref('')

const creatingStore = ref(false)
const newStoreName = ref('')

const addingIdbEntry = ref(false)
const newIdbKey = ref('')
const newIdbValue = ref('')

async function loadDatabases() {
  idbLoading.value = true
  try {
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases()
      idbDatabases.value = dbs.map(db => ({ name: db.name, version: db.version }))
    }
  } catch {
    idbDatabases.value = []
  }
  idbLoading.value = false
}

async function selectDatabase(db) {
  idbSelectedDb.value = db.name
  idbSelectedDbVersion.value = db.version
  idbSelectedStore.value = null
  idbEntries.value = []
  selectedEntry.value = null
  idbLoading.value = true

  try {
    const dbInstance = await openDb(db.name, db.version)
    idbStores.value = Array.from(dbInstance.objectStoreNames)
    dbInstance.close()
  } catch {
    idbStores.value = []
  }
  idbLoading.value = false
}

async function selectStore(storeName) {
  idbSelectedStore.value = storeName
  selectedEntry.value = null
  await loadStoreEntries()
}

async function loadStoreEntries() {
  idbLoading.value = true
  try {
    const db = await openDb(idbSelectedDb.value)
    const tx = db.transaction(idbSelectedStore.value, 'readonly')
    const store = tx.objectStore(idbSelectedStore.value)

    const entries = []
    const cursorReq = store.openCursor()
    await new Promise((resolve, reject) => {
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
          entries.push({ key: cursor.key, value: cursor.value, type: getValueType(cursor.value) })
          cursor.continue()
        } else {
          resolve()
        }
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    })
    idbEntries.value = entries
    db.close()
  } catch {
    idbEntries.value = []
  }
  idbLoading.value = false
}

function viewIdbEntry(entry) {
  selectedEntry.value = { source: 'IndexedDB', key: entry.key, value: typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value) }
}

async function deleteIdbEntry(key) {
  try {
    const db = await openDb(idbSelectedDb.value)
    const tx = db.transaction(idbSelectedStore.value, 'readwrite')
    tx.objectStore(idbSelectedStore.value).delete(key)
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error) })
    db.close()
    if (selectedEntry.value?.key === key) selectedEntry.value = null
    await loadStoreEntries()
  } catch {}
}

async function createDatabase() {
  if (!newDbName.value.trim()) return
  const stores = newDbStores.value.split(',').map(s => s.trim()).filter(Boolean)
  try {
    const req = indexedDB.open(newDbName.value.trim(), 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      stores.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { autoIncrement: true })
        }
      })
    }
    const db = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error) })
    db.close()
    newDbName.value = ''
    newDbStores.value = ''
    creatingDb.value = false
    await loadDatabases()
  } catch {}
}

async function createObjectStore() {
  if (!newStoreName.value.trim() || !idbSelectedDb.value) return
  try {
    const newVersion = (idbSelectedDbVersion.value || 1) + 1
    const req = indexedDB.open(idbSelectedDb.value, newVersion)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(newStoreName.value.trim())) {
        db.createObjectStore(newStoreName.value.trim(), { autoIncrement: true })
      }
    }
    const db = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error) })
    idbSelectedDbVersion.value = db.version
    idbStores.value = Array.from(db.objectStoreNames)
    db.close()
    newStoreName.value = ''
    creatingStore.value = false
    await loadDatabases()
  } catch {}
}

async function addIdbEntry() {
  if (!idbSelectedStore.value) return
  let val = newIdbValue.value
  try { val = JSON.parse(val) } catch {}

  try {
    const db = await openDb(idbSelectedDb.value)
    const tx = db.transaction(idbSelectedStore.value, 'readwrite')
    const store = tx.objectStore(idbSelectedStore.value)
    if (newIdbKey.value.trim()) {
      store.put(val, newIdbKey.value.trim())
    } else {
      store.add(val)
    }
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error) })
    db.close()
    newIdbKey.value = ''
    newIdbValue.value = ''
    addingIdbEntry.value = false
    await loadStoreEntries()
  } catch {}
}

async function deleteDatabase(dbName) {
  try {
    const req = indexedDB.deleteDatabase(dbName)
    await new Promise((resolve, reject) => { req.onsuccess = resolve; req.onerror = () => reject(req.error) })
    idbSelectedDb.value = null
    idbStores.value = []
    idbEntries.value = []
    selectedEntry.value = null
    await loadDatabases()
  } catch {}
}

async function clearStore() {
  if (!idbSelectedStore.value) return
  try {
    const db = await openDb(idbSelectedDb.value)
    const tx = db.transaction(idbSelectedStore.value, 'readwrite')
    tx.objectStore(idbSelectedStore.value).clear()
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error) })
    db.close()
    selectedEntry.value = null
    await loadStoreEntries()
  } catch {}
}

function openDb(name, version) {
  return new Promise((resolve, reject) => {
    const req = version ? indexedDB.open(name, version) : indexedDB.open(name)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ==========================================
// Init
// ==========================================
onMounted(() => {
  loadLocalStorage()
  loadDatabases()
})
</script>

<template>
  <div class="h-full flex">
    <!-- Left Panel: List -->
    <div class="flex-1 flex flex-col border-r border-neutral-800 min-w-0">
      <!-- Storage Tabs -->
      <div class="flex border-b border-neutral-800 shrink-0">
        <button
          @click="activeStorageTab = 'local'; selectedEntry = null"
          class="flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative"
          :class="activeStorageTab === 'local' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
        >
          localStorage
          <span class="ml-1 text-neutral-600">({{ localEntries.length }})</span>
          <div v-if="activeStorageTab === 'local'" class="absolute bottom-0 left-0 right-0 h-0.5" :style="{ backgroundColor: themeColor }"/>
        </button>
        <button
          @click="activeStorageTab = 'indexed'; selectedEntry = null"
          class="flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative"
          :class="activeStorageTab === 'indexed' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
        >
          IndexedDB
          <span class="ml-1 text-neutral-600">({{ idbDatabases.length }})</span>
          <div v-if="activeStorageTab === 'indexed'" class="absolute bottom-0 left-0 right-0 h-0.5" :style="{ backgroundColor: themeColor }"/>
        </button>
      </div>

      <!-- localStorage Panel -->
      <div v-if="activeStorageTab === 'local'" class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center gap-2 p-2 border-b border-neutral-800 shrink-0">
          <input
            v-model="localSearch"
            placeholder="Filter..."
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-500"
          />
          <button
            @click="addingLocal = !addingLocal"
            class="px-2 py-1.5 text-xs rounded transition-colors shrink-0"
            :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          >
            + Add
          </button>
          <button @click="loadLocalStorage" class="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors" title="Refresh">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button
            v-if="localEntries.length"
            @click="clearLocalStorage"
            class="px-2 py-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors"
            title="Clear all"
          >
            Clear
          </button>
        </div>

        <div v-if="addingLocal" class="p-2 border-b border-neutral-800 shrink-0">
          <input v-model="newLocalKey" placeholder="Key" class="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-500 mb-1.5" />
          <textarea v-model="newLocalValue" placeholder="Value (text or JSON)" class="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder-neutral-600 outline-none focus:border-neutral-500 resize-none h-16 mb-1.5" />
          <div class="flex gap-1.5">
            <button @click="addLocalEntry" class="px-2.5 py-1 text-xs rounded" :style="{ backgroundColor: themeColor + '20', color: themeColor }">Save</button>
            <button @click="addingLocal = false" class="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
          </div>
        </div>

        <div v-if="editingLocal" class="p-2 border-b border-neutral-800 shrink-0">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-mono" :style="{ color: themeColor }">{{ editingLocal }}</span>
          </div>
          <textarea v-model="editLocalValue" class="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-neutral-500 resize-y h-32 mb-1.5" />
          <div class="flex gap-1.5">
            <button @click="saveLocalEdit" class="px-2.5 py-1 text-xs rounded" :style="{ backgroundColor: themeColor + '20', color: themeColor }">Save</button>
            <button @click="editingLocal = null" class="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div
            v-for="entry in filteredLocalEntries"
            :key="entry.key"
            @click="viewLocalEntry(entry)"
            class="flex items-center gap-2 px-3 py-2 border-b border-neutral-800/50 cursor-pointer transition-colors group"
            :class="selectedEntry?.key === entry.key && selectedEntry?.source === 'localStorage' ? 'bg-neutral-800/50' : 'hover:bg-neutral-800/30'"
          >
            <div class="flex-1 min-w-0">
              <div class="text-xs font-mono text-neutral-200 truncate">{{ entry.key }}</div>
              <div class="text-xs text-neutral-500 font-mono truncate mt-0.5">{{ previewValue(entry.value) }}</div>
            </div>
            <span class="text-xs px-1.5 py-0.5 rounded shrink-0" :style="{ backgroundColor: getTypeColor(entry.type) + '15', color: getTypeColor(entry.type) }">
              {{ entry.type }}
            </span>
            <span class="text-xs text-neutral-600 shrink-0">{{ formatSize(entry.size) }}</span>
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
              <button @click.stop="startEditLocal(entry)" class="p-1 text-neutral-500 hover:text-blue-400 transition-colors" title="Edit">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button @click.stop="deleteLocal(entry.key)" class="p-1 text-neutral-500 hover:text-red-400 transition-colors" title="Delete">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="filteredLocalEntries.length === 0" class="text-center py-12 text-neutral-600 text-xs">
            {{ localSearch ? 'No matches' : 'localStorage is empty' }}
          </div>
        </div>

        <div class="flex items-center justify-between px-3 py-1.5 border-t border-neutral-800 text-xs text-neutral-600 shrink-0">
          <span>{{ filteredLocalEntries.length }} entries</span>
          <span>Total: {{ formatSize(localTotalSize) }}</span>
        </div>
      </div>

      <!-- IndexedDB Panel -->
      <div v-if="activeStorageTab === 'indexed'" class="flex-1 flex flex-col min-h-0">
        <div class="flex items-center gap-2 p-2 border-b border-neutral-800 shrink-0">
          <select
            :value="idbSelectedDb || ''"
            @change="selectDatabase(idbDatabases.find(d => d.name === $event.target.value))"
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-neutral-500 cursor-pointer"
          >
            <option value="" disabled>Select database...</option>
            <option v-for="db in idbDatabases" :key="db.name" :value="db.name">{{ db.name }} (v{{ db.version }})</option>
          </select>
          <button
            @click="creatingDb = !creatingDb"
            class="px-2 py-1.5 text-xs rounded transition-colors shrink-0"
            :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          >
            + DB
          </button>
          <button @click="loadDatabases" class="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors" title="Refresh">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          <button
            v-if="idbSelectedDb"
            @click="deleteDatabase(idbSelectedDb)"
            class="px-2 py-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors shrink-0"
          >
            Delete
          </button>
        </div>

        <div v-if="creatingDb" class="p-2 border-b border-neutral-800 shrink-0">
          <input v-model="newDbName" placeholder="Database name" class="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-500 mb-1.5" />
          <input v-model="newDbStores" placeholder="Object stores (comma separated)" class="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-500 mb-1.5" />
          <div class="flex gap-1.5">
            <button @click="createDatabase" class="px-2.5 py-1 text-xs rounded" :style="{ backgroundColor: themeColor + '20', color: themeColor }">Create</button>
            <button @click="creatingDb = false" class="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
          </div>
        </div>

        <div v-if="idbSelectedDb" class="flex items-center gap-2 p-2 border-b border-neutral-800 shrink-0">
          <div class="flex flex-wrap gap-1 flex-1">
            <button
              v-for="store in idbStores"
              :key="store"
              @click="selectStore(store)"
              class="px-2.5 py-1 text-xs rounded transition-colors"
              :class="idbSelectedStore === store ? 'text-white' : 'text-neutral-400 bg-neutral-800 border border-neutral-700 hover:border-neutral-600'"
              :style="idbSelectedStore === store ? { backgroundColor: themeColor + '25', color: themeColor, border: '1px solid ' + themeColor + '50' } : {}"
            >
              {{ store }}
            </button>
            <button v-if="!creatingStore" @click="creatingStore = true" class="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">+ store</button>
          </div>
          <button
            v-if="idbSelectedStore && idbEntries.length"
            @click="clearStore"
            class="px-2 py-1 text-xs text-red-400/60 hover:text-red-400 transition-colors shrink-0"
          >
            Clear
          </button>
        </div>

        <div v-if="creatingStore" class="p-2 border-b border-neutral-800 shrink-0">
          <div class="flex gap-1.5">
            <input v-model="newStoreName" placeholder="Store name" class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-500" @keydown.enter="createObjectStore" />
            <button @click="createObjectStore" class="px-2.5 py-1 text-xs rounded" :style="{ backgroundColor: themeColor + '20', color: themeColor }">Create</button>
            <button @click="creatingStore = false" class="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
          </div>
        </div>

        <div v-if="addingIdbEntry" class="p-2 border-b border-neutral-800 shrink-0">
          <input v-model="newIdbKey" placeholder="Key (leave empty for auto-increment)" class="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-neutral-500 mb-1.5" />
          <textarea v-model="newIdbValue" placeholder='Value (JSON or text)' class="w-full bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white font-mono placeholder-neutral-600 outline-none focus:border-neutral-500 resize-none h-16 mb-1.5" />
          <div class="flex gap-1.5">
            <button @click="addIdbEntry" class="px-2.5 py-1 text-xs rounded" :style="{ backgroundColor: themeColor + '20', color: themeColor }">Add</button>
            <button @click="addingIdbEntry = false" class="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div v-if="idbSelectedStore && !addingIdbEntry" class="px-3 py-1.5 border-b border-neutral-800/50">
            <button @click="addingIdbEntry = true" class="text-xs transition-colors" :style="{ color: themeColor }">+ Add entry</button>
          </div>

          <div v-if="idbLoading" class="flex items-center justify-center py-12">
            <div class="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin"/>
          </div>

          <template v-else-if="idbSelectedStore">
            <div
              v-for="entry in idbEntries"
              :key="entry.key"
              @click="viewIdbEntry(entry)"
              class="flex items-center gap-2 px-3 py-2 border-b border-neutral-800/50 cursor-pointer transition-colors group"
              :class="selectedEntry?.key === entry.key && selectedEntry?.source === 'IndexedDB' ? 'bg-neutral-800/50' : 'hover:bg-neutral-800/30'"
            >
              <div class="flex-1 min-w-0">
                <div class="text-xs font-mono text-neutral-200">{{ entry.key }}</div>
                <div class="text-xs text-neutral-500 font-mono truncate mt-0.5">{{ previewValue(entry.value) }}</div>
              </div>
              <span class="text-xs px-1.5 py-0.5 rounded shrink-0" :style="{ backgroundColor: getTypeColor(entry.type) + '15', color: getTypeColor(entry.type) }">
                {{ entry.type }}
              </span>
              <button @click.stop="deleteIdbEntry(entry.key)" class="p-1 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all shrink-0" title="Delete">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
            <div v-if="idbEntries.length === 0" class="text-center py-12 text-neutral-600 text-xs">Object store is empty</div>
          </template>

          <div v-else-if="idbSelectedDb && idbStores.length === 0" class="text-center py-12 text-neutral-600 text-xs">No object stores in this database</div>
          <div v-else-if="!idbSelectedDb" class="text-center py-12 text-neutral-600 text-xs">{{ idbDatabases.length ? 'Select a database' : 'No IndexedDB databases found' }}</div>
        </div>

        <div v-if="idbSelectedStore" class="flex items-center justify-between px-3 py-1.5 border-t border-neutral-800 text-xs text-neutral-600 shrink-0">
          <span>{{ idbEntries.length }} entries</span>
          <span>{{ idbSelectedDb }} / {{ idbSelectedStore }}</span>
        </div>
      </div>
    </div>

    <!-- Right Panel: Value Viewer -->
    <div class="w-[45%] flex flex-col min-w-0 shrink-0">
      <div class="flex items-center justify-between px-3 py-2 border-b border-neutral-800 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <span v-if="selectedEntry" class="text-xs text-neutral-500 truncate">
            <span class="text-neutral-600">{{ selectedEntry.source }}</span>
            <span class="mx-1 text-neutral-700">/</span>
            <span :style="{ color: themeColor }">{{ selectedEntry.key }}</span>
          </span>
          <span v-else class="text-xs text-neutral-600">Select an entry to view</span>
        </div>
        <div v-if="selectedEntry" class="flex items-center gap-1 shrink-0">
          <div class="flex bg-neutral-800 rounded overflow-hidden border border-neutral-700">
            <button @click="viewMode = 'pretty'" class="px-2 py-1 text-xs transition-colors" :class="viewMode === 'pretty' ? 'text-white bg-neutral-700' : 'text-neutral-500 hover:text-neutral-300'">Pretty</button>
            <button @click="viewMode = 'raw'" class="px-2 py-1 text-xs transition-colors" :class="viewMode === 'raw' ? 'text-white bg-neutral-700' : 'text-neutral-500 hover:text-neutral-300'">Raw</button>
          </div>
          <button @click="copyValue(formatValue(selectedEntry.value))" class="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors" title="Copy">
            <svg v-if="!copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-3">
        <pre v-if="selectedEntry" class="text-xs text-neutral-300 font-mono whitespace-pre-wrap break-all leading-relaxed">{{ formatValue(selectedEntry.value) }}</pre>
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center text-neutral-700">
            <svg class="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
            </svg>
            <div class="text-xs">Click an entry to preview its value</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
