import 'fake-indexeddb/auto'
import { webcrypto } from 'node:crypto'

// Polyfill Web Crypto API for jsdom
if (!globalThis.crypto?.subtle) {
  globalThis.crypto = webcrypto
}
