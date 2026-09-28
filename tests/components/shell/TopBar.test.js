import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import TopBar from '@/components/shell/TopBar.vue'
import { usePalette } from '@/composables/usePalette'

const Stub = { template: '<div />' }
const router = createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', component: Stub }, { path: '/documents', component: Stub }
] })

const mountBar = () => mount(TopBar, {
  global: { plugins: [router], stubs: { ThemeToggleButton: true, SyncAccountButton: true } }
})

describe('TopBar', () => {
  it('en la Home muestra las categorías', async () => {
    await router.push('/'); await flushPromises()
    const w = mountBar()
    expect(w.find('nav[aria-label="Categorías"]').text()).toContain('Documentos')
  })
  it('en una sección muestra el selector de herramientas y el menú móvil', async () => {
    await router.push('/documents#markdown'); await flushPromises()
    history.replaceState(null, '', '/documents#markdown')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    const w = mountBar()
    expect(w.find('[data-test="tool-switcher"]').exists()).toBe(true)
    expect(w.find('[data-test="tool-switcher"] [aria-checked="true"]').text()).toContain('Markdown')
    expect(w.find('[data-test="section-menu"]').text()).toContain('Documentos')
    expect(w.find('[data-test="section-menu"]').text()).toContain('Markdown')
  })
  it('el buscador abre la paleta', async () => {
    const w = mountBar()
    await w.find('[data-test="open-palette"]').trigger('click')
    expect(usePalette().isOpen.value).toBe(true)
  })
})
