import { ref } from 'vue'

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const KEY_LENGTH = 20
const PBKDF2_ITERATIONS = 100000
const KNOWN_PLAINTEXT = 'app-crypto-verify'
const DB_NAME = 'app-crypto-db'
const STORE_NAME = 'meta'

// Singleton state (shared across all components)
const isLocked = ref(true)
const hasSetup = ref(false)
const generatedKey = ref('')
let storedPassword = null

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function useAppCrypto() {

  function generateNewKey() {
    const array = new Uint8Array(KEY_LENGTH)
    crypto.getRandomValues(array)
    generatedKey.value = Array.from(array).map(b => CHARSET[b % CHARSET.length]).join('')
    return generatedKey.value
  }

  async function checkHasSetup() {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get('crypto-meta')
      return new Promise((resolve) => {
        request.onsuccess = () => {
          db.close()
          hasSetup.value = !!request.result
          resolve(hasSetup.value)
        }
        request.onerror = () => { db.close(); resolve(false) }
      })
    } catch { return false }
  }

  async function setup(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(password, salt)
    const enc = new TextEncoder()
    const testCiphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(KNOWN_PLAINTEXT)
    )

    const meta = {
      id: 'crypto-meta',
      salt: Array.from(salt),
      iv: Array.from(iv),
      testCiphertext: Array.from(new Uint8Array(testCiphertext))
    }

    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(meta)

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        db.close()
        storedPassword = password
        isLocked.value = false
        hasSetup.value = true
        resolve(true)
      }
      tx.onerror = () => { db.close(); resolve(false) }
    })
  }

  async function unlock(password) {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get('crypto-meta')

      return new Promise((resolve) => {
        request.onsuccess = async () => {
          db.close()
          const meta = request.result
          if (!meta) { resolve(false); return }

          try {
            const salt = new Uint8Array(meta.salt)
            const iv = new Uint8Array(meta.iv)
            const testData = new Uint8Array(meta.testCiphertext)
            const key = await deriveKey(password, salt)
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, testData)
            const result = new TextDecoder().decode(decrypted)

            if (result === KNOWN_PLAINTEXT) {
              storedPassword = password
              isLocked.value = false
              resolve(true)
            } else {
              resolve(false)
            }
          } catch {
            resolve(false)
          }
        }
        request.onerror = () => { db.close(); resolve(false) }
      })
    } catch { return false }
  }

  function lock() {
    storedPassword = null
    isLocked.value = true
  }

  function hasKey() {
    return storedPassword !== null
  }

  async function encrypt(data) {
    if (!storedPassword) throw new Error('No key available - unlock first')
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const key = await deriveKey(storedPassword, salt)
    const enc = new TextEncoder()
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(JSON.stringify(data))
    )
    return { salt: Array.from(salt), iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }
  }

  async function decrypt(encObj) {
    if (!storedPassword) throw new Error('No key available - unlock first')
    const salt = new Uint8Array(encObj.salt)
    const iv = new Uint8Array(encObj.iv)
    const data = new Uint8Array(encObj.data)
    const key = await deriveKey(storedPassword, salt)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(decrypted))
  }

  async function resetCrypto() {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.delete('crypto-meta')
      return new Promise((resolve) => {
        tx.oncomplete = () => {
          db.close()
          storedPassword = null
          isLocked.value = true
          hasSetup.value = false
          generatedKey.value = ''
          resolve(true)
        }
        tx.onerror = () => { db.close(); resolve(false) }
      })
    } catch { return false }
  }

  return {
    isLocked,
    hasSetup,
    generatedKey,
    generateNewKey,
    checkHasSetup,
    setup,
    unlock,
    lock,
    hasKey,
    encrypt,
    decrypt,
    resetCrypto
  }
}
