import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import VaultSaveLoad from '@/components/common/VaultSaveLoad.vue'

// Mock useVault
const mockVault = {
  save: vi.fn(),
  load: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  clearStore: vi.fn(),
  isLocked: ref(false),
  hasSetup: ref(true),
  hasKey: vi.fn(() => true)
}

vi.mock('@/composables/useVault', () => ({
  useVault: () => mockVault
}))

// Stub CryptoLockButton
const CryptoLockButtonStub = { template: '<button class="crypto-lock-stub" />' }

describe('VaultSaveLoad', () => {
  const defaultProps = {
    storeName: 'color-palettes',
    getData: () => ({ colors: ['#ff0000', '#00ff00'] }),
    label: 'paleta'
  }

  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    mockVault.isLocked.value = false
    mockVault.list.mockResolvedValue([])
    mockVault.save.mockResolvedValue(true)
    mockVault.load.mockResolvedValue({ colors: ['#ff0000'] })
    mockVault.remove.mockResolvedValue(true)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
    // Clean up teleported content
    document.body.querySelectorAll('.vault-popover').forEach(el => el.remove())
  })

  function createWrapper(props = {}) {
    wrapper = mount(VaultSaveLoad, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: { CryptoLockButton: CryptoLockButtonStub }
      },
      attachTo: document.body
    })
    return wrapper
  }

  function findTeleportedPopover(selector) {
    return document.body.querySelector(`.vault-popover ${selector}`) ||
           document.body.querySelector(selector)
  }

  describe('rendering', () => {
    it('renders save and load buttons when unlocked', () => {
      createWrapper()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('shows CryptoLockButton when vault is locked', () => {
      mockVault.isLocked.value = true
      createWrapper()
      expect(wrapper.find('.crypto-lock-stub').exists()).toBe(true)
      // No save/load buttons when locked
      expect(wrapper.find('button[title="Guardar en vault"]').exists()).toBe(false)
    })

    it('shows item count badge when items exist', async () => {
      mockVault.list.mockResolvedValue([
        { id: '1', name: 'Item 1', updatedAt: Date.now() },
        { id: '2', name: 'Item 2', updatedAt: Date.now() }
      ])
      createWrapper()
      await flushPromises()

      const badge = wrapper.find('span')
      expect(badge.text()).toContain('2')
    })
  })

  describe('save flow', () => {
    it('shows save input on save button click', async () => {
      createWrapper()
      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      expect(input).not.toBeNull()
    })

    it('does not show save input when locked', async () => {
      mockVault.isLocked.value = true
      createWrapper()
      // No save button exists when locked
      expect(wrapper.find('button[title="Guardar en vault"]').exists()).toBe(false)
    })

    it('calls vault.save with correct args on confirm', async () => {
      createWrapper()
      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      input.value = 'My Palette'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const okBtn = document.body.querySelector('.vault-popover button.bg-emerald-600')
      okBtn.click()
      await flushPromises()

      expect(mockVault.save).toHaveBeenCalledWith(
        'color-palettes',
        expect.any(String),
        'My Palette',
        { colors: ['#ff0000', '#00ff00'] }
      )
    })

    it('calls getData prop to get save data', async () => {
      const getData = vi.fn(() => ({ test: 'data' }))
      createWrapper({ getData })
      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      input.value = 'Test'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const okBtn = document.body.querySelector('.vault-popover button.bg-emerald-600')
      okBtn.click()
      await flushPromises()

      expect(getData).toHaveBeenCalled()
    })

    it('trims whitespace from save name', async () => {
      createWrapper()
      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      input.value = '  Trimmed Name  '
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const okBtn = document.body.querySelector('.vault-popover button.bg-emerald-600')
      okBtn.click()
      await flushPromises()

      expect(mockVault.save).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'Trimmed Name',
        expect.any(Object)
      )
    })

    it('does not save when name is empty', async () => {
      createWrapper()
      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      input.value = '   '
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const okBtn = document.body.querySelector('.vault-popover button.bg-emerald-600')
      okBtn.click()
      await flushPromises()

      expect(mockVault.save).not.toHaveBeenCalled()
    })

    it('hides save input after successful save', async () => {
      createWrapper()
      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      input.value = 'Name'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const okBtn = document.body.querySelector('.vault-popover button.bg-emerald-600')
      okBtn.click()
      await flushPromises()

      expect(document.body.querySelector('.vault-popover input[type="text"]')).toBeNull()
    })

    it('refreshes list after save', async () => {
      createWrapper()
      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      input.value = 'Test'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const okBtn = document.body.querySelector('.vault-popover button.bg-emerald-600')
      okBtn.click()
      await flushPromises()

      // list is called on mount (if unlocked) + after save
      expect(mockVault.list).toHaveBeenCalledWith('color-palettes')
    })
  })

  describe('load flow', () => {
    const mockItems = [
      { id: 'item1', name: 'Warm Palette', updatedAt: Date.now() - 1000 },
      { id: 'item2', name: 'Cool Palette', updatedAt: Date.now() }
    ]

    beforeEach(() => {
      mockVault.list.mockResolvedValue(mockItems)
    })

    it('shows items panel on load button click', async () => {
      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      const panel = document.body.querySelector('.vault-popover')
      expect(panel.textContent).toContain('Warm Palette')
      expect(panel.textContent).toContain('Cool Palette')
    })

    it('does not open panel when locked', async () => {
      mockVault.isLocked.value = true
      createWrapper()
      // No load button when locked
      expect(wrapper.find('button[title="Cargar desde vault"]').exists()).toBe(false)
    })

    it('emits load event with decrypted data on item click', async () => {
      const loadedData = { colors: ['#123456'] }
      mockVault.load.mockResolvedValue(loadedData)

      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      // Click on the first item's content area
      const itemDiv = document.body.querySelector('.vault-popover .flex-1.min-w-0')
      itemDiv.click()
      await flushPromises()

      expect(mockVault.load).toHaveBeenCalledWith('color-palettes', 'item1')
      expect(wrapper.emitted('load')).toBeTruthy()
      expect(wrapper.emitted('load')[0][0]).toEqual(loadedData)
    })

    it('closes panel after loading', async () => {
      mockVault.load.mockResolvedValue({ data: 'test' })
      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      const itemDiv = document.body.querySelector('.vault-popover .flex-1.min-w-0')
      itemDiv.click()
      await flushPromises()

      expect(document.body.querySelector('.vault-popover .flex-1.min-w-0')).toBeNull()
    })

    it('shows empty message when no items', async () => {
      mockVault.list.mockResolvedValue([])
      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      const panel = document.body.querySelector('.vault-popover')
      expect(panel.textContent).toContain('Sin items guardados')
    })

    it('shows label in panel header', async () => {
      createWrapper({ label: 'paleta' })
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      const panel = document.body.querySelector('.vault-popover')
      expect(panel.textContent).toContain('paleta')
    })
  })

  describe('delete flow', () => {
    const mockItems = [
      { id: 'item1', name: 'To Delete', updatedAt: Date.now() }
    ]

    beforeEach(() => {
      mockVault.list.mockResolvedValue(mockItems)
    })

    it('shows confirm buttons on delete click', async () => {
      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      // Find delete button (trash icon)
      const deleteBtn = document.body.querySelector('.vault-popover button[title="Eliminar"]')
      deleteBtn.click()
      await flushPromises()

      const panel = document.body.querySelector('.vault-popover')
      expect(panel.textContent).toContain('Si')
      expect(panel.textContent).toContain('No')
    })

    it('calls vault.remove on confirm', async () => {
      mockVault.list
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce(mockItems) // refresh on panel open
        .mockResolvedValue([]) // after delete

      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      const deleteBtn = document.body.querySelector('.vault-popover button[title="Eliminar"]')
      deleteBtn.click()
      await flushPromises()

      // Click "Si" to confirm
      const confirmBtn = document.body.querySelector('.vault-popover button.bg-red-600')
      confirmBtn.click()
      await flushPromises()

      expect(mockVault.remove).toHaveBeenCalledWith('color-palettes', 'item1')
    })

    it('cancels delete on No click', async () => {
      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      const deleteBtn = document.body.querySelector('.vault-popover button[title="Eliminar"]')
      deleteBtn.click()
      await flushPromises()

      // Find "No" button
      const buttons = document.body.querySelectorAll('.vault-popover button')
      const noBtn = Array.from(buttons).find(b => b.textContent.trim() === 'No')
      noBtn.click()
      await flushPromises()

      expect(mockVault.remove).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('shows error feedback when save fails', async () => {
      mockVault.save.mockRejectedValue(new Error('Encryption failed'))
      createWrapper()

      const saveBtn = wrapper.find('button[title="Guardar en vault"]')
      await saveBtn.trigger('click')
      await flushPromises()

      const input = document.body.querySelector('.vault-popover input[type="text"]')
      input.value = 'Fail'
      input.dispatchEvent(new Event('input'))
      await flushPromises()

      const okBtn = document.body.querySelector('.vault-popover button.bg-emerald-600')
      okBtn.click()
      await flushPromises()

      expect(wrapper.text()).toContain('Error')
    })

    it('shows error feedback when load fails', async () => {
      mockVault.list.mockResolvedValue([{ id: 'x', name: 'X', updatedAt: 1 }])
      mockVault.load.mockRejectedValue(new Error('Decryption failed'))

      createWrapper()
      await flushPromises()

      const loadBtn = wrapper.find('button[title="Cargar desde vault"]')
      await loadBtn.trigger('click')
      await flushPromises()

      const itemDiv = document.body.querySelector('.vault-popover .flex-1.min-w-0')
      itemDiv.click()
      await flushPromises()

      expect(wrapper.text()).toContain('Error')
    })
  })
})
