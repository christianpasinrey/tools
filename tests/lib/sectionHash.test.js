import { createRouter, createMemoryHistory } from 'vue-router'
import { currentHash, replaceSectionHash, goToSectionTool } from '@/lib/sectionHash'

const Stub = { template: '<div />' }
const makeRouter = () => createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Stub }, { path: '/documents', component: Stub }] })

describe('sectionHash', () => {
  it('replaceSectionHash conserva history.state y actualiza currentHash', () => {
    history.replaceState({ back: '/', current: '/documents', position: 3 }, '', '/documents#pdf')
    replaceSectionHash('markdown')
    expect(location.hash).toBe('#markdown')
    expect(history.state).toEqual({ back: '/', current: '/documents', position: 3 })
    expect(currentHash.value).toBe('#markdown')
  })

  it('hashchange actualiza currentHash', () => {
    history.replaceState(null, '', '/documents#docx')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(currentHash.value).toBe('#docx')
  })

  it('goToSectionTool en la misma sección fuerza y dispara hashchange aunque el router tenga el hash desfasado', async () => {
    const router = makeRouter()
    await router.push('/documents#markdown')
    const onHash = vi.fn()
    window.addEventListener('hashchange', onHash)
    await goToSectionTool(router, '/documents', 'markdown')
    window.removeEventListener('hashchange', onHash)
    expect(onHash).toHaveBeenCalledTimes(1)
  })

  it('goToSectionTool a otra sección navega sin hashchange sintético', async () => {
    const router = makeRouter()
    await router.push('/')
    const onHash = vi.fn()
    window.addEventListener('hashchange', onHash)
    await goToSectionTool(router, '/documents', 'pdf')
    window.removeEventListener('hashchange', onHash)
    expect(router.currentRoute.value.fullPath).toBe('/documents#pdf')
    expect(onHash).not.toHaveBeenCalled()
  })
})
