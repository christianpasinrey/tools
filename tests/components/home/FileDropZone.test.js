import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import FileDropZone from '@/components/home/FileDropZone.vue'
import { takePendingLaunch, clearPendingLaunch } from '@/lib/pendingLaunch'

const Stub = { template: '<div />' }
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Stub }, { path: '/documents', component: Stub }] })

function dragEvent(type, { types = ['Files'], files = [] } = {}) {
  const e = new Event(type, { bubbles: true, cancelable: true })
  e.dataTransfer = { types, files }
  return e
}

describe('FileDropZone', () => {
  let w
  beforeEach(async () => { clearPendingLaunch(); await router.push('/'); w = mount(FileDropZone, { attachTo: document.body, global: { plugins: [router] } }) })
  afterEach(() => w.unmount())

  it('no muestra la capa al arrastrar texto', async () => {
    window.dispatchEvent(dragEvent('dragenter', { types: ['text/plain'] })); await flushPromises()
    expect(document.querySelector('[data-test="drop-overlay"]')).toBeNull()
  })

  it('muestra la capa con archivos y propone tareas al soltar', async () => {
    window.dispatchEvent(dragEvent('dragenter')); await flushPromises()
    expect(document.querySelector('[data-test="drop-overlay"]')).not.toBeNull()
    const file = new File(['%PDF'], 'contrato.pdf', { type: 'application/pdf' })
    window.dispatchEvent(dragEvent('drop', { files: [file] })); await flushPromises()
    const options = [...document.querySelectorAll('[data-test="drop-option"]')].map(b => b.textContent)
    expect(options.join(' ')).toContain('PDF a Word')
    ;[...document.querySelectorAll('[data-test="drop-option"]')].find(b => b.textContent.includes('PDF a Word')).click()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/documents#converter')
    expect(takePendingLaunch('converter:')).toEqual({ target: 'converter:pdf-to-word', file })
  })

  it('archivo sin herramienta: mensaje claro', async () => {
    window.dispatchEvent(dragEvent('drop', { files: [new File(['x'], 'datos.xyz')] })); await flushPromises()
    expect(document.body.textContent).toContain('.xyz')
  })
})
