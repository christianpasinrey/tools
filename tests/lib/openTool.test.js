import { createRouter, createMemoryHistory } from 'vue-router'
import { openTool } from '@/lib/openTool'
import { getEntry } from '@/config/catalog'
import { takePendingLaunch, clearPendingLaunch, LAUNCH_EVENT } from '@/lib/pendingLaunch'

const Stub = { template: '<div />' }
function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: Stub }, { path: '/documents', component: Stub }, { path: '/tools', component: Stub }
  ] })
}

describe('openTool', () => {
  beforeEach(() => clearPendingLaunch())

  it('navega a la ruta con hash, registra visita y deja la entrega', async () => {
    const router = makeRouter()
    await router.push('/')
    const recordVisit = vi.fn()
    const file = new File(['x'], 'a.pdf', { type: 'application/pdf' })
    await openTool(router, getEntry('pdf-to-word'), { file, recordVisit })
    expect(router.currentRoute.value.fullPath).toBe('/documents#converter')
    expect(recordVisit).toHaveBeenCalledWith('pdf-to-word')
    expect(takePendingLaunch('converter:')).toEqual({ target: 'converter:pdf-to-word', file })
  })

  it('misma ruta con otro hash dispara hashchange y el evento de lanzamiento', async () => {
    const router = makeRouter()
    await router.push('/documents#pdf')
    const onHash = vi.fn()
    const onLaunch = vi.fn()
    window.addEventListener('hashchange', onHash)
    window.addEventListener(LAUNCH_EVENT, onLaunch)
    await openTool(router, getEntry('pdf-to-jpg'))
    expect(onHash).toHaveBeenCalledTimes(1)
    expect(onLaunch).toHaveBeenCalledTimes(1)
    window.removeEventListener('hashchange', onHash)
    window.removeEventListener(LAUNCH_EVENT, onLaunch)
  })

  it('sin launch no deja entrega pendiente', async () => {
    const router = makeRouter()
    await openTool(router, getEntry('color'))
    expect(router.currentRoute.value.fullPath).toBe('/tools#color')
    expect(takePendingLaunch('')).toBeNull()
  })
})
