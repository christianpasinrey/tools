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

describe('openTool — correcciones de la revisión final', () => {
  beforeEach(() => clearPendingLaunch())

  it('fuerza el cambio de pestaña aunque el hash del router esté desfasado (replaceState de las secciones)', async () => {
    const router = makeRouter()
    await router.push('/documents#pdf')
    // La pestaña cambió con history.replaceState: el router sigue creyendo que está en #pdf
    const onHash = vi.fn()
    window.addEventListener('hashchange', onHash)
    await openTool(router, getEntry('pdf-editor'))
    window.removeEventListener('hashchange', onHash)
    expect(onHash).toHaveBeenCalledTimes(1)
  })

  it('en móvil no abre herramientas de escritorio ni registra nada', async () => {
    const router = makeRouter()
    await router.push('/')
    const width = window.innerWidth
    window.innerWidth = 375; window.dispatchEvent(new Event('resize'))
    const recordVisit = vi.fn()
    await openTool(router, getEntry('image-editor'), { file: new File(['x'], 'a.png', { type: 'image/png' }), recordVisit })
    window.innerWidth = width; window.dispatchEvent(new Event('resize'))
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(recordVisit).not.toHaveBeenCalled()
    expect(takePendingLaunch('')).toBeNull()
  })

  it('no deja entrega pendiente si la navegación acaba en otra ruta', async () => {
    const router = makeRouter()
    router.addRoute({ path: '/multimedia', component: Stub })
    router.beforeEach(to => (to.path === '/multimedia' ? '/' : true))
    await router.push('/')
    await openTool(router, getEntry('image-editor'), { file: new File(['x'], 'a.png', { type: 'image/png' }) })
    expect(router.currentRoute.value.path).toBe('/')
    expect(takePendingLaunch('image')).toBeNull()
  })

  it('la caducidad cuenta desde que la herramienta ha cargado', async () => {
    let now = 0
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => now)
    const router = makeRouter()
    router.addRoute({ path: '/multimedia', component: () => { now = 20000; return Promise.resolve(Stub) } })
    await router.push('/')
    const file = new File(['x'], 'a.png', { type: 'image/png' })
    await openTool(router, getEntry('image-editor'), { file })
    expect(takePendingLaunch('image')).toEqual({ target: 'image', file })
    spy.mockRestore()
  })
})
