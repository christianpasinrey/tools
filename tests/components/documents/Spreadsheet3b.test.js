import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Hoja de cálculo — temas', () => {
  const src = readFileSync(resolve(__dirname, '../../../src/components/documents/SpreadsheetEditor.vue'), 'utf8')
  const mobile = readFileSync(resolve(__dirname, '../../../src/components/documents/MobileSpreadsheetEditor.vue'), 'utf8')
  it('sin ramas isDark en la plantilla ni paleta gray', () => {
    expect(src.match(/isDark \?/g) || []).toHaveLength(0)
    expect(src).not.toMatch(/\b(bg|text|border)-gray-\d/)
  })
  it('sin botón de tema propio', () => {
    expect(src).not.toMatch(/toggleDark/)
  })
  it('móvil sin islas oscuras fijas ni títulos blancos', () => {
    expect(mobile).not.toMatch(/\btext-white\b/)
    expect(mobile).not.toMatch(/(?<!dark:)\bbg-neutral-(800|900)\b/)
  })
})

describe('Hoja móvil — formato', () => {
  it('color de texto y alineación usan las mismas claves que el escritorio', async () => {
    const { mount } = await import('@vue/test-utils')
    const { default: Mobile } = await import('@/components/documents/MobileSpreadsheetEditor.vue')
    const w = mount(Mobile, { attachTo: document.body })
    const cell = () => w.findAll('tbody tr')[0].findAll('td')[1]
    await cell().trigger('click')
    await w.find('[aria-label="Formato de celda"]').trigger('click')
    await w.find('[aria-label="Texto #dc2626"], [aria-label^="Texto #"]:not([aria-label="Texto #000000"])').trigger('click')
    await w.find('[aria-label="Centrar"]').trigger('click')
    const style = cell().element.style
    expect(style.color).not.toBe('rgb(229, 229, 229)')
    expect(style.color).toMatch(/rgb/)
    expect(style.textAlign).toBe('center')
    w.unmount()
  })
})
