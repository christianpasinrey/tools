import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CommandPalette from '@/components/shell/CommandPalette.vue'
import { usePalette } from '@/composables/usePalette'

const Stub = { template: '<div />' }
const router = createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', component: Stub }, { path: '/tools', component: Stub }, { path: '/documents', component: Stub }
] })

const key = (k, opts = {}) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...opts }))

describe('CommandPalette', () => {
  let w
  beforeEach(async () => {
    usePalette().close()
    await router.push('/')
    w = mount(CommandPalette, { attachTo: document.body, global: { plugins: [router] } })
  })
  afterEach(() => w.unmount())

  it('Ctrl+K abre y Escape cierra', async () => {
    key('k', { ctrlKey: true }); await flushPromises()
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
    document.querySelector('input[role="combobox"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('busca, navega con flechas y abre con Enter', async () => {
    usePalette().open(); await flushPromises()
    const input = document.querySelector('input[role="combobox"]')
    input.value = 'color'; input.dispatchEvent(new Event('input')); await flushPromises()
    const first = document.querySelector('[role="option"]')
    expect(first.textContent).toContain('Selector de color')
    expect(input.getAttribute('aria-activedescendant')).toBe('tb-opt-0')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/tools#color')
    expect(usePalette().isOpen.value).toBe(false)
  })

  it('"/" no abre si se está escribiendo en un input', async () => {
    const outside = document.createElement('input'); document.body.appendChild(outside); outside.focus()
    outside.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true })); await flushPromises()
    expect(usePalette().isOpen.value).toBe(false)
    outside.remove()
  })

  it('sin resultados muestra ayuda', async () => {
    usePalette().open(); await flushPromises()
    const input = document.querySelector('input[role="combobox"]')
    input.value = 'zzqqxx'; input.dispatchEvent(new Event('input')); await flushPromises()
    expect(document.body.textContent).toContain('No encuentro nada')
  })
})
