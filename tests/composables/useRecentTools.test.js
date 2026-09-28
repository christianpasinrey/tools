import { useRecentTools, _reloadRecentTools } from '@/composables/useRecentTools'

describe('useRecentTools', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); _reloadRecentTools() })

  it('registra recientes sin duplicados, el último primero, máx 8', () => {
    const { recent, recordVisit } = useRecentTools()
    const ids = ['pdf-editor', 'color', 'todo', 'api', 'invoice', 'map', 'markdown', 'docx', 'svg-editor']
    ids.forEach(recordVisit)
    recordVisit('color')
    expect(recent.value.map(e => e.id)).toEqual(['color', 'svg-editor', 'docx', 'markdown', 'map', 'invoice', 'api', 'todo'])
    expect(JSON.parse(localStorage.getItem('tb:recent'))[0]).toBe('color')
  })

  it('ignora ids desconocidos', () => {
    const { recent, recordVisit } = useRecentTools()
    recordVisit('no-existe')
    expect(recent.value).toEqual([])
  })

  it('alterna favoritos', () => {
    const { favorites, toggleFavorite, isFavorite } = useRecentTools()
    toggleFavorite('color')
    expect(isFavorite('color')).toBe(true)
    expect(favorites.value.map(e => e.id)).toEqual(['color'])
    toggleFavorite('color')
    expect(isFavorite('color')).toBe(false)
  })

  it('tolera JSON corrupto', () => {
    localStorage.setItem('tb:recent', '{roto')
    _reloadRecentTools()
    expect(useRecentTools().recent.value).toEqual([])
  })

  it('tolera localStorage que lanza', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded') })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError') })
    _reloadRecentTools()
    const { recent, recordVisit } = useRecentTools()
    expect(() => recordVisit('color')).not.toThrow()
    expect(recent.value.map(e => e.id)).toEqual(['color'])
  })
})
