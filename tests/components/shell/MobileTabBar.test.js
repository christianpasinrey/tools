import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import MobileTabBar from '@/components/shell/MobileTabBar.vue'
import { usePalette } from '@/composables/usePalette'

const Stub = { template: '<div />' }
const router = createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', component: Stub }, { path: '/tools', component: Stub }, { path: '/multimedia', component: Stub }
] })

describe('MobileTabBar', () => {
  it('Buscar abre la paleta', async () => {
    usePalette().close()
    const w = mount(MobileTabBar, { attachTo: document.body, global: { plugins: [router] } })
    await w.find('[data-test="tab-search"]').trigger('click')
    expect(usePalette().isOpen.value).toBe(true)
    w.unmount()
  })

  it('Categorías lista utilidades y marca las de escritorio como no disponibles', async () => {
    const w = mount(MobileTabBar, { attachTo: document.body, global: { plugins: [router] } })
    await w.find('[data-test="tab-categories"]').trigger('click'); await flushPromises()
    const disabled = [...document.querySelectorAll('[data-test="sheet-item"][aria-disabled="true"]')].map(b => b.textContent)
    expect(disabled.join(' ')).toContain('Editor de audio')
    const color = [...document.querySelectorAll('[data-test="sheet-item"]')].find(b => b.textContent.includes('Selector de color'))
    color.click(); await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/tools#color')
    w.unmount()
  })
})
