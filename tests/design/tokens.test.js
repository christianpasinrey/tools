import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(__dirname, '../../src/assets/css/tokens.css'), 'utf8')

function block(selector) {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`No block ${selector}`)
  return css.slice(start, css.indexOf('}', start))
}
function hex(blockText, name) {
  const m = blockText.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`No hex for --${name}`)
  return m[1]
}
function luminance(h) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

describe.each([[':root'], ['html.dark']])('tokens %s', (sel) => {
  const b = block(sel)
  it.each([['tb-ink'], ['tb-muted']])('%s tiene contraste AA sobre fondo y superficie', (fg) => {
    for (const bg of ['tb-bg', 'tb-surface', 'tb-surface-2']) {
      expect(contrast(hex(b, fg), hex(b, bg))).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('el acento tiene contraste AA con su tinta', () => {
    expect(contrast(hex(b, 'tb-accent'), hex(b, 'tb-accent-ink'))).toBeGreaterThanOrEqual(4.5)
  })
})
