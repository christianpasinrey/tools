import { requestDeletePages, requestClose, requestSplitAll } from '@/views/pdfActions.js'

const makeEditor = (selected = 2) => ({
  selectedPages: { value: new Set(Array.from({ length: selected }, (_, i) => `p${i}`)) },
  pageCount: { value: 5 },
  deleteSelected: vi.fn(),
  clearFile: vi.fn(),
  clearHistory: vi.fn(),
  splitAll: vi.fn()
})

describe('pdfActions (caracterización)', () => {
  it('borrar: pregunta en tono peligro y borra la selección si se confirma', async () => {
    const editor = makeEditor(2)
    const confirm = vi.fn(async () => true)
    await requestDeletePages(editor, confirm)
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger', message: expect.stringMatching(/2 páginas/) }))
    expect(editor.deleteSelected).toHaveBeenCalled()
  })
  it('borrar: no hace nada si se cancela', async () => {
    const editor = makeEditor(1)
    await requestDeletePages(editor, async () => false)
    expect(editor.deleteSelected).not.toHaveBeenCalled()
  })
  it('borrar: sin selección no pregunta', async () => {
    const editor = makeEditor(0)
    const confirm = vi.fn(async () => true)
    await requestDeletePages(editor, confirm)
    expect(confirm).not.toHaveBeenCalled()
  })
  it('cerrar: limpia documento e historial al confirmar', async () => {
    const editor = makeEditor()
    await requestClose(editor, async () => true)
    expect(editor.clearFile).toHaveBeenCalled()
    expect(editor.clearHistory).toHaveBeenCalled()
  })
  it('dividir: anuncia cuántos archivos y divide al confirmar', async () => {
    const editor = makeEditor()
    const confirm = vi.fn(async () => true)
    await requestSplitAll(editor, confirm)
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/5 archivos/) }))
    expect(editor.splitAll).toHaveBeenCalled()
  })
})
