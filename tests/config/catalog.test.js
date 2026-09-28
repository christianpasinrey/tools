import { CATEGORIES, TASKS, SHEETS, SEARCH_INDEX, getCategory, getEntry, benchTasks, toHref } from '@/config/catalog'
import { hashToTab as documentsHashes } from '@/composables/useDocuments'
import { hashToTab as multimediaHashes } from '@/composables/useMultimedia'
import { hashToTab as toolsHashes } from '@/composables/useTools'
import { buildHashMap } from '@/config/tools'
import { cheatsheetData } from '@/data/cheatsheets'

const acceptedHashes = {
  '/documents': documentsHashes,
  '/multimedia': multimediaHashes,
  '/tools': toolsHashes,
  '/technology': buildHashMap('technology'),
  '/apps': buildHashMap('apps'),
  '/cheatsheets': Object.fromEntries(Object.keys(cheatsheetData).map(k => [k, k]))
}

describe('catálogo', () => {
  it('ids únicos en todo el índice', () => {
    const ids = SEARCH_INDEX.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada entrada pertenece a una categoría existente y tiene textos', () => {
    for (const e of SEARCH_INDEX) {
      expect(getCategory(e.category), e.id).toBeTruthy()
      expect(e.name.length, e.id).toBeGreaterThan(1)
      expect(typeof e.task, e.id).toBe('string')
    }
  })

  it('cada ruta con hash es aceptada por el composable de su sección (caracterización)', () => {
    for (const e of SEARCH_INDEX) {
      const map = acceptedHashes[e.route.path]
      expect(map, `${e.id}: ruta ${e.route.path}`).toBeTruthy()
      if (e.route.hash) expect(map[e.route.hash], `${e.id}: #${e.route.hash}`).toBeTruthy()
    }
  })

  it('las chuletas cubren exactamente cheatsheetData', () => {
    expect(SHEETS.map(s => s.route.hash).sort()).toEqual(Object.keys(cheatsheetData).sort())
    expect(SHEETS.every(s => s.bench === false)).toBe(true)
  })

  it('todas las categorías tienen al menos una utilidad en la mesa', () => {
    for (const c of CATEGORIES) expect(benchTasks(c.id).length, c.id).toBeGreaterThan(0)
  })

  it('toHref compone ruta y hash', () => {
    expect(toHref(getEntry('pdf-to-word'))).toBe('/documents#converter')
    expect(toHref(getEntry('cheatsheets'))).toBe('/cheatsheets')
  })

  it('los launch usan prefijos conocidos', () => {
    for (const t of TASKS.filter(t => t.launch)) {
      expect(t.launch, t.id).toMatch(/^(pdf|image|converter:(jpg-to-pdf|pdf-to-jpg|pdf-to-word|pdf-to-excel))$/)
    }
  })
})
