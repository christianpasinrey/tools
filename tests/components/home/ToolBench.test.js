import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ToolBench from '@/components/home/ToolBench.vue'
import { CATEGORIES, TASKS } from '@/config/catalog'

const Stub = { template: '<div />' }
const router = createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', component: Stub }, { path: '/multimedia', component: Stub }, { path: '/tools', component: Stub }
] })
const mountBench = (query = '') => mount(ToolBench, { props: { query }, global: { plugins: [router] } })

describe('ToolBench', () => {
  beforeAll(() => {
    globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
  })

  it('sin búsqueda pinta todas las categorías y utilidades', () => {
    const w = mountBench()
    for (const c of CATEGORIES) expect(w.find(`#cat-${c.id}`).exists()).toBe(true)
    expect(w.findAll('[data-test="tool-card"]').length).toBe(TASKS.filter(t => t.bench !== false).length)
  })

  it('con búsqueda muestra solo coincidencias y el recuento', () => {
    const w = mountBench('color')
    const names = w.findAll('[data-test="tool-card"] h3').map(n => n.text())
    expect(names).toContain('Selector de color')
    expect(names).not.toContain('Editor de audio')
    expect(w.text()).toMatch(/resultado/)
  })

  it('estado vacío con sugerencias', async () => {
    const w = mountBench('zzqqxx')
    expect(w.text()).toContain('No tengo nada')
    await w.find('[data-test="empty-suggestion"]').trigger('click')
    expect(w.emitted('update:query')[0][0]).toBeTruthy()
  })

  it('en móvil, una utilidad de escritorio está deshabilitada y no navega', async () => {
    await router.push('/')
    const width = window.innerWidth
    window.innerWidth = 375; window.dispatchEvent(new Event('resize'))
    const w = mountBench('audio')
    const btn = w.find('[data-test="tool-card"] [data-test="open"]')
    expect(btn.attributes('aria-disabled')).toBe('true')
    await btn.trigger('click'); await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    window.innerWidth = width; window.dispatchEvent(new Event('resize'))
  })
})
