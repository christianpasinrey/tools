import { describe, it, expect, beforeEach } from 'vitest'
import { useVault } from '@/composables/useVault'
import { useAppCrypto } from '@/composables/useAppCrypto'

describe('useVault', () => {
  let vault
  let crypto

  beforeEach(async () => {
    crypto = useAppCrypto()
    await crypto.resetCrypto()
    crypto.lock()

    // Clean vault DB
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('app-vault')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase('app-crypto-db')
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })

    // Setup crypto for vault operations
    await crypto.setup('test-vault-password')
    vault = useVault()
  })

  describe('save', () => {
    it('saves data to a store', async () => {
      const result = await vault.save('color-palettes', 'pal1', 'My Palette', { colors: ['#ff0000'] })
      expect(result).toBe(true)
    })

    it('saves complex nested objects', async () => {
      const data = {
        name: 'Complex',
        nested: { deep: { value: 42 } },
        array: [1, 'two', { three: true }]
      }
      await vault.save('devtools-snippets', 'snip1', 'Complex Snippet', data)
      const loaded = await vault.load('devtools-snippets', 'snip1')
      expect(loaded).toEqual(data)
    })

    it('overwrites existing entries with same id', async () => {
      await vault.save('color-palettes', 'pal1', 'Version 1', { v: 1 })
      await vault.save('color-palettes', 'pal1', 'Version 2', { v: 2 })

      const loaded = await vault.load('color-palettes', 'pal1')
      expect(loaded).toEqual({ v: 2 })
    })

    it('throws when vault is locked', async () => {
      crypto.lock()
      await expect(vault.save('color-palettes', 'x', 'test', {})).rejects.toThrow('Vault locked')
    })

    it('saves to different stores independently', async () => {
      await vault.save('color-palettes', 'id1', 'Palette', { type: 'palette' })
      await vault.save('devtools-snippets', 'id1', 'Snippet', { type: 'snippet' })

      const palette = await vault.load('color-palettes', 'id1')
      const snippet = await vault.load('devtools-snippets', 'id1')
      expect(palette.type).toBe('palette')
      expect(snippet.type).toBe('snippet')
    })
  })

  describe('load', () => {
    it('loads saved data', async () => {
      const original = { brightness: 10, contrast: 20 }
      await vault.save('image-presets', 'preset1', 'Bright', original)
      const loaded = await vault.load('image-presets', 'preset1')
      expect(loaded).toEqual(original)
    })

    it('returns null for non-existent id', async () => {
      const result = await vault.load('image-presets', 'nonexistent')
      expect(result).toBeNull()
    })

    it('throws when vault is locked', async () => {
      await vault.save('image-presets', 'p1', 'Test', { x: 1 })
      crypto.lock()
      await expect(vault.load('image-presets', 'p1')).rejects.toThrow('Vault locked')
    })

    it('decrypts data correctly after re-unlock', async () => {
      const data = { secret: 'my-api-key-123' }
      await vault.save('api-collections', 'col1', 'API Keys', data)

      crypto.lock()
      await crypto.unlock('test-vault-password')

      const loaded = await vault.load('api-collections', 'col1')
      expect(loaded).toEqual(data)
    })
  })

  describe('list', () => {
    it('returns empty array for empty store', async () => {
      const items = await vault.list('svg-projects')
      expect(items).toEqual([])
    })

    it('lists items with metadata (id, name, updatedAt)', async () => {
      await vault.save('svg-projects', 'proj1', 'Logo Design', { elements: [] })
      await vault.save('svg-projects', 'proj2', 'Icon Set', { elements: [] })

      const items = await vault.list('svg-projects')
      expect(items).toHaveLength(2)
      expect(items[0]).toHaveProperty('id')
      expect(items[0]).toHaveProperty('name')
      expect(items[0]).toHaveProperty('updatedAt')
      expect(items.map(i => i.name)).toContain('Logo Design')
      expect(items.map(i => i.name)).toContain('Icon Set')
    })

    it('does not include encrypted data in list', async () => {
      await vault.save('svg-projects', 'proj1', 'Test', { secret: 'data' })
      const items = await vault.list('svg-projects')
      expect(items[0]).not.toHaveProperty('encrypted')
      expect(items[0]).not.toHaveProperty('secret')
    })

    it('sorts by updatedAt descending (newest first)', async () => {
      await vault.save('markdown-documents', 'doc1', 'First', { content: '1' })
      // Small delay to ensure different timestamps
      await new Promise(r => setTimeout(r, 10))
      await vault.save('markdown-documents', 'doc2', 'Second', { content: '2' })

      const items = await vault.list('markdown-documents')
      expect(items[0].name).toBe('Second')
      expect(items[1].name).toBe('First')
    })

    it('works when vault is locked (no decryption needed)', async () => {
      await vault.save('color-palettes', 'p1', 'Warm', { colors: [] })
      crypto.lock()
      // list doesn't decrypt, so it shouldn't throw
      const items = await vault.list('color-palettes')
      expect(items).toHaveLength(1)
      expect(items[0].name).toBe('Warm')
    })
  })

  describe('remove', () => {
    it('removes an existing item', async () => {
      await vault.save('phone-configs', 'cfg1', 'Production', { url: 'wss://pbx.example.com' })
      await vault.remove('phone-configs', 'cfg1')

      const items = await vault.list('phone-configs')
      expect(items).toHaveLength(0)
    })

    it('does not throw for non-existent id', async () => {
      await expect(vault.remove('phone-configs', 'nonexistent')).resolves.toBe(true)
    })

    it('only removes the specified item', async () => {
      await vault.save('phone-configs', 'cfg1', 'Config 1', { x: 1 })
      await vault.save('phone-configs', 'cfg2', 'Config 2', { x: 2 })
      await vault.remove('phone-configs', 'cfg1')

      const items = await vault.list('phone-configs')
      expect(items).toHaveLength(1)
      expect(items[0].id).toBe('cfg2')
    })
  })

  describe('clearStore', () => {
    it('removes all items from a store', async () => {
      await vault.save('map-projects', 'm1', 'Map 1', { markers: [] })
      await vault.save('map-projects', 'm2', 'Map 2', { markers: [] })
      await vault.save('map-projects', 'm3', 'Map 3', { markers: [] })

      await vault.clearStore('map-projects')
      const items = await vault.list('map-projects')
      expect(items).toHaveLength(0)
    })

    it('does not affect other stores', async () => {
      await vault.save('map-projects', 'm1', 'Map', { markers: [] })
      await vault.save('color-palettes', 'p1', 'Palette', { colors: [] })

      await vault.clearStore('map-projects')
      const palettes = await vault.list('color-palettes')
      expect(palettes).toHaveLength(1)
    })
  })

  describe('store isolation', () => {
    it('each store operates independently', async () => {
      const stores = ['image-presets', 'svg-projects', 'three-scenes', 'pdf-documents',
        'spreadsheet-workbooks', 'markdown-documents', 'color-palettes', 'devtools-snippets',
        'api-collections', 'phone-configs', 'map-projects', 'invoice-configs', 'kanban-boards']

      // Save one item in each store
      for (const store of stores) {
        await vault.save(store, 'item1', `Item in ${store}`, { store })
      }

      // Verify each store has exactly one item
      for (const store of stores) {
        const items = await vault.list(store)
        expect(items).toHaveLength(1)
        const data = await vault.load(store, 'item1')
        expect(data.store).toBe(store)
      }
    })
  })

  describe('data integrity', () => {
    it('preserves large strings', async () => {
      const largeContent = 'x'.repeat(100000)
      await vault.save('markdown-documents', 'big', 'Large Doc', { content: largeContent })
      const loaded = await vault.load('markdown-documents', 'big')
      expect(loaded.content).toHaveLength(100000)
      expect(loaded.content).toBe(largeContent)
    })

    it('preserves special characters', async () => {
      const data = { content: '¡Hola! 日本語 ™ © ® ≈ ∞ «»' }
      await vault.save('markdown-documents', 'special', 'Special', data)
      const loaded = await vault.load('markdown-documents', 'special')
      expect(loaded.content).toBe(data.content)
    })

    it('preserves nested arrays and objects', async () => {
      const data = {
        sheets: [
          { name: 'Sheet1', data: [[1, 2], [3, 4]], styles: { A1: { bold: true } } },
          { name: 'Sheet2', data: [['a', 'b']], styles: {} }
        ],
        activeSheetIndex: 0
      }
      await vault.save('spreadsheet-workbooks', 'wb1', 'Workbook', data)
      const loaded = await vault.load('spreadsheet-workbooks', 'wb1')
      expect(loaded).toEqual(data)
    })

    it('preserves numeric arrays (like PDF bytes)', async () => {
      const bytes = Array.from({ length: 1000 }, (_, i) => i % 256)
      const data = { pdfBytes: bytes, fileName: 'test.pdf' }
      await vault.save('pdf-documents', 'pdf1', 'Test PDF', data)
      const loaded = await vault.load('pdf-documents', 'pdf1')
      expect(loaded.pdfBytes).toEqual(bytes)
    })

    it('handles null and undefined values in objects', async () => {
      const data = { a: null, b: undefined, c: 0, d: '', e: false }
      await vault.save('devtools-snippets', 's1', 'Nulls', data)
      const loaded = await vault.load('devtools-snippets', 's1')
      // JSON.stringify/parse removes undefined
      expect(loaded.a).toBeNull()
      expect(loaded.b).toBeUndefined()
      expect(loaded.c).toBe(0)
      expect(loaded.d).toBe('')
      expect(loaded.e).toBe(false)
    })
  })

  describe('isLocked / hasSetup / hasKey', () => {
    it('exposes crypto state', () => {
      expect(vault.isLocked.value).toBe(false) // unlocked in beforeEach
      expect(vault.hasKey()).toBe(true)
    })

    it('reflects locked state after lock()', () => {
      crypto.lock()
      expect(vault.isLocked.value).toBe(true)
      expect(vault.hasKey()).toBe(false)
    })
  })
})
