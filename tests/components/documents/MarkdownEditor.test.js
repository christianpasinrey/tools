import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

async function mountEditor() {
  vi.resetModules()
  localStorage.setItem('tb:markdown:draft', '# Uno\n\nhola mundo\n\n## Dos')
  const { default: Editor } = await import('@/components/documents/MarkdownEditorContent.vue')
  return mount(Editor, { attachTo: document.body, global: { stubs: { VaultSaveLoad: true } } })
}

describe('Editor Markdown (escritorio)', () => {
  let w
  afterEach(() => { w?.unmount(); localStorage.clear() })

  it('pinta el borrador en editor, vista previa e índice', async () => {
    w = await mountEditor()
    expect(w.find('textarea').element.value).toContain('hola mundo')
    expect(w.find('.tb-prose h1').text()).toBe('Uno')
    expect(w.findAll('[data-test="outline-item"]').map(e => e.text())).toEqual(['Uno', 'Dos'])
  })

  it('negrita desde la barra envuelve la selección', async () => {
    w = await mountEditor()
    const ta = w.find('textarea').element
    const i = ta.value.indexOf('hola')
    ta.setSelectionRange(i, i + 4)
    await w.find('[aria-label^="Negrita"]').trigger('click')
    expect(ta.value).toContain('**hola** mundo')
  })

  it('Ctrl+B en el editor aplica negrita y marca el evento como tratado', async () => {
    w = await mountEditor()
    const ta = w.find('textarea').element
    ta.setSelectionRange(0, 0)
    const ev = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true, cancelable: true })
    ta.dispatchEvent(ev)
    await nextTick()
    expect(ev.defaultPrevented).toBe(true)
    expect(ta.value.startsWith('**texto**')).toBe(true)
  })

  it('Ctrl+B fuera del editor no toca el documento', async () => {
    w = await mountEditor()
    const before = w.find('textarea').element.value
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }))
    await nextTick()
    expect(w.find('textarea').element.value).toBe(before)
  })

  it('modo Vista oculta el editor', async () => {
    w = await mountEditor()
    const vista = w.findAll('[role="radio"]').find(r => r.attributes('title') === 'Vista')
    await vista.trigger('click')
    expect(w.find('[data-test="editor-pane"]').isVisible()).toBe(false)
  })

  it('buscar cuenta coincidencias y reemplazar todo las sustituye', async () => {
    w = await mountEditor()
    await w.find('[aria-label="Buscar (Ctrl+F)"]').trigger('click')
    await w.find('input[placeholder="Buscar"]').setValue('o')
    expect(w.find('[data-test="search-count"]').text()).toMatch(/de \d+/)
    await w.find('input[placeholder="Reemplazar por"]').setValue('0')
    await w.findAll('button').find(b => b.text() === 'Reemplazar todo').trigger('click')
    expect(w.find('textarea').element.value).not.toMatch(/o/i)
  })

  it('Tab indenta en lugar de sacar el foco', async () => {
    w = await mountEditor()
    const ta = w.find('textarea').element
    ta.focus(); ta.setSelectionRange(0, 0)
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    ta.dispatchEvent(ev)
    await nextTick()
    expect(ev.defaultPrevented).toBe(true)
    expect(ta.value.startsWith('  # Uno')).toBe(true)
  })
})
