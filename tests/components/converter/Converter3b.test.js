import { mount, flushPromises } from '@vue/test-utils'
import { toast } from '@/composables/useToast'

vi.mock('@/composables/useToast', () => ({ toast: vi.fn() }))
// pdfjs necesita DOMMatrix, que jsdom no tiene; estas pruebas no leen PDFs
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, version: 'test', getDocument: vi.fn() }))

describe('Conversor', () => {
  it('PDF a Word rechaza un archivo que no es PDF con aviso claro', async () => {
    const { default: PdfToWord } = await import('@/components/converter/ConverterPdfToWord.vue')
    const { useConverter } = await import('@/composables/useConverter')
    const w = mount(PdfToWord, { props: { converter: useConverter() } })
    const empty = w.findComponent({ name: 'TbEmptyState' })
    empty.vm.$emit('files', [new File(['x'], 'foto.png', { type: 'image/png' })])
    await flushPromises()
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/PDF/), expect.objectContaining({ tone: 'error' }))
  })
  it('la portada no pinta toasts propios', async () => {
    const { default: Home } = await import('@/components/converter/ConverterHome.vue')
    const w = mount(Home, { global: { stubs: { ConverterJpgToPdf: true, ConverterPdfToJpg: true, ConverterPdfToWord: true, ConverterPdfToExcel: true } } })
    expect(w.html()).not.toContain('toast')
    expect(w.findAll('[data-test="conversion-card"]')).toHaveLength(4)
  })
})
