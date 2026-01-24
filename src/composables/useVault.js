import { useAppCrypto } from './useAppCrypto'
import { useCloudSync } from './useCloudSync'

const DB_NAME = 'app-vault'
const DB_VERSION = 1

export const STORES = [
  'image-presets',
  'svg-projects',
  'three-scenes',
  'pdf-documents',
  'spreadsheet-workbooks',
  'markdown-documents',
  'color-palettes',
  'devtools-snippets',
  'api-collections',
  'phone-configs',
  'map-projects',
  'invoice-configs',
  'kanban-boards'
]

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      for (const storeName of STORES) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useVault() {
  const crypto = useAppCrypto()
  const sync = useCloudSync()

  async function save(storeName, id, name, data) {
    if (!crypto.hasKey()) throw new Error('Vault locked')
    const encrypted = await crypto.encrypt(data)
    const entry = { id, name, encrypted, updatedAt: Date.now() }
    const db = await openDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.put(entry)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close()
        sync.onLocalSave(storeName, id, name, encrypted, entry.updatedAt)
        resolve(true)
      }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  async function load(storeName, id) {
    if (!crypto.hasKey()) throw new Error('Vault locked')
    const db = await openDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        db.close()
        const entry = request.result
        if (!entry) { resolve(null); return }
        try {
          const data = await crypto.decrypt(entry.encrypted)
          resolve(data)
        } catch (err) {
          reject(err)
        }
      }
      request.onerror = () => { db.close(); reject(request.error) }
    })
  }

  async function list(storeName) {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close()
        const items = (request.result || []).map(entry => ({
          id: entry.id,
          name: entry.name,
          updatedAt: entry.updatedAt
        }))
        items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        resolve(items)
      }
      request.onerror = () => { db.close(); reject(request.error) }
    })
  }

  async function remove(storeName, id) {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.delete(id)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close()
        sync.onLocalDelete(storeName, id)
        resolve(true)
      }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  async function getRawEntry(storeName, id) {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    return new Promise((resolve, reject) => {
      request.onsuccess = () => { db.close(); resolve(request.result || null) }
      request.onerror = () => { db.close(); reject(request.error) }
    })
  }

  async function saveRawEntry(storeName, id, name, encryptedPayload, updatedAt) {
    const entry = { id, name, encrypted: encryptedPayload, updatedAt }
    const db = await openDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.put(entry)
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(true) }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  async function clearStore(storeName) {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.clear()
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(true) }
      tx.onerror = () => { db.close(); reject(tx.error) }
    })
  }

  return {
    save,
    load,
    list,
    remove,
    clearStore,
    getRawEntry,
    saveRawEntry,
    isLocked: crypto.isLocked,
    hasKey: crypto.hasKey
  }
}
