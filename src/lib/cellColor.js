// Color de texto de una celda: respeta lo que eligió el usuario y solo
// adapta al tema el negro/blanco "por defecto" cuando la celda no tiene fondo.
const INK = { light: '#1c1a16', dark: '#efeae0' }
const ON_DARK_BG = '#f3efe7'

function isLightColor(hex) {
  const h = hex.replace('#', '')
  if (h.length !== 6) return true
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5
}

export function resolveCellTextColor({ textColor, bgColor } = {}, dark) {
  const themeInk = dark ? INK.dark : INK.light
  if (bgColor) return textColor || (isLightColor(bgColor) ? INK.light : ON_DARK_BG)
  if (!textColor) return themeInk
  if (dark && textColor === '#000000') return themeInk
  if (!dark && textColor === '#ffffff') return themeInk
  return textColor
}
