import { ref } from 'vue'

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const KEY_LENGTH = 20
const PBKDF2_ITERATIONS = 600000
const KNOWN_PLAINTEXT = 'kanban-verify-ok'

export function useKanbanCrypto() {
  const isLocked = ref(true)
  const isFirstSetup = ref(false)
  const generatedKey = ref('')
  let derivedKey = null
  let currentSalt = null

  function generateKey() {
    const array = new Uint8Array(KEY_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array).map(b => CHARSET[b % CHARSET.length]).join('')
  }

  function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16))
  }

  function generateIV() {
    return crypto.getRandomValues(new Uint8Array(12))
  }

  function toBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
  }

  function fromBase64(str) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0))
  }

  async function deriveKeyFromPassphrase(passphrase, salt) {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']
    )
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  async function encrypt(data) {
    if (!derivedKey) throw new Error('No key available')
    const iv = generateIV()
    const enc = new TextEncoder()
    const plaintext = enc.encode(JSON.stringify(data))
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      plaintext
    )
    return {
      iv: toBase64(iv),
      ciphertext: toBase64(ciphertext),
      salt: toBase64(currentSalt)
    }
  }

  async function decrypt(iv, ciphertext, salt) {
    if (!derivedKey) throw new Error('No key available')
    const dec = new TextDecoder()
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(iv) },
      derivedKey,
      fromBase64(ciphertext)
    )
    return JSON.parse(dec.decode(plainBuffer))
  }

  function prepareSetup() {
    generatedKey.value = generateKey()
    isFirstSetup.value = true
  }

  async function confirmSetup() {
    const key = generatedKey.value
    if (!key) throw new Error('No key generated')
    currentSalt = generateSalt()
    derivedKey = await deriveKeyFromPassphrase(key, currentSalt)

    // Create test ciphertext for future verification
    const iv = generateIV()
    const enc = new TextEncoder()
    const testCiphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      enc.encode(KNOWN_PLAINTEXT)
    )

    isLocked.value = false
    isFirstSetup.value = false

    return {
      salt: toBase64(currentSalt),
      iv: toBase64(iv),
      ciphertextTest: toBase64(testCiphertext)
    }
  }

  async function verifyPassphrase(passphrase, testData) {
    try {
      const salt = fromBase64(testData.salt)
      const key = await deriveKeyFromPassphrase(passphrase, salt)
      const dec = new TextDecoder()
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromBase64(testData.iv) },
        key,
        fromBase64(testData.ciphertextTest)
      )
      const result = dec.decode(plainBuffer)
      if (result === KNOWN_PLAINTEXT) {
        derivedKey = key
        currentSalt = salt
        isLocked.value = false
        return true
      }
      return false
    } catch {
      return false
    }
  }

  function lock() {
    derivedKey = null
    isLocked.value = true
    generatedKey.value = ''
  }

  function hasKey() {
    return derivedKey !== null
  }

  return {
    isLocked,
    isFirstSetup,
    generatedKey,
    prepareSetup,
    confirmSetup,
    verifyPassphrase,
    encrypt,
    decrypt,
    lock,
    hasKey
  }
}
