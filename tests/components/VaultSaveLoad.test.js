import { describe, it, expect, beforeEach, vi } from 'vitest'
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

  beforeEach(() => {
    vi.clearAllMocks()
    mockVault.isLocked.value = false
    mockVault.list.mockResolvedValue([])
    mockVault.save.mockResolvedValue(true)
    mockVault.load.mockResolvedValue({ colors: ['#ff0000'] })
    mockVault.remove.mockResolvedValue(true)
  })

  function createWrapper(props = {}) {
    return mount(VaultSaveLoad, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: { CryptoLockButton: CryptoLockButtonStub }
      }
    })
  }

  describe('rendering', () => {
    it('renders save and load buttons', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('disables buttons when vault is locked', () => {
      mockVault.isLocked.value = true
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('button')
      const saveBtn = buttons[0]
      const loadBtn = buttons[1]
      expect(saveBtn.attributes('disabled')).toBeDefined()
      expect(loadBtn.attributes('disabled')).toBeDefined()
    })

    it('shows item count badge when items exist', async () => {
      mockVault.list.mockResolvedValue([
        { id: '1', name: 'Item 1', updatedAt: Date.now() },
        { id: '2', name: 'Item 2', updatedAt: Date.now() }
      ])
      const wrapper = createWrapper()
      await flushPromises()

      const badge = wrapper.find('span')
      expect(badge.text()).toContain('2')
    })
  })

  describe('save flow', () => {
    it('shows save input on save button click', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
    })

    it('does not show save input when locked', async () => {
      mockVault.isLocked.value = true
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(false)
    })

    it('calls vault.save with correct args on confirm', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('My Palette')

      // Click OK button
      const okBtn = wrapper.find('button.px-2.py-1.bg-emerald-600')
      await okBtn.trigger('click')
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
      const wrapper = createWrapper({ getData })
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Test')

      const okBtn = wrapper.find('button.px-2.py-1.bg-emerald-600')
      await okBtn.trigger('click')
      await flushPromises()

      expect(getData).toHaveBeenCalled()
    })

    it('trims whitespace from save name', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('  Trimmed Name  ')

      const okBtn = wrapper.find('button.px-2.py-1.bg-emerald-600')
      await okBtn.trigger('click')
      await flushPromises()

      expect(mockVault.save).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'Trimmed Name',
        expect.any(Object)
      )
    })

    it('does not save when name is empty', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('   ')

      const okBtn = wrapper.find('button.px-2.py-1.bg-emerald-600')
      await okBtn.trigger('click')
      await flushPromises()

      expect(mockVault.save).not.toHaveBeenCalled()
    })

    it('hides save input after successful save', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Name')

      const okBtn = wrapper.find('button.px-2.py-1.bg-emerald-600')
      await okBtn.trigger('click')
      await flushPromises()

      expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    })

    it('saves on Enter keypress', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Enter Save')
      await input.trigger('keyup.enter')
      await flushPromises()

      expect(mockVault.save).toHaveBeenCalled()
    })

    it('closes save input on Escape', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')
      expect(wrapper.find('input[type="text"]').exists()).toBe(true)

      const input = wrapper.find('input[type="text"]')
      await input.trigger('keyup.escape')

      expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    })

    it('refreshes list after save', async () => {
      const wrapper = createWrapper()
      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Test')
      const okBtn = wrapper.find('button.px-2.py-1.bg-emerald-600')
      await okBtn.trigger('click')
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
      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Warm Palette')
      expect(wrapper.text()).toContain('Cool Palette')
    })

    it('does not open panel when locked', async () => {
      mockVault.isLocked.value = true
      const wrapper = createWrapper()
      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      expect(wrapper.text()).not.toContain('Warm Palette')
    })

    it('emits load event with decrypted data on item click', async () => {
      const loadedData = { colors: ['#123456'] }
      mockVault.load.mockResolvedValue(loadedData)

      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      // Click on the first item's content area
      const itemDivs = wrapper.findAll('.flex-1.min-w-0')
      await itemDivs[0].trigger('click')
      await flushPromises()

      expect(mockVault.load).toHaveBeenCalledWith('color-palettes', 'item1')
      expect(wrapper.emitted('load')).toBeTruthy()
      expect(wrapper.emitted('load')[0][0]).toEqual(loadedData)
    })

    it('closes panel after loading', async () => {
      mockVault.load.mockResolvedValue({ data: 'test' })
      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      const itemDivs = wrapper.findAll('.flex-1.min-w-0')
      await itemDivs[0].trigger('click')
      await flushPromises()

      expect(wrapper.text()).not.toContain('Warm Palette')
    })

    it('shows empty message when no items', async () => {
      mockVault.list.mockResolvedValue([])
      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Sin items guardados')
    })

    it('shows label in panel header', async () => {
      const wrapper = createWrapper({ label: 'paleta' })
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('paleta')
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
      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      // Find delete button (trash icon)
      const deleteBtn = wrapper.find('button[title="Eliminar"]')
      await deleteBtn.trigger('click')

      expect(wrapper.text()).toContain('Si')
      expect(wrapper.text()).toContain('No')
    })

    it('calls vault.remove on confirm', async () => {
      mockVault.list
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce(mockItems) // refresh on panel open
        .mockResolvedValue([]) // after delete

      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      const deleteBtn = wrapper.find('button[title="Eliminar"]')
      await deleteBtn.trigger('click')

      // Click "Si" to confirm
      const confirmBtn = wrapper.find('button.bg-red-600')
      await confirmBtn.trigger('click')
      await flushPromises()

      expect(mockVault.remove).toHaveBeenCalledWith('color-palettes', 'item1')
    })

    it('cancels delete on No click', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      const deleteBtn = wrapper.find('button[title="Eliminar"]')
      await deleteBtn.trigger('click')

      // Click "No" to cancel
      const cancelBtns = wrapper.findAll('button')
      const noBtn = cancelBtns.find(b => b.text() === 'No')
      await noBtn.trigger('click')

      expect(mockVault.remove).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('shows error feedback when save fails', async () => {
      mockVault.save.mockRejectedValue(new Error('Encryption failed'))
      const wrapper = createWrapper()

      const saveBtn = wrapper.findAll('button')[0]
      await saveBtn.trigger('click')

      const input = wrapper.find('input[type="text"]')
      await input.setValue('Fail')
      const okBtn = wrapper.find('button.px-2.py-1.bg-emerald-600')
      await okBtn.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Error')
    })

    it('shows error feedback when load fails', async () => {
      mockVault.list.mockResolvedValue([{ id: 'x', name: 'X', updatedAt: 1 }])
      mockVault.load.mockRejectedValue(new Error('Decryption failed'))

      const wrapper = createWrapper()
      await flushPromises()

      const loadBtn = wrapper.findAll('button')[1]
      await loadBtn.trigger('click')
      await flushPromises()

      const itemDivs = wrapper.findAll('.flex-1.min-w-0')
      await itemDivs[0].trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Error')
    })
  })
})
