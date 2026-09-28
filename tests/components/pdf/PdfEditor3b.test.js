import { mount } from '@vue/test-utils'
import { confirmAction } from '@/composables/useConfirm'

vi.mock('@/composables/useConfirm', () => ({ confirmAction: vi.fn(async () => false) }))

const makeEditor = () => ({
  selectedPages: { value: new Set(['a']) },
  pageCount: { value: 3 },
  annotations: { value: [{ id: 1 }] },
  deleteSelected: vi.fn(),
  clearAnnotations: vi.fn()
})

describe('Editor de PDF', () => {
  beforeEach(() => confirmAction.mockClear())

  it('borrar páginas pide confirmación global y no borra si se cancela', async () => {
    const { requestDeletePages } = await import('@/views/pdfActions.js')
    const editor = makeEditor()
    await requestDeletePages(editor)
    expect(confirmAction).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }))
    expect(editor.deleteSelected).not.toHaveBeenCalled()
  })

  it('borrar todas las anotaciones pide confirmación', async () => {
    const { requestClearAnnotations } = await import('@/views/pdfActions.js')
    const editor = makeEditor()
    await requestClearAnnotations(editor)
    expect(confirmAction).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }))
    expect(editor.clearAnnotations).not.toHaveBeenCalled()
  })

  it('la miniatura activa lleva is-selected y la casilla dice su estado', async () => {
    const { default: PdfThumbnail } = await import('@/components/pdf/PdfThumbnail.vue')
    const page = { id: 'a', thumbnail: 'data:,', rotation: 0 }
    const w = mount(PdfThumbnail, { props: { page, index: 0, active: true, checked: true } })
    expect(w.classes()).toContain('is-selected')
    const box = w.find('[aria-pressed]')
    expect(box.attributes('aria-pressed')).toBe('true')
    expect(box.attributes('aria-label')).toMatch(/página 1/i)
    await box.trigger('click')
    expect(w.emitted('toggle')).toBeTruthy()
    expect(w.emitted('select')).toBeFalsy()
  })
})
