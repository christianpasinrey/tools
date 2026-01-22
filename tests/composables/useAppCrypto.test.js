import { describe, it, expect, beforeEach } from 'vitest'
import { useAppCrypto } from '@/composables/useAppCrypto'

describe('useAppCrypto', () => {
  let crypto

  beforeEach(async () => {
    crypto = useAppCrypto()
    await crypto.resetCrypto()
    crypto.lock()
    // Clear the IDB database
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('app-crypto-db')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  })

  describe('generateNewKey', () => {
    it('generates a 20-character alphanumeric key', () => {
      const key = crypto.generateNewKey()
      expect(key).toHaveLength(20)
      expect(key).toMatch(/^[a-zA-Z0-9]+$/)
    })

    it('generates unique keys each time', () => {
      const key1 = crypto.generateNewKey()
      const key2 = crypto.generateNewKey()
      expect(key1).not.toBe(key2)
    })

    it('updates generatedKey ref', () => {
      const key = crypto.generateNewKey()
      expect(crypto.generatedKey.value).toBe(key)
    })
  })

  describe('initial state', () => {
    it('starts locked', () => {
      expect(crypto.isLocked.value).toBe(true)
    })

    it('hasKey returns false initially', () => {
      expect(crypto.hasKey()).toBe(false)
    })
  })

  describe('checkHasSetup', () => {
    it('returns false when no setup exists', async () => {
      const result = await crypto.checkHasSetup()
      expect(result).toBe(false)
      expect(crypto.hasSetup.value).toBe(false)
    })

    it('returns true after setup', async () => {
      await crypto.setup('test-password-123')
      crypto.lock()
      const result = await crypto.checkHasSetup()
      expect(result).toBe(true)
      expect(crypto.hasSetup.value).toBe(true)
    })
  })

  describe('setup', () => {
    it('sets up crypto and unlocks', async () => {
      const result = await crypto.setup('my-secure-key')
      expect(result).toBe(true)
      expect(crypto.isLocked.value).toBe(false)
      expect(crypto.hasSetup.value).toBe(true)
      expect(crypto.hasKey()).toBe(true)
    })

    it('persists setup in IDB', async () => {
      await crypto.setup('my-secure-key')
      crypto.lock()

      // Verify it persisted
      const fresh = useAppCrypto()
      const hasMeta = await fresh.checkHasSetup()
      expect(hasMeta).toBe(true)
    })
  })

  describe('unlock', () => {
    beforeEach(async () => {
      await crypto.setup('correct-password')
      crypto.lock()
    })

    it('unlocks with correct password', async () => {
      const result = await crypto.unlock('correct-password')
      expect(result).toBe(true)
      expect(crypto.isLocked.value).toBe(false)
      expect(crypto.hasKey()).toBe(true)
    })

    it('rejects wrong password', async () => {
      const result = await crypto.unlock('wrong-password')
      expect(result).toBe(false)
      expect(crypto.isLocked.value).toBe(true)
      expect(crypto.hasKey()).toBe(false)
    })

    it('rejects empty password', async () => {
      const result = await crypto.unlock('')
      expect(result).toBe(false)
      expect(crypto.isLocked.value).toBe(true)
    })
  })

  describe('lock', () => {
    it('locks the crypto and clears key', async () => {
      await crypto.setup('my-key')
      expect(crypto.hasKey()).toBe(true)

      crypto.lock()
      expect(crypto.isLocked.value).toBe(true)
      expect(crypto.hasKey()).toBe(false)
    })
  })

  describe('encrypt / decrypt', () => {
    beforeEach(async () => {
      await crypto.setup('encryption-key-123')
    })

    it('encrypts and decrypts a string', async () => {
      const original = 'Hello, World!'
      const encrypted = await crypto.encrypt(original)
      expect(encrypted).toHaveProperty('salt')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('data')
      expect(encrypted.salt).toBeInstanceOf(Array)
      expect(encrypted.iv).toBeInstanceOf(Array)
      expect(encrypted.data).toBeInstanceOf(Array)

      const decrypted = await crypto.decrypt(encrypted)
      expect(decrypted).toBe(original)
    })

    it('encrypts and decrypts an object', async () => {
      const original = { name: 'Test', values: [1, 2, 3], nested: { a: true } }
      const encrypted = await crypto.encrypt(original)
      const decrypted = await crypto.decrypt(encrypted)
      expect(decrypted).toEqual(original)
    })

    it('encrypts and decrypts an array', async () => {
      const original = [1, 'two', { three: 3 }]
      const encrypted = await crypto.encrypt(original)
      const decrypted = await crypto.decrypt(encrypted)
      expect(decrypted).toEqual(original)
    })

    it('encrypts and decrypts numeric values', async () => {
      const original = 42.5
      const encrypted = await crypto.encrypt(original)
      const decrypted = await crypto.decrypt(encrypted)
      expect(decrypted).toBe(42.5)
    })

    it('produces different ciphertext for same data (unique salt/iv)', async () => {
      const data = { test: 'value' }
      const enc1 = await crypto.encrypt(data)
      const enc2 = await crypto.encrypt(data)
      // Salt and IV should differ
      expect(enc1.salt).not.toEqual(enc2.salt)
      expect(enc1.iv).not.toEqual(enc2.iv)
    })

    it('throws when trying to encrypt while locked', async () => {
      crypto.lock()
      await expect(crypto.encrypt('data')).rejects.toThrow('No key available')
    })

    it('throws when trying to decrypt while locked', async () => {
      const encrypted = await crypto.encrypt('data')
      crypto.lock()
      await expect(crypto.decrypt(encrypted)).rejects.toThrow('No key available')
    })

    it('fails to decrypt with wrong key', async () => {
      const encrypted = await crypto.encrypt('secret data')
      // Reset and setup with different password
      await crypto.resetCrypto()
      await crypto.setup('different-key')
      await expect(crypto.decrypt(encrypted)).rejects.toThrow()
    })
  })

  describe('resetCrypto', () => {
    it('clears all crypto state', async () => {
      await crypto.setup('my-key')
      crypto.generateNewKey()

      const result = await crypto.resetCrypto()
      expect(result).toBe(true)
      expect(crypto.isLocked.value).toBe(true)
      expect(crypto.hasSetup.value).toBe(false)
      expect(crypto.hasKey()).toBe(false)
      expect(crypto.generatedKey.value).toBe('')
    })

    it('removes persistent data from IDB', async () => {
      await crypto.setup('my-key')
      await crypto.resetCrypto()

      const hasMeta = await crypto.checkHasSetup()
      expect(hasMeta).toBe(false)
    })

    it('makes previously encrypted data irrecoverable', async () => {
      await crypto.setup('my-key')
      const encrypted = await crypto.encrypt({ secret: 'data' })

      await crypto.resetCrypto()
      await crypto.setup('new-key')

      await expect(crypto.decrypt(encrypted)).rejects.toThrow()
    })
  })
})
