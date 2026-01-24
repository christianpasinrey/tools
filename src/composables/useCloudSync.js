import { ref } from 'vue'
import { useAuth } from './useAuth'

// Singleton state
const syncStatus = ref('idle') // 'idle' | 'syncing' | 'error' | 'offline'
const lastSyncTime = ref(null)
const pendingChanges = ref([])
const syncErrors = ref([])
const syncProgress = ref({ current: 0, total: 0 })

const PENDING_KEY = 'tools-sync-pending'
const LAST_SYNC_KEY = 'tools-sync-last'

// Base64 helpers
function toBase64(numberArray) {
  const bytes = new Uint8Array(numberArray)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(b64String) {
  const binary = atob(b64String)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return Array.from(bytes)
}

function encryptedToBase64(encrypted) {
  return {
    salt: toBase64(encrypted.salt),
    iv: toBase64(encrypted.iv),
    data: toBase64(encrypted.data)
  }
}

function base64ToEncrypted(payload) {
  return {
    salt: fromBase64(payload.salt),
    iv: fromBase64(payload.iv),
    data: fromBase64(payload.data)
  }
}

export function useCloudSync() {
  const auth = useAuth()

  // Vault access (set externally via setVaultAccess)
  let vaultGetRaw = null
  let vaultSaveRaw = null
  let vaultList = null
  let vaultRemove = null
  let vaultStores = []

  function setVaultAccess({ getRawEntry, saveRawEntry, list, remove, stores }) {
    vaultGetRaw = getRawEntry
    vaultSaveRaw = saveRawEntry
    vaultList = list
    vaultRemove = remove
    vaultStores = stores
  }

  // ---- Offline Queue ----

  function loadPendingQueue() {
    const stored = localStorage.getItem(PENDING_KEY)
    if (stored) {
      try { pendingChanges.value = JSON.parse(stored) } catch { pendingChanges.value = [] }
    }
    const lastSync = localStorage.getItem(LAST_SYNC_KEY)
    if (lastSync) lastSyncTime.value = Number(lastSync)
  }

  function savePendingQueue() {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pendingChanges.value))
  }

  function enqueue(action, storeName, itemId, itemName, encryptedPayload, updatedAt) {
    pendingChanges.value = pendingChanges.value.filter(
      p => !(p.storeName === storeName && p.itemId === itemId)
    )
    pendingChanges.value.push({ action, storeName, itemId, itemName, encryptedPayload, updatedAt })
    savePendingQueue()
  }

  // ---- Push / Pull ----

  async function pushItem(storeName, itemId, itemName, encryptedPayload, updatedAt) {
    const response = await auth.authFetch(`/vault/${storeName}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ itemName, encryptedPayload, updatedAt })
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Push failed')
    }
  }

  async function deleteRemote(storeName, itemId) {
    const response = await auth.authFetch(`/vault/${storeName}/${itemId}`, {
      method: 'DELETE'
    })
    if (!response.ok && response.status !== 404) {
      throw new Error('Delete failed')
    }
  }

  async function pullItem(storeName, itemId) {
    const response = await auth.authFetch(`/vault/${storeName}/${itemId}`)
    if (!response.ok) throw new Error('Pull failed')
    return response.json()
  }

  async function getSyncStatus(since = null) {
    const url = since ? `/vault/sync-status?since=${since}` : '/vault/sync-status'
    const response = await auth.authFetch(url)
    if (!response.ok) throw new Error('Sync status fetch failed')
    return response.json()
  }

  // ---- Flush pending queue ----

  async function flushPendingQueue() {
    const queue = [...pendingChanges.value]
    for (const item of queue) {
      try {
        if (item.action === 'put') {
          await pushItem(item.storeName, item.itemId, item.itemName, item.encryptedPayload, item.updatedAt)
        } else if (item.action === 'delete') {
          await deleteRemote(item.storeName, item.itemId)
        }
        pendingChanges.value = pendingChanges.value.filter(
          p => !(p.storeName === item.storeName && p.itemId === item.itemId)
        )
      } catch {
        // Leave in queue for next attempt
      }
    }
    savePendingQueue()
  }

  // ---- Full Sync ----

  async function fullSync() {
    if (!auth.isAuthenticated.value) return
    if (syncStatus.value === 'syncing') return
    if (!vaultList || !vaultGetRaw || !vaultSaveRaw) return

    syncStatus.value = 'syncing'
    syncErrors.value = []

    try {
      // Step 1: Flush pending queue
      await flushPendingQueue()

      // Step 2: Get remote sync status
      const remote = await getSyncStatus()

      // Step 3: Get local items from all stores
      const localItems = []
      for (const storeName of vaultStores) {
        try {
          const items = await vaultList(storeName)
          for (const item of items) {
            localItems.push({ storeName, itemId: item.id, itemName: item.name, updatedAt: item.updatedAt })
          }
        } catch { /* store might not exist yet */ }
      }

      // Step 4: Build lookup maps
      const remoteMap = new Map()
      for (const r of remote.items) {
        remoteMap.set(`${r.storeName}:${r.itemId}`, r)
      }
      const localMap = new Map()
      for (const l of localItems) {
        localMap.set(`${l.storeName}:${l.itemId}`, l)
      }

      // Step 5: Process deletions
      const toDeleteLocal = []
      const deletionSet = new Set()
      for (const d of (remote.deletions || [])) {
        deletionSet.add(`${d.storeName}:${d.itemId}`)
        const local = localMap.get(`${d.storeName}:${d.itemId}`)
        if (local && d.deletedAt > local.updatedAt) {
          toDeleteLocal.push({ storeName: d.storeName, itemId: d.itemId })
        }
      }

      // Step 6: Determine pushes and pulls
      const toPush = []
      const toPull = []

      for (const [key, local] of localMap) {
        if (deletionSet.has(key)) continue
        const remoteItem = remoteMap.get(key)
        if (!remoteItem || local.updatedAt > remoteItem.updatedAt) {
          toPush.push(local)
        }
      }
      for (const [key, remoteItem] of remoteMap) {
        const local = localMap.get(key)
        if (!local || remoteItem.updatedAt > local.updatedAt) {
          toPull.push(remoteItem)
        }
      }

      // Step 7: Execute
      syncProgress.value = { current: 0, total: toPush.length + toPull.length + toDeleteLocal.length }

      // Push
      for (const item of toPush) {
        try {
          const entry = await vaultGetRaw(item.storeName, item.itemId)
          if (entry) {
            const payload = encryptedToBase64(entry.encrypted)
            await pushItem(item.storeName, item.itemId, entry.name, payload, entry.updatedAt)
          }
          syncProgress.value.current++
        } catch (err) {
          syncErrors.value.push({ type: 'push', ...item, error: err.message })
        }
      }

      // Pull
      for (const item of toPull) {
        try {
          const remoteData = await pullItem(item.storeName, item.itemId)
          const encrypted = base64ToEncrypted(remoteData.encryptedPayload)
          await vaultSaveRaw(item.storeName, remoteData.itemId, remoteData.itemName, encrypted, remoteData.updatedAt)
          syncProgress.value.current++
        } catch (err) {
          syncErrors.value.push({ type: 'pull', ...item, error: err.message })
        }
      }

      // Delete local
      for (const item of toDeleteLocal) {
        try {
          await vaultRemove(item.storeName, item.itemId)
          syncProgress.value.current++
        } catch (err) {
          syncErrors.value.push({ type: 'delete', ...item, error: err.message })
        }
      }

      lastSyncTime.value = Date.now()
      localStorage.setItem(LAST_SYNC_KEY, lastSyncTime.value.toString())
      syncStatus.value = syncErrors.value.length > 0 ? 'error' : 'idle'

    } catch (err) {
      syncStatus.value = 'error'
      syncErrors.value.push({ type: 'general', error: err.message })
    }
  }

  // ---- Hooks called from useVault ----

  async function onLocalSave(storeName, itemId, itemName, encrypted, updatedAt) {
    if (!auth.isAuthenticated.value) return
    const payload = encryptedToBase64(encrypted)
    if (!navigator.onLine) {
      enqueue('put', storeName, itemId, itemName, payload, updatedAt)
      return
    }
    try {
      await pushItem(storeName, itemId, itemName, payload, updatedAt)
    } catch {
      enqueue('put', storeName, itemId, itemName, payload, updatedAt)
    }
  }

  async function onLocalDelete(storeName, itemId) {
    if (!auth.isAuthenticated.value) return
    if (!navigator.onLine) {
      enqueue('delete', storeName, itemId, null, null, Date.now())
      return
    }
    try {
      await deleteRemote(storeName, itemId)
    } catch {
      enqueue('delete', storeName, itemId, null, null, Date.now())
    }
  }

  return {
    syncStatus,
    lastSyncTime,
    pendingChanges,
    syncErrors,
    syncProgress,
    setVaultAccess,
    loadPendingQueue,
    fullSync,
    onLocalSave,
    onLocalDelete
  }
}
