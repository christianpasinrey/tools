import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

const confirmMock = vi.fn()
vi.mock('@/composables/useConfirm', () => ({ confirmAction: (...a) => confirmMock(...a) }))

async function mountEditor(draft) {
  vi.resetModules()
  localStorage.setItem('tb:markdown:draft', draft)
  const { default: Editor } = await import('@/components/documents/MarkdownEditorContent.vue')
  return mount(Editor, { attachTo: document.body, global: { stubs: { VaultSaveLoad: true } } })
}
const key = (el, k, opts = {}) => { const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts }); el.dispatchEvent(ev); return ev }

describe('Editor Markdown — correcciones de la revisión', () => {
  let w
  afterEach(() => { w?.unmount(); localStorage.clear(); confirmMock.mockReset() })

  it('Esc y después Tab deja salir del editor (sin trampa de teclado)', async () => {
    w = await mountEditor('hola')
    const ta = w.find('textarea').element
    ta.focus(); ta.setSelectionRange(0, 0)
    key(ta, 'Escape')
    const ev = key(ta, 'Tab')
    await nextTick()
    expect(ev.defaultPrevented).toBe(false)
    expect(ta.value).toBe('hola')
    expect(key(ta, 'Tab').defaultPrevented).toBe(true)
  })

  it('abrir un archivo pide confirmación antes de sustituir un borrador propio', async () => {
    confirmMock.mockResolvedValue(false)
    w = await mountEditor('mi texto importante')
    const input = w.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [new File(['# otro'], 'otro.md')], configurable: true })
    await input.trigger('change'); await flushPromises()
    expect(confirmMock).toHaveBeenCalled()
    expect(w.find('textarea').element.value).toBe('mi texto importante')
  })

  it('Reemplazar avanza tras su propio resultado', async () => {
    w = await mountEditor('a b a')
    await w.find('[aria-label="Buscar (Ctrl+F)"]').trigger('click')
    await w.find('input[placeholder="Buscar"]').setValue('a')
    await w.find('input[placeholder="Reemplazar por"]').setValue('aa')
    const btn = w.findAll('button').find(b => b.text() === 'Reemplazar')
    await btn.trigger('click'); await nextTick()
    await btn.trigger('click'); await nextTick()
    expect(w.find('textarea').element.value).toBe('aa b aa')
  })

  it('el contador no se sale de rango al editar', async () => {
    w = await mountEditor('o o')
    await w.find('[aria-label="Buscar (Ctrl+F)"]').trigger('click')
    await w.find('input[placeholder="Buscar"]').setValue('o')
    await w.find('[aria-label="Siguiente (Intro)"]').trigger('click')
    expect(w.find('[data-test="search-count"]').text()).toBe('2 de 2')
    await w.find('textarea').setValue('o')
    await nextTick()
    expect(w.find('[data-test="search-count"]').text()).toBe('1 de 1')
  })

  it('resalta la coincidencia activa', async () => {
    w = await mountEditor('uno dos')
    await w.find('[aria-label="Buscar (Ctrl+F)"]').trigger('click')
    await w.find('input[placeholder="Buscar"]').setValue('dos')
    await nextTick()
    expect(w.find('.md-match').text()).toBe('dos')
  })
})
