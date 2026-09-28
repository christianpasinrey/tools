import { mount } from '@vue/test-utils'

async function mountMobile() {
  vi.resetModules()
  localStorage.setItem('tb:markdown:draft', 'hola')
  const { default: Editor } = await import('@/components/documents/MobileMarkdownEditor.vue')
  return mount(Editor, { attachTo: document.body })
}

describe('Editor Markdown (móvil)', () => {
  let w
  afterEach(() => { w?.unmount(); localStorage.clear() })

  it('comparte el borrador y alterna Editar/Vista', async () => {
    w = await mountMobile()
    expect(w.find('textarea').element.value).toBe('hola')
    await w.findAll('[role="radio"]').find(r => r.text() === 'Vista').trigger('click')
    expect(w.find('.tb-prose').text()).toBe('hola')
  })

  it('Título cicla los niveles', async () => {
    w = await mountMobile()
    const ta = w.find('textarea').element
    ta.setSelectionRange(0, 0)
    const btn = w.find('[aria-label="Título"]')
    await btn.trigger('click'); expect(ta.value).toBe('# hola')
    await btn.trigger('click'); expect(ta.value).toBe('## hola')
    await btn.trigger('click'); expect(ta.value).toBe('### hola')
    await btn.trigger('click'); expect(ta.value).toBe('hola')
  })
})
