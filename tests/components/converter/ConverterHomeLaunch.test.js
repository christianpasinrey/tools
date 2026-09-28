import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { setPendingLaunch, clearPendingLaunch } from '@/lib/pendingLaunch'

const fake = {
  activeConversion: ref(null),
  toasts: ref([]),
  isProcessing: ref(false),
  progress: ref(0),
  progressMessage: ref(''),
  selectConversion: (t) => { fake.activeConversion.value = t },
  goBack: () => { fake.activeConversion.value = null },
  showToast: vi.fn()
}
vi.mock('@/composables/useConverter', () => ({ useConverter: () => fake }))

const { default: ConverterHome } = await import('@/components/converter/ConverterHome.vue')

const stubs = {
  ConverterJpgToPdf: { name: 'ConverterJpgToPdf', props: ['converter', 'initialFile'], template: '<div />' },
  ConverterPdfToJpg: { name: 'ConverterPdfToJpg', props: ['converter', 'initialFile'], template: '<div />' },
  ConverterPdfToWord: { name: 'ConverterPdfToWord', props: ['converter', 'initialFile'], template: '<div />' },
  ConverterPdfToExcel: { name: 'ConverterPdfToExcel', props: ['converter', 'initialFile'], template: '<div />' }
}

describe('ConverterHome — archivo entregado', () => {
  beforeEach(() => { clearPendingLaunch(); fake.activeConversion.value = null })

  it('entrega el archivo a la conversión elegida y no lo reutiliza en la siguiente', async () => {
    const file = new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })
    setPendingLaunch('converter:pdf-to-word', file)
    const w = mount(ConverterHome, { global: { stubs } })
    await flushPromises()
    expect(w.findComponent({ name: 'ConverterPdfToWord' }).props('initialFile')).toBe(file)

    fake.goBack(); await flushPromises()
    fake.selectConversion('pdf-to-jpg'); await flushPromises()
    expect(w.findComponent({ name: 'ConverterPdfToJpg' }).props('initialFile')).toBeNull()
  })
})
