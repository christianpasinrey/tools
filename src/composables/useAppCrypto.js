import { ref } from 'vue'

const PBKDF2_ITERATIONS = 100000

// Singleton state
const isLocked = ref(true)
let storedPassword = null

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

  function setPassword(password) {
    storedPassword = password
    isLocked.value = false
  }

  function lock() {
    storedPassword = null
    isLocked.value = true
  }

  function hasKey() {
    return storedPassword !== null
  }

  async function encrypt(data) {
    if (!storedPassword) throw new Error('No key available - login first')
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
    if (!storedPassword) throw new Error('No key available - login first')
    const salt = new Uint8Array(encObj.salt)
    const iv = new Uint8Array(encObj.iv)
    const data = new Uint8Array(encObj.data)
    const key = await deriveKey(storedPassword, salt)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(decrypted))
  }

  return {
    isLocked,
    hasKey,
    setPassword,
    lock,
    encrypt,
    decrypt
  }
}
