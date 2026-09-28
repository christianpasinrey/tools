import { shallowMount } from '@vue/test-utils'

vi.mock('@harbour-enterprises/superdoc', () => ({ SuperDoc: class { destroy() {} } }))
vi.mock('@harbour-enterprises/superdoc/style.css', () => ({}))

describe('DOCX móvil', () => {
  it('sin texto blanco fijo y con color de texto explícito en el papel', async () => {
    const { default: Mobile } = await import('@/components/documents/MobileDocxEditor.vue')
    const w = shallowMount(Mobile)
    expect(w.html()).not.toMatch(/\btext-white\b/)
    expect(w.find('[data-test="docx-paper"]').attributes('style') || '').toMatch(/color/)
  })
})

describe('DOCX escritorio', () => {
  it('el panel lateral recibe el editor cuando SuperDoc está listo', async () => {
    const { ref, nextTick } = await import('vue')
    const isReady = ref(false)
    const editor = { commands: {} }
    let current = null // como useDocxEditor: variable normal, no reactiva
    vi.doMock('@/composables/useDocxEditor', () => ({
      useDocxEditor: () => ({
        editorContainerRef: ref(null), toolbarRef: ref(null), isReady, currentFileName: ref('a.docx'),
        documentMode: ref('editing'), zoom: ref(100), init() {}, destroy() {},
        getActiveEditor: () => current
      })
    }))
    const { default: DocxEditor } = await import('@/components/documents/DocxEditor.vue')
    const w = shallowMount(DocxEditor)
    current = editor
    isReady.value = true
    await nextTick()
    expect(w.findComponent({ name: 'DocxSidebar' }).props('editor')).toBe(editor)
  })
})

describe('Exportar DOCX', () => {
  it('pide el archivo a SuperDoc sin que SuperDoc lo descargue por su cuenta', async () => {
    vi.resetModules()
    const exportSpy = vi.fn(async () => new Blob(['x']))
    vi.doMock('@harbour-enterprises/superdoc', () => ({ SuperDoc: class { constructor() {} export(o) { return exportSpy(o) } destroy() {} } }))
    vi.doUnmock('@/composables/useDocxEditor')
    const { useDocxEditor } = await import('@/composables/useDocxEditor')
    const d = useDocxEditor()
    d.editorContainerRef.value = document.createElement('div')
    d.toolbarRef.value = document.createElement('div')
    d.init()
    URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn()
    await d.downloadDocument()
    expect(exportSpy).toHaveBeenCalledWith(expect.objectContaining({ triggerDownload: false }))
  })
})
