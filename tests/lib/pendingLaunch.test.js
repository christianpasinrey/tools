import { setPendingLaunch, takePendingLaunch, clearPendingLaunch, PENDING_TTL_MS } from '@/lib/pendingLaunch'

describe('pendingLaunch', () => {
  beforeEach(() => clearPendingLaunch())
  it('se toma por prefijo y es de un solo uso', () => {
    const file = new File(['x'], 'a.pdf')
    setPendingLaunch('converter:pdf-to-jpg', file, 1000)
    expect(takePendingLaunch('pdf', 1000)).toBeNull()
    expect(takePendingLaunch('converter:', 1000)).toEqual({ target: 'converter:pdf-to-jpg', file })
    expect(takePendingLaunch('converter:', 1000)).toBeNull()
  })
  it('funciona sin archivo', () => {
    setPendingLaunch('image', null, 0)
    expect(takePendingLaunch('image', 0)).toEqual({ target: 'image', file: null })
  })
  it('caduca', () => {
    setPendingLaunch('pdf', null, 0)
    expect(takePendingLaunch('pdf', PENDING_TTL_MS + 1)).toBeNull()
  })
})
