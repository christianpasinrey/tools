import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RecentStrip from '@/components/home/RecentStrip.vue'
import { useRecentTools, _reloadRecentTools } from '@/composables/useRecentTools'

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })

describe('RecentStrip', () => {
  beforeEach(() => { localStorage.clear(); _reloadRecentTools() })
  it('no se pinta sin datos', () => {
    expect(mount(RecentStrip, { global: { plugins: [router] } }).html()).not.toContain('Continúa')
  })
  it('muestra favoritos y recientes sin duplicar', () => {
    const { recordVisit, toggleFavorite } = useRecentTools()
    recordVisit('color'); recordVisit('todo'); toggleFavorite('color')
    const w = mount(RecentStrip, { global: { plugins: [router] } })
    expect(w.text()).toContain('Continúa')
    expect(w.findAll('[data-test="recent-chip"]').map(c => c.text())).toEqual(['Selector de color', 'Tablero Kanban'])
  })
})
