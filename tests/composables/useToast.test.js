import { toast, useToasts } from '@/composables/useToast'

describe('toast', () => {
  beforeEach(() => { vi.useFakeTimers(); useToasts().toasts.value = [] })
  afterEach(() => vi.useRealTimers())

  it('añade y retira tras la duración', () => {
    const { toasts } = useToasts()
    toast('Guardado', { tone: 'success', duration: 1000 })
    expect(toasts.value).toEqual([expect.objectContaining({ message: 'Guardado', tone: 'success' })])
    vi.advanceTimersByTime(1001)
    expect(toasts.value).toEqual([])
  })

  it('máximo 3 visibles', () => {
    for (let i = 0; i < 5; i++) toast(`t${i}`)
    expect(useToasts().toasts.value.map(t => t.message)).toEqual(['t2', 't3', 't4'])
  })
})
