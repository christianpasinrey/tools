import { ref, computed, reactive } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import XLSX from 'xlsx-js-style'

// Global dark mode (persists to localStorage)
export const isDark = useDark()
export const toggleDark = useToggle(isDark)

// Constants
const DEFAULT_ROWS = 50
const DEFAULT_COLS = 26
const COLS_INCREMENT = 26 // Add one alphabet at a time
const MAX_COLS = 702 // A to ZZ (safer for browser performance)
const MAX_ROWS = 5000 // Limit rows for performance
const MAX_HISTORY = 50

// Color palettes
export const TEXT_COLORS = [
  '#000000', // black
  '#525252', // gray-600
  '#a3a3a3', // gray-400
  '#ffffff', // white
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899'  // pink
]

export const BG_COLORS = [
  '#fecaca', // red-200
  '#fed7aa', // orange-200
  '#fef08a', // yellow-200
  '#bbf7d0', // green-200
  '#bfdbfe', // blue-200
  '#ddd6fe', // purple-200
  '#fbcfe8', // pink-200
  '#e5e5e5', // neutral-200
  '#262626'  // neutral-800
]

// Border presets
export const BORDER_PRESETS = [
  { id: 'none', name: 'Sin borde', icon: 'none' },
  { id: 'all', name: 'Todos los bordes', icon: 'all' },
  { id: 'bottom', name: 'Borde inferior', icon: 'bottom' },
  { id: 'top-bottom', name: 'Arriba y abajo', icon: 'top-bottom' },
  { id: 'left-right', name: 'Izquierda y derecha', icon: 'left-right' }
]

export function useSpreadsheet() {
  // State
  const fileInput = ref(null)
  const fileName = ref('')
  const sheets = ref([])
  const activeSheetIndex = ref(0)
  const data = ref([])
  const cellStyles = ref({})
  const columnWidths = ref({}) // Store column widths in pixels
  const rowHeights = ref({}) // Store row heights in pixels

  // Loading state
  const isLoading = ref(false)
  const loadingMessage = ref('')
  let loadingTimeout = null

  function startLoading(message = 'Cargando...', immediate = false) {
    loadingMessage.value = message

    if (immediate) {
      isLoading.value = true
    } else {
      // Only show loader after 1 second delay for quick operations
      loadingTimeout = setTimeout(() => {
        isLoading.value = true
      }, 1000)
    }
  }

  function stopLoading() {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    isLoading.value = false
    loadingMessage.value = ''
  }

  // Selection state
  const selectedCell = ref(null)
  const editingCell = ref(null)
  const editValue = ref('')

  // UI state
  const isDragging = ref(false)
  const contextMenu = reactive({ visible: false, x: 0, y: 0 })

  // History for undo/redo
  const history = ref([])
  const historyIndex = ref(-1)

  // Clipboard
  const clipboard = ref(null)

  // Computed
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const currentCellStyle = computed(() => {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return {}
    return getCellStyle(cell.row, cell.col)
  })

  const currentCellRef = computed(() => {
    if (!selectedCell.value) return ''
    return `${getColumnLabel(selectedCell.value.col)}${selectedCell.value.row + 1}`
  })

  const currentCellValue = computed(() => {
    if (!selectedCell.value) return ''
    return data.value[selectedCell.value.row]?.[selectedCell.value.col] || ''
  })

  const columns = computed(() => {
    const colCount = data.value[0]?.length || DEFAULT_COLS
    return Array.from({ length: colCount }, (_, i) => getColumnLabel(i))
  })

  // Helpers
  function getColumnLabel(index) {
    let label = ''
    let i = index
    while (i >= 0) {
      label = String.fromCharCode(65 + (i % 26)) + label
      i = Math.floor(i / 26) - 1
    }
    return label
  }

  function getCellStyleKey(row, col) {
    return `${row}-${col}`
  }

  function getCellStyle(row, col) {
    return cellStyles.value[getCellStyleKey(row, col)] || {}
  }

  function createEmptyData(rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => '')
    )
  }

  // Add more columns to existing data
  function addColumns(count = COLS_INCREMENT) {
    const currentCols = data.value[0]?.length || 0
    const newTotal = Math.min(currentCols + count, MAX_COLS)
    const toAdd = newTotal - currentCols

    if (toAdd <= 0) return false

    data.value.forEach(row => {
      for (let i = 0; i < toAdd; i++) {
        row.push('')
      }
    })

    return true
  }

  // Add more rows to existing data
  function addRows(count = 50) {
    const currentRows = data.value.length
    if (currentRows >= MAX_ROWS) return false

    const cols = data.value[0]?.length || DEFAULT_COLS
    const toAdd = Math.min(count, MAX_ROWS - currentRows)

    for (let i = 0; i < toAdd; i++) {
      data.value.push(Array.from({ length: cols }, () => ''))
    }
    return true
  }

  // Check if we need more columns (for infinite scroll)
  function checkExpandColumns(scrollLeft, scrollWidth, clientWidth) {
    const threshold = 200 // pixels from right edge
    const nearRightEdge = scrollWidth - scrollLeft - clientWidth < threshold
    const currentCols = data.value[0]?.length || 0

    if (nearRightEdge && currentCols < MAX_COLS) {
      return addColumns()
    }
    return false
  }

  // Check if we need more rows (for infinite scroll)
  function checkExpandRows(scrollTop, scrollHeight, clientHeight) {
    const threshold = 200 // pixels from bottom edge
    const nearBottomEdge = scrollHeight - scrollTop - clientHeight < threshold

    if (nearBottomEdge) {
      return addRows()
    }
    return false
  }

  // History management
  function saveToHistory() {
    // Remove future states if we're not at the end
    history.value = history.value.slice(0, historyIndex.value + 1)

    // Save current state
    history.value.push({
      data: JSON.parse(JSON.stringify(data.value)),
      styles: JSON.parse(JSON.stringify(cellStyles.value))
    })

    // Limit history size
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  function undo() {
    if (!canUndo.value) return
    historyIndex.value--
    restoreState(history.value[historyIndex.value])
  }

  function redo() {
    if (!canRedo.value) return
    historyIndex.value++
    restoreState(history.value[historyIndex.value])
  }

  function restoreState(state) {
    data.value = JSON.parse(JSON.stringify(state.data))
    cellStyles.value = JSON.parse(JSON.stringify(state.styles || {}))
  }

  function resetHistory() {
    history.value = [{
      data: JSON.parse(JSON.stringify(data.value)),
      styles: JSON.parse(JSON.stringify(cellStyles.value))
    }]
    historyIndex.value = 0
  }

  // Initialization
  function initEmptySheet() {
    data.value = createEmptyData()
    cellStyles.value = {}
    columnWidths.value = {}
    rowHeights.value = {}
    sheets.value = [{ name: 'Hoja 1', data: data.value, styles: {}, colWidths: {}, rowHeights: {} }]
    activeSheetIndex.value = 0
    fileName.value = ''
    selectedCell.value = null
    editingCell.value = null
    resetHistory()
  }

  // File operations
  async function loadFile(file) {
    if (!file) return false

    const validExtensions = /\.(xlsx|xls|csv)$/i
    if (!validExtensions.test(file.name)) {
      alert('Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV')
      return false
    }

    startLoading('Leyendo archivo...', true) // immediate for file ops

    try {
      const arrayBuffer = await file.arrayBuffer()

      // Use setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 0))

      loadingMessage.value = 'Procesando hojas...'
      // Read with all style-related options
      const workbook = XLSX.read(arrayBuffer, {
        type: 'array',
        cellStyles: true,
        cellFormula: true,
        cellNF: true,
        cellDates: true
      })

      sheets.value = workbook.SheetNames.map((name, sheetIndex) => {
        loadingMessage.value = `Procesando hoja ${sheetIndex + 1} de ${workbook.SheetNames.length}...`

        const sheet = workbook.Sheets[name]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        // Limit columns to prevent browser crash
        const maxColsFromData = Math.max(...jsonData.map(r => r?.length || 0))
        const rows = Math.max(DEFAULT_ROWS, Math.min(jsonData.length, 10000)) // Max 10k rows
        const cols = Math.max(DEFAULT_COLS, Math.min(maxColsFromData, 702)) // Max ZZ columns initially

        const normalizedData = Array.from({ length: rows }, (_, rowIndex) => {
          const row = jsonData[rowIndex] || []
          return Array.from({ length: cols }, (_, colIndex) => {
            const val = row[colIndex]
            return val !== undefined ? String(val) : ''
          })
        })

        // Extract styles from cells
        const importedStyles = {}
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')

        // Debug: log first few cells to see structure
        let debugCount = 0
        for (let row = range.s.r; row <= Math.min(range.e.r, rows - 1); row++) {
          for (let col = range.s.c; col <= Math.min(range.e.c, cols - 1); col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
            const cell = sheet[cellRef]

            // Debug log for first cells with any style-like properties
            if (cell && debugCount < 5) {
              console.log(`Cell ${cellRef}:`, JSON.stringify(cell, null, 2))
              debugCount++
            }

            if (cell && cell.s) {
              const style = convertFromXlsxStyle(cell.s)
              if (style && Object.keys(style).length > 0) {
                importedStyles[`${row}-${col}`] = style
              }
            }
          }
        }

        console.log('Imported styles:', importedStyles)
        console.log('Sheet cols:', sheet['!cols'])
        console.log('Sheet rows:', sheet['!rows'])

        // Extract column widths (xlsx uses character width, we convert to pixels)
        const colWidths = {}
        if (sheet['!cols']) {
          sheet['!cols'].forEach((col, index) => {
            if (col && col.wpx) {
              colWidths[index] = col.wpx
            } else if (col && col.wch) {
              // Convert character width to pixels (approx 7px per character)
              colWidths[index] = Math.round(col.wch * 7)
            } else if (col && col.width) {
              colWidths[index] = Math.round(col.width * 7)
            }
          })
        }

        // Extract row heights
        const rowHeightsData = {}
        if (sheet['!rows']) {
          sheet['!rows'].forEach((row, index) => {
            if (row && row.hpx) {
              rowHeightsData[index] = row.hpx
            } else if (row && row.hpt) {
              // Convert points to pixels (1pt = 1.333px)
              rowHeightsData[index] = Math.round(row.hpt * 1.333)
            }
          })
        }

        return { name, data: normalizedData, styles: importedStyles, colWidths, rowHeights: rowHeightsData }
      })

      activeSheetIndex.value = 0
      data.value = sheets.value[0].data
      cellStyles.value = sheets.value[0].styles || {}
      columnWidths.value = sheets.value[0].colWidths || {}
      rowHeights.value = sheets.value[0].rowHeights || {}
      fileName.value = file.name
      resetHistory()
      stopLoading()
      return true
    } catch (error) {
      console.error('Error reading file:', error)
      stopLoading()
      alert('Error al leer el archivo')
      return false
    }
  }

  // Convert hex color to ARGB format for xlsx (without #)
  function hexToArgb(hex) {
    if (!hex) return null
    return hex.replace('#', '').toUpperCase()
  }

  // Convert ARGB to hex color (with #)
  function argbToHex(argb) {
    if (!argb) return null
    // Handle ARGB (8 chars) or RGB (6 chars)
    const rgb = argb.length === 8 ? argb.slice(2) : argb
    return '#' + rgb.toLowerCase()
  }

  // Convert xlsx-js-style format to our cell style
  function convertFromXlsxStyle(xlsxStyle) {
    if (!xlsxStyle) return null

    const style = {}

    // Font styles - check multiple possible structures
    const font = xlsxStyle.font || xlsxStyle.Font
    if (font) {
      if (font.bold || font.Bold) style.bold = true
      if (font.italic || font.Italic) style.italic = true

      // Text color - various possible structures
      const fontColor = font.color || font.Color
      if (fontColor) {
        if (fontColor.rgb) {
          style.textColor = argbToHex(fontColor.rgb)
        } else if (fontColor.argb) {
          style.textColor = argbToHex(fontColor.argb)
        }
      }
    }

    // Background fill - check multiple possible structures
    const fill = xlsxStyle.fill || xlsxStyle.Fill || xlsxStyle.patternFill
    if (fill) {
      // Try different color properties
      const fgColor = fill.fgColor || fill.FgColor || fill.bgColor || fill.BgColor
      if (fgColor) {
        const colorValue = fgColor.rgb || fgColor.argb || fgColor.indexed
        if (colorValue && typeof colorValue === 'string' && colorValue !== '000000' && colorValue !== 'FF000000') {
          style.bgColor = argbToHex(colorValue)
        }
      }

      // Also check patternFill structure
      if (fill.patternFill?.fgColor?.rgb) {
        style.bgColor = argbToHex(fill.patternFill.fgColor.rgb)
      }

      // Theme colors
      if (fgColor?.theme !== undefined) {
        const themeColors = {
          0: '#ffffff', 1: '#000000', 2: '#e7e6e6', 3: '#44546a',
          4: '#4472c4', 5: '#ed7d31', 6: '#a5a5a5', 7: '#ffc000',
          8: '#5b9bd5', 9: '#70ad47'
        }
        if (themeColors[fgColor.theme]) {
          style.bgColor = themeColors[fgColor.theme]
        }
      }
    }

    // Borders - check multiple possible structures
    const border = xlsxStyle.border || xlsxStyle.Border
    if (border) {
      const borders = {}

      // Check each border side - be very permissive
      const checkBorder = (side) => {
        const variations = [
          side,
          side.charAt(0).toUpperCase() + side.slice(1),
          side.toLowerCase()
        ]
        for (const v of variations) {
          const b = border[v]
          if (b) {
            // Any truthy value means border exists
            if (typeof b === 'object') {
              return Object.keys(b).length > 0 || b.style || b.color
            }
            return true
          }
        }
        return false
      }

      if (checkBorder('top')) borders.top = true
      if (checkBorder('right')) borders.right = true
      if (checkBorder('bottom')) borders.bottom = true
      if (checkBorder('left')) borders.left = true

      // Debug log
      if (Object.keys(border).length > 0) {
        console.log('Border object found:', border, '-> Parsed:', borders)
      }

      if (Object.keys(borders).length > 0) {
        style.borders = borders
      }
    }

    return style
  }

  // Convert our cell style to xlsx-js-style format
  function convertToXlsxStyle(style) {
    if (!style || Object.keys(style).length === 0) return null

    const xlsxStyle = {}

    // Font styles
    if (style.bold || style.italic || style.textColor) {
      xlsxStyle.font = {}
      if (style.bold) xlsxStyle.font.bold = true
      if (style.italic) xlsxStyle.font.italic = true
      if (style.textColor) {
        xlsxStyle.font.color = { rgb: hexToArgb(style.textColor) }
      }
    }

    // Background fill
    if (style.bgColor) {
      xlsxStyle.fill = {
        patternType: 'solid',
        fgColor: { rgb: hexToArgb(style.bgColor) }
      }
    }

    // Borders
    if (style.borders) {
      const borderStyle = { style: 'thin', color: { rgb: '737373' } }
      xlsxStyle.border = {}
      if (style.borders.top) xlsxStyle.border.top = borderStyle
      if (style.borders.right) xlsxStyle.border.right = borderStyle
      if (style.borders.bottom) xlsxStyle.border.bottom = borderStyle
      if (style.borders.left) xlsxStyle.border.left = borderStyle
    }

    return Object.keys(xlsxStyle).length > 0 ? xlsxStyle : null
  }

  async function exportXlsx() {
    startLoading('Exportando XLSX...', true)

    try {
      // Save current sheet state
      saveCurrentSheetState()

      await new Promise(resolve => setTimeout(resolve, 0))

      const workbook = XLSX.utils.book_new()

      sheets.value.forEach((sheet, sheetIndex) => {
        loadingMessage.value = `Procesando hoja ${sheetIndex + 1}...`

        // Create worksheet from data
        const sheetData = sheet.data
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

        // Apply styles to cells
        const styles = sheet.styles || {}
        Object.entries(styles).forEach(([key, style]) => {
          const [row, col] = key.split('-').map(Number)
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          const xlsxStyle = convertToXlsxStyle(style)

          if (xlsxStyle) {
            // Create cell if it doesn't exist (for styled empty cells)
            if (!worksheet[cellRef]) {
              worksheet[cellRef] = { t: 's', v: '' }
            }
            worksheet[cellRef].s = xlsxStyle
          }
        })

        // Apply column widths
        const colWidths = sheet.colWidths || {}
        if (Object.keys(colWidths).length > 0) {
          const maxCol = Math.max(...Object.keys(colWidths).map(Number), sheetData[0]?.length || 0)
          worksheet['!cols'] = []
          for (let i = 0; i <= maxCol; i++) {
            if (colWidths[i]) {
              worksheet['!cols'][i] = { wpx: colWidths[i] }
            } else {
              worksheet['!cols'][i] = { wpx: 100 } // default width
            }
          }
        }

        // Apply row heights
        const rowHeightsData = sheet.rowHeights || {}
        if (Object.keys(rowHeightsData).length > 0) {
          const maxRow = Math.max(...Object.keys(rowHeightsData).map(Number), sheetData.length)
          worksheet['!rows'] = []
          for (let i = 0; i <= maxRow; i++) {
            if (rowHeightsData[i]) {
              worksheet['!rows'][i] = { hpx: rowHeightsData[i] }
            }
          }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
      })

      const exportName = fileName.value
        ? fileName.value.replace(/\.[^.]+$/, '') + '_editado.xlsx'
        : 'documento.xlsx'

      loadingMessage.value = 'Descargando...'
      XLSX.writeFile(workbook, exportName)
      stopLoading()
    } catch (error) {
      console.error('Export error:', error)
      stopLoading()
      alert('Error al exportar el archivo')
    }
  }

  async function exportCsv() {
    startLoading('Exportando CSV...', true)

    try {
      await new Promise(resolve => setTimeout(resolve, 0))

      const worksheet = XLSX.utils.aoa_to_sheet(data.value)
      const csv = XLSX.utils.sheet_to_csv(worksheet)

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName.value
        ? fileName.value.replace(/\.[^.]+$/, '') + '.csv'
        : 'documento.csv'
      link.click()
      URL.revokeObjectURL(link.href)
      stopLoading()
    } catch (error) {
      stopLoading()
      alert('Error al exportar el archivo')
    }
  }

  // Sheet management
  function saveCurrentSheetState() {
    if (sheets.value[activeSheetIndex.value]) {
      sheets.value[activeSheetIndex.value].data = data.value
      sheets.value[activeSheetIndex.value].styles = cellStyles.value
      sheets.value[activeSheetIndex.value].colWidths = columnWidths.value
      sheets.value[activeSheetIndex.value].rowHeights = rowHeights.value
    }
  }

  function switchSheet(index) {
    saveCurrentSheetState()
    activeSheetIndex.value = index
    data.value = sheets.value[index].data
    cellStyles.value = sheets.value[index].styles || {}
    columnWidths.value = sheets.value[index].colWidths || {}
    rowHeights.value = sheets.value[index].rowHeights || {}
    selectedCell.value = null
    editingCell.value = null
    resetHistory()
  }

  // Set column width
  function setColumnWidth(colIndex, width) {
    columnWidths.value[colIndex] = Math.max(50, Math.min(width, 500)) // Min 50px, max 500px
  }

  // Set row height
  function setRowHeight(rowIndex, height) {
    rowHeights.value[rowIndex] = Math.max(20, Math.min(height, 200)) // Min 20px, max 200px
  }

  // Get column width (default 100px)
  function getColumnWidth(colIndex) {
    return columnWidths.value[colIndex] || 100
  }

  // Get row height (default 28px)
  function getRowHeight(rowIndex) {
    return rowHeights.value[rowIndex] || 28
  }

  // Cell selection and editing
  function selectCell(row, col) {
    selectedCell.value = { row, col }
  }

  function startEdit(row, col) {
    editingCell.value = { row, col }
    editValue.value = data.value[row][col]
  }

  function finishEdit() {
    if (!editingCell.value) return

    const { row, col } = editingCell.value
    const oldValue = data.value[row][col]

    if (oldValue !== editValue.value) {
      saveToHistory()
      data.value[row][col] = editValue.value
    }

    editingCell.value = null
  }

  function cancelEdit() {
    editingCell.value = null
    editValue.value = ''
  }

  // Clipboard operations
  function copyCell() {
    if (!selectedCell.value) return

    const { row, col } = selectedCell.value
    clipboard.value = {
      value: data.value[row][col],
      style: JSON.parse(JSON.stringify(getCellStyle(row, col))),
      isCut: false
    }
    navigator.clipboard?.writeText(clipboard.value.value)
  }

  function cutCell() {
    if (!selectedCell.value) return

    const { row, col } = selectedCell.value
    clipboard.value = {
      value: data.value[row][col],
      style: JSON.parse(JSON.stringify(getCellStyle(row, col))),
      sourceRow: row,
      sourceCol: col,
      isCut: true
    }
    navigator.clipboard?.writeText(clipboard.value.value)
  }

  async function pasteCell() {
    if (!selectedCell.value) return

    saveToHistory()
    const { row, col } = selectedCell.value

    let textToPaste = clipboard.value?.value || ''
    try {
      textToPaste = await navigator.clipboard.readText()
    } catch (e) {
      // Use internal clipboard
    }

    data.value[row][col] = textToPaste

    // Copy style if from internal clipboard
    if (clipboard.value?.style) {
      const key = getCellStyleKey(row, col)
      cellStyles.value[key] = JSON.parse(JSON.stringify(clipboard.value.style))
    }

    // Clear source if cut
    if (clipboard.value?.isCut && clipboard.value.sourceRow !== undefined) {
      data.value[clipboard.value.sourceRow][clipboard.value.sourceCol] = ''
      const sourceKey = getCellStyleKey(clipboard.value.sourceRow, clipboard.value.sourceCol)
      delete cellStyles.value[sourceKey]
      clipboard.value = null
    }
  }

  function clearCell() {
    if (!selectedCell.value) return

    saveToHistory()
    const { row, col } = selectedCell.value
    data.value[row][col] = ''
  }

  // Style operations
  function setCellStyle(property, value) {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return

    saveToHistory()
    const key = getCellStyleKey(cell.row, cell.col)

    if (!cellStyles.value[key]) {
      cellStyles.value[key] = {}
    }

    if (value === null || value === undefined) {
      delete cellStyles.value[key][property]
    } else {
      cellStyles.value[key][property] = value
    }
  }

  function toggleCellStyle(property) {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return

    saveToHistory()
    const key = getCellStyleKey(cell.row, cell.col)

    if (!cellStyles.value[key]) {
      cellStyles.value[key] = {}
    }

    cellStyles.value[key][property] = !cellStyles.value[key][property]
  }

  function setBorders(preset) {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return

    saveToHistory()
    const key = getCellStyleKey(cell.row, cell.col)

    if (!cellStyles.value[key]) {
      cellStyles.value[key] = {}
    }

    // Define border configurations
    const borderConfigs = {
      'none': { top: false, right: false, bottom: false, left: false },
      'all': { top: true, right: true, bottom: true, left: true },
      'bottom': { top: false, right: false, bottom: true, left: false },
      'top-bottom': { top: true, right: false, bottom: true, left: false },
      'left-right': { top: false, right: true, bottom: false, left: true }
    }

    cellStyles.value[key].borders = borderConfigs[preset] || borderConfigs['none']
  }

  // Helper to determine if a color is light
  function isLightColor(hexColor) {
    if (!hexColor) return false
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5
  }

  function getCellComputedStyle(row, col) {
    const style = getCellStyle(row, col)

    // Auto-adjust text color based on background brightness and theme
    let textColor = style.textColor

    // Swap black/white based on theme for better visibility
    if (textColor) {
      if (isDark.value) {
        // In dark mode: black -> white, keep others
        if (textColor === '#000000') textColor = '#ffffff'
      } else {
        // In light mode: white -> black, keep others
        if (textColor === '#ffffff') textColor = '#000000'
      }
    }

    if (!textColor) {
      if (style.bgColor) {
        textColor = isLightColor(style.bgColor) ? '#171717' : '#f5f5f5'
      } else {
        textColor = isDark.value ? '#d4d4d4' : '#171717'
      }
    }

    const computed = {
      fontWeight: style.bold ? 'bold' : 'normal',
      fontStyle: style.italic ? 'italic' : 'normal',
      color: textColor,
      backgroundColor: style.bgColor || ''
    }

    // Apply borders
    if (style.borders) {
      const borderColor = '#737373'
      const borderStyle = '2px solid ' + borderColor

      if (style.borders.top) computed.borderTop = borderStyle
      if (style.borders.right) computed.borderRight = borderStyle
      if (style.borders.bottom) computed.borderBottom = borderStyle
      if (style.borders.left) computed.borderLeft = borderStyle
    }

    return computed
  }

  // Row/Column operations
  function insertRowAbove() {
    if (!selectedCell.value) return

    saveToHistory()
    const cols = data.value[0]?.length || DEFAULT_COLS
    const newRow = Array.from({ length: cols }, () => '')
    data.value.splice(selectedCell.value.row, 0, newRow)

    // Shift styles down
    shiftStylesAfterRowInsert(selectedCell.value.row)
  }

  function insertRowBelow() {
    if (!selectedCell.value) return

    saveToHistory()
    const cols = data.value[0]?.length || DEFAULT_COLS
    const newRow = Array.from({ length: cols }, () => '')
    data.value.splice(selectedCell.value.row + 1, 0, newRow)

    // Shift styles down
    shiftStylesAfterRowInsert(selectedCell.value.row + 1)
  }

  function deleteRow() {
    if (!selectedCell.value || data.value.length <= 1) return

    saveToHistory()
    const rowToDelete = selectedCell.value.row
    data.value.splice(rowToDelete, 1)

    // Shift styles up
    shiftStylesAfterRowDelete(rowToDelete)

    if (selectedCell.value.row >= data.value.length) {
      selectedCell.value.row = data.value.length - 1
    }
  }

  function insertColumnLeft() {
    if (!selectedCell.value) return

    saveToHistory()
    const col = selectedCell.value.col
    data.value.forEach(row => row.splice(col, 0, ''))

    // Shift styles right
    shiftStylesAfterColumnInsert(col)
  }

  function insertColumnRight() {
    if (!selectedCell.value) return

    saveToHistory()
    const col = selectedCell.value.col + 1
    data.value.forEach(row => row.splice(col, 0, ''))

    // Shift styles right
    shiftStylesAfterColumnInsert(col)
  }

  function deleteColumn() {
    if (!selectedCell.value || (data.value[0]?.length || 0) <= 1) return

    saveToHistory()
    const col = selectedCell.value.col
    data.value.forEach(row => row.splice(col, 1))

    // Shift styles left
    shiftStylesAfterColumnDelete(col)

    if (selectedCell.value.col >= data.value[0].length) {
      selectedCell.value.col = data.value[0].length - 1
    }
  }

  // Style shifting helpers
  function shiftStylesAfterRowInsert(insertedRow) {
    const newStyles = {}
    Object.entries(cellStyles.value).forEach(([key, style]) => {
      const [row, col] = key.split('-').map(Number)
      if (row >= insertedRow) {
        newStyles[`${row + 1}-${col}`] = style
      } else {
        newStyles[key] = style
      }
    })
    cellStyles.value = newStyles
  }

  function shiftStylesAfterRowDelete(deletedRow) {
    const newStyles = {}
    Object.entries(cellStyles.value).forEach(([key, style]) => {
      const [row, col] = key.split('-').map(Number)
      if (row > deletedRow) {
        newStyles[`${row - 1}-${col}`] = style
      } else if (row < deletedRow) {
        newStyles[key] = style
      }
      // Skip the deleted row
    })
    cellStyles.value = newStyles
  }

  function shiftStylesAfterColumnInsert(insertedCol) {
    const newStyles = {}
    Object.entries(cellStyles.value).forEach(([key, style]) => {
      const [row, col] = key.split('-').map(Number)
      if (col >= insertedCol) {
        newStyles[`${row}-${col + 1}`] = style
      } else {
        newStyles[key] = style
      }
    })
    cellStyles.value = newStyles
  }

  function shiftStylesAfterColumnDelete(deletedCol) {
    const newStyles = {}
    Object.entries(cellStyles.value).forEach(([key, style]) => {
      const [row, col] = key.split('-').map(Number)
      if (col > deletedCol) {
        newStyles[`${row}-${col - 1}`] = style
      } else if (col < deletedCol) {
        newStyles[key] = style
      }
      // Skip the deleted column
    })
    cellStyles.value = newStyles
  }

  // Navigation
  function moveSelection(direction) {
    if (!selectedCell.value) return

    const { row, col } = selectedCell.value
    const maxRow = data.value.length - 1
    const maxCol = (data.value[0]?.length || 1) - 1

    switch (direction) {
      case 'up':
        if (row > 0) selectedCell.value = { row: row - 1, col }
        break
      case 'down':
        if (row < maxRow) selectedCell.value = { row: row + 1, col }
        break
      case 'left':
        if (col > 0) selectedCell.value = { row, col: col - 1 }
        break
      case 'right':
        if (col < maxCol) selectedCell.value = { row, col: col + 1 }
        break
    }
  }

  // Context menu
  function openContextMenu(event, row, col) {
    event.preventDefault()
    selectCell(row, col)
    contextMenu.visible = true
    contextMenu.x = event.clientX
    contextMenu.y = event.clientY
  }

  function closeContextMenu() {
    contextMenu.visible = false
  }

  return {
    // State
    fileInput,
    fileName,
    sheets,
    activeSheetIndex,
    data,
    cellStyles,
    selectedCell,
    editingCell,
    editValue,
    isDragging,
    contextMenu,
    clipboard,
    isLoading,
    loadingMessage,
    columnWidths,
    rowHeights,

    // Computed
    canUndo,
    canRedo,
    currentCellStyle,
    currentCellRef,
    currentCellValue,
    columns,

    // Methods
    getColumnLabel,
    getCellStyle,
    getCellComputedStyle,
    initEmptySheet,
    loadFile,
    exportXlsx,
    exportCsv,
    switchSheet,
    selectCell,
    startEdit,
    finishEdit,
    cancelEdit,
    copyCell,
    cutCell,
    pasteCell,
    clearCell,
    setCellStyle,
    toggleCellStyle,
    setBorders,
    insertRowAbove,
    insertRowBelow,
    deleteRow,
    insertColumnLeft,
    insertColumnRight,
    deleteColumn,
    moveSelection,
    openContextMenu,
    closeContextMenu,
    undo,
    redo,
    saveToHistory,
    addColumns,
    addRows,
    checkExpandColumns,
    checkExpandRows,
    setColumnWidth,
    setRowHeight,
    getColumnWidth,
    getRowHeight
  }
}
