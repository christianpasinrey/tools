import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import HomeHero from '@/components/home/HomeHero.vue'

const Stub = { template: '<div />' }
const makeRouter = () => createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', component: Stub }, { path: '/tools', component: Stub }, { path: '/multimedia', component: Stub }
] })

beforeAll(() => {
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})

describe('Home — buscador del hero', () => {
  it('Enter abre el primer resultado de la búsqueda', async () => {
    const router = makeRouter(); await router.push('/')
    const w = mount(Home, { attachTo: document.body, global: { plugins: [router] } })
    const input = w.find('#tb-hero-search')
    await input.setValue('color')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/tools#color')
    w.unmount()
  })

  it('Enter con el buscador vacío no navega', async () => {
    const router = makeRouter(); await router.push('/')
    const w = mount(Home, { attachTo: document.body, global: { plugins: [router] } })
    await w.find('#tb-hero-search').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
    w.unmount()
  })
})

describe('HomeHero — móvil', () => {
  it('los chips de herramientas de escritorio aparecen deshabilitados', () => {
    const width = window.innerWidth
    window.innerWidth = 375; window.dispatchEvent(new Event('resize'))
    const w = mount(HomeHero, { global: { plugins: [makeRouter()] } })
    const chip = w.findAll('button.tb-chip').find(b => b.text().includes('Editor de imágenes'))
    expect(chip.attributes('aria-disabled')).toBe('true')
    window.innerWidth = width; window.dispatchEvent(new Event('resize'))
  })
})
