import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

async function withDoc() {
  vi.resetModules()
  const mod = await import('@/composables/useMarkdownDocument')
  let api
  mount(defineComponent({ setup() { api = mod.useMarkdownDocument(); return () => h('div') } }))
  return { api, mod }
}

describe('useMarkdownDocument', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })

  it('empieza con el ejemplo y guarda el borrador', async () => {
    const { api, mod } = await withDoc()
    expect(api.content.value).toBe(mod.SAMPLE_MARKDOWN)
    api.content.value = '# Hola'
    await nextTick()
    expect(localStorage.getItem('tb:markdown:draft')).toContain('# Hola')
  })

  it('recupera el borrador guardado', async () => {
    localStorage.setItem('tb:markdown:draft', 'guardado')
    const { api } = await withDoc()
    expect(api.content.value).toBe('guardado')
  })

  it('la vista previa se sanea', async () => {
    const { api } = await withDoc()
    api.content.value = '**negrita** <img src=x onerror="alert(1)">'
    expect(api.previewHtml.value).toContain('<strong>negrita</strong>')
    expect(api.previewHtml.value).not.toContain('onerror')
  })

  it('rechaza archivos que no son Markdown sin tocar el contenido', async () => {
    const { api } = await withDoc()
    api.content.value = 'mío'
    const res = await api.openFile(new File(['x'], 'foto.png', { type: 'image/png' }))
    expect(res.ok).toBe(false)
    expect(res.error).toMatch(/Markdown/)
    expect(api.content.value).toBe('mío')
  })

  it('abre un .md', async () => {
    const { api } = await withDoc()
    const res = await api.openFile(new File(['# Desde archivo'], 'notas.md', { type: 'text/markdown' }))
    expect(res.ok).toBe(true)
    expect(api.content.value).toBe('# Desde archivo')
  })

  it('funciona aunque localStorage lance', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded') })
    const { api } = await withDoc()
    expect(() => { api.content.value = 'sin almacenamiento' }).not.toThrow()
    await nextTick()
    expect(api.content.value).toBe('sin almacenamiento')
  })
})
