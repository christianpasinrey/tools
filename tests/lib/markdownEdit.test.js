import * as md from '@/lib/markdownEdit'

const s = (start, end = start) => ({ start, end })

describe('wrapSelection', () => {
  it('envuelve la selección y deja el cursor tras el cierre', () => {
    expect(md.wrapSelection('hola mundo', s(5, 10), '**', '**', 'texto')).toEqual({ text: 'hola **mundo**', sel: s(14) })
  })
  it('sin selección inserta el marcador de posición seleccionado', () => {
    expect(md.wrapSelection('ab', s(1), '*', '*', 'texto')).toEqual({ text: 'a*texto*b', sel: s(2, 7) })
  })
})

describe('toggleLinePrefix', () => {
  it('aplica a todas las líneas seleccionadas', () => {
    const r = md.toggleLinePrefix('uno\ndos\ntres', s(1, 6), '- ')
    expect(r.text).toBe('- uno\n- dos\ntres')
  })
  it('si todas lo tienen, lo quita', () => {
    expect(md.toggleLinePrefix('- uno\n- dos', s(0, 11), '- ').text).toBe('uno\ndos')
  })
  it('sin selección actúa sobre la línea del cursor', () => {
    expect(md.toggleLinePrefix('a\nb\nc', s(2), '> ')).toEqual({ text: 'a\n> b\nc', sel: s(4) })
  })
})

describe('setHeading', () => {
  it('pone y cambia el nivel', () => {
    expect(md.setHeading('titulo', s(3), 2).text).toBe('## titulo')
    expect(md.setHeading('### titulo', s(5), 1).text).toBe('# titulo')
  })
  it('mismo nivel lo quita', () => {
    expect(md.setHeading('## titulo', s(4), 2).text).toBe('titulo')
  })
})

describe('insertBlock', () => {
  it('lo separa en su propio párrafo', () => {
    const r = md.insertBlock('a\nb', s(1), '---')
    expect(r.text).toBe('a\n\n---\n\nb')
    expect(r.sel).toEqual(s(6))
  })
})

describe('indentLines', () => {
  it('Tab sin selección inserta dos espacios', () => {
    expect(md.indentLines('ab', s(1))).toEqual({ text: 'a  b', sel: s(3) })
  })
  it('indenta y desindenta varias líneas', () => {
    expect(md.indentLines('a\nb', s(0, 3)).text).toBe('  a\n  b')
    expect(md.indentLines('  a\n  b', s(0, 7), true).text).toBe('a\nb')
  })
})

describe('búsqueda', () => {
  it('literal y sin distinguir mayúsculas, con caracteres de regex', () => {
    expect(md.findMatches('Hola (hola) HOLA*', 'hola')).toHaveLength(3)
    expect(md.findMatches('a.b axb', 'a.b')).toEqual([{ start: 0, end: 3 }])
    expect(md.findMatches('f(x) = (x)', '(x)')).toHaveLength(2)
  })
  it('reemplazar todo usa el mismo criterio que buscar', () => {
    expect(md.replaceAll('Gato gato GATO', 'gato', 'perro')).toEqual({ text: 'perro perro perro', count: 3 })
  })
  it('reemplazar una coincidencia', () => {
    expect(md.replaceAt('uno dos', { start: 4, end: 7 }, 'tres')).toBe('uno tres')
  })
  it('consulta vacía no encuentra nada', () => {
    expect(md.findMatches('abc', '')).toEqual([])
  })
})

describe('extractOutline', () => {
  it('ignora # dentro de bloques de código', () => {
    const text = '# Título\n```bash\n# comentario\n```\n## Sección **uno**'
    expect(md.extractOutline(text)).toEqual([
      { level: 1, text: 'Título', line: 0 },
      { level: 2, text: 'Sección uno', line: 4 }
    ])
  })
})

describe('estadísticas y posición', () => {
  it('cuenta palabras, caracteres, líneas y lectura', () => {
    expect(md.computeStats('hola mundo\nadiós')).toEqual({ words: 3, chars: 16, lines: 2, readTime: 1 })
    expect(md.computeStats('')).toEqual({ words: 0, chars: 0, lines: 1, readTime: 0 })
  })
  it('línea y columna del cursor', () => {
    expect(md.cursorPosition('ab\ncd', 4)).toEqual({ line: 2, col: 2 })
    expect(md.offsetOfLine('ab\ncd\nef', 2)).toBe(6)
  })
})

describe('documento que empieza por línea en blanco', () => {
  it('prefijo con el cursor en 0 no duplica el salto', () => {
    expect(md.toggleLinePrefix('\nabc', s(0), '- ').text).toBe('- \nabc')
  })
  it('título con el cursor en 0', () => {
    expect(md.setHeading('\nabc', s(0), 2).text).toBe('## \nabc')
  })
  it('indentar incluye la primera línea vacía', () => {
    // [0,5) abarca '\nabc\n': solo las dos primeras líneas
    expect(md.indentLines('\nabc\ndef', s(0, 5)).text).toBe('  \n  abc\ndef')
  })
})
