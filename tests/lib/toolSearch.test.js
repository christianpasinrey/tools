import { normalize, searchTools } from '@/lib/toolSearch'
import { TASKS } from '@/config/catalog'

const ids = (q, index) => searchTools(q, index).map(r => r.entry.id)

describe('normalize', () => {
  it('quita tildes, mayúsculas y signos', () => {
    expect(normalize('  ¡Contraseña  SEGURA! ')).toBe('contrasena segura')
  })
})

describe('searchTools', () => {
  it('consulta vacía devuelve las destacadas', () => {
    const res = ids('')
    expect(res.length).toBe(TASKS.filter(t => t.featured).length)
    expect(res).toContain('pdf-editor')
  })
  it('"pdf a word" encuentra PDF a Word y excluye el editor de PDF', () => {
    const res = ids('pdf a word')
    expect(res[0]).toBe('pdf-to-word')
    expect(res).not.toContain('pdf-editor')
  })
  it('entiende sinónimos: "fotos" → editor de imágenes', () => {
    expect(ids('fotos')).toContain('image-editor')
  })
  it('sin tildes: "contraseña" → seguridad', () => {
    expect(ids('contraseña')[0]).toBe('security')
  })
  it('"hex a rgb" → selector de color', () => {
    expect(ids('hex a rgb')[0]).toBe('color')
  })
  it('prefijos: "kanb" → tablero kanban', () => {
    expect(ids('kanb')[0]).toBe('todo')
  })
  it('encuentra chuletas por nombre', () => {
    expect(ids('git')).toContain('sheet-git')
  })
  it('sin coincidencias devuelve []', () => {
    expect(ids('zzqqxx')).toEqual([])
  })
  it('respeta el límite', () => {
    expect(searchTools('pdf', undefined, { limit: 2 }).length).toBe(2)
  })
})
