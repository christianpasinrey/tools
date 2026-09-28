import { resolveCellTextColor as c } from '@/lib/cellColor'

describe('resolveCellTextColor', () => {
  it('negro elegido sobre amarillo se ve negro también en oscuro', () => {
    expect(c({ textColor: '#000000', bgColor: '#ffeb3b' }, true)).toBe('#000000')
  })
  it('sin fondo, negro en oscuro sigue al tema', () => {
    expect(c({ textColor: '#000000' }, true)).toBe('#efeae0')
    expect(c({ textColor: '#ffffff' }, false)).toBe('#1c1a16')
  })
  it('colores propios se respetan', () => {
    expect(c({ textColor: '#d63031' }, true)).toBe('#d63031')
  })
  it('sin color: contraste automático con el fondo o texto del tema', () => {
    expect(c({ bgColor: '#ffeb3b' }, true)).toBe('#1c1a16')
    expect(c({ bgColor: '#1e1e1e' }, false)).toBe('#f3efe7')
    expect(c({}, true)).toBe('#efeae0')
    expect(c({}, false)).toBe('#1c1a16')
  })
})
