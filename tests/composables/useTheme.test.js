import { isDark, toggleDark } from '@/composables/useTheme'
import * as spreadsheet from '@/composables/useSpreadsheet'

describe('useTheme', () => {
  it('useSpreadsheet reexporta el mismo estado de tema (sin duplicarlo)', () => {
    expect(spreadsheet.isDark).toBe(isDark)
    expect(spreadsheet.toggleDark).toBe(toggleDark)
  })

  it('toggleDark alterna la clase dark en <html>', async () => {
    const before = isDark.value
    toggleDark()
    await Promise.resolve()
    expect(isDark.value).toBe(!before)
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
    toggleDark()
  })
})
