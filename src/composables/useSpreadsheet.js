import { ref, computed, reactive } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import ExcelJS from 'exceljs'

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

// Font sizes
export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

// Presets de "Formatear como tabla" (cabecera + zebra)
export const TABLE_PRESETS = [
  { id: 'emerald', name: 'Esmeralda', header: '#059669', headerText: '#ffffff', zebra: '#d1fae5' },
  { id: 'blue', name: 'Azul', header: '#2563eb', headerText: '#ffffff', zebra: '#dbeafe' },
  { id: 'slate', name: 'Neutro', header: '#404040', headerText: '#ffffff', zebra: '#e5e5e5' },
  { id: 'amber', name: 'Ámbar', header: '#d97706', headerText: '#ffffff', zebra: '#fef3c7' },
  { id: 'rose', name: 'Rosa', header: '#e11d48', headerText: '#ffffff', zebra: '#ffe4e6' }
]

// Number formats
export const NUMBER_FORMATS = [
  { id: 'general', name: 'General', format: 'General' },
  { id: 'number', name: 'Número', format: '#,##0.00' },
  { id: 'currency', name: 'Moneda', format: '"$"#,##0.00' },
  { id: 'percentage', name: 'Porcentaje', format: '0.00%' },
  { id: 'date', name: 'Fecha', format: 'DD/MM/YYYY' },
  { id: 'time', name: 'Hora', format: 'HH:MM:SS' },
  { id: 'text', name: 'Texto', format: '@' }
]

export function useSpreadsheet() {
  // State
  const fileInput = ref(null)
  const fileName = ref('')
  const sheets = ref([])
  const activeSheetIndex = ref(0)
  const data = ref([])
  const cellStyles = ref({})
  const cellFormulas = ref({}) // Store formulas separately
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

  // Range selection (drag / shift+click / shift+arrows)
  const selectionAnchor = ref(null)
  const selectionEnd = ref(null)
  const isSelecting = ref(false)

  const selectionBounds = computed(() => {
    if (!selectionAnchor.value || !selectionEnd.value) return null
    return {
      r1: Math.min(selectionAnchor.value.row, selectionEnd.value.row),
      r2: Math.max(selectionAnchor.value.row, selectionEnd.value.row),
      c1: Math.min(selectionAnchor.value.col, selectionEnd.value.col),
      c2: Math.max(selectionAnchor.value.col, selectionEnd.value.col)
    }
  })

  const hasMultiSelection = computed(() => {
    const b = selectionBounds.value
    return !!b && (b.r1 !== b.r2 || b.c1 !== b.c2)
  })

  function startSelection(row, col, extend = false) {
    if (extend && selectedCell.value) {
      selectionAnchor.value = { ...selectedCell.value }
      selectionEnd.value = { row, col }
    } else {
      selectedCell.value = { row, col }
      selectionAnchor.value = { row, col }
      selectionEnd.value = { row, col }
      isSelecting.value = true
    }
  }

  function extendSelection(row, col) {
    if (!isSelecting.value) return
    selectionEnd.value = { row, col }
  }

  function endSelection() {
    isSelecting.value = false
  }

  function extendSelectionTo(row, col) {
    if (!selectionAnchor.value) {
      selectionAnchor.value = selectedCell.value ? { ...selectedCell.value } : { row, col }
    }
    selectionEnd.value = { row, col }
  }

  function isCellInSelection(row, col) {
    const b = selectionBounds.value
    if (!b) return false
    return row >= b.r1 && row <= b.r2 && col >= b.c1 && col <= b.c2
  }

  // Itera todas las celdas seleccionadas (rango o celda única)
  function forEachSelectedCell(fn) {
    const b = selectionBounds.value
    if (b) {
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) fn(r, c)
      }
    } else if (selectedCell.value) {
      fn(selectedCell.value.row, selectedCell.value.col)
    }
  }

  // Estadísticas de la selección (como la barra de estado de Excel)
  const selectionStats = computed(() => {
    const b = selectionBounds.value
    if (!b || !hasMultiSelection.value) return null
    let count = 0, numCount = 0, sum = 0
    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const val = data.value[r]?.[c]
        if (val !== '' && val !== undefined && val !== null) {
          count++
          const num = parseFloat(val)
          if (!isNaN(num) && isFinite(num)) { numCount++; sum += num }
        }
      }
    }
    return {
      cells: (b.r2 - b.r1 + 1) * (b.c2 - b.c1 + 1),
      count,
      sum: numCount > 0 ? sum : null,
      avg: numCount > 0 ? sum / numCount : null
    }
  })

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
    cellFormulas.value = {}
    columnWidths.value = {}
    rowHeights.value = {}
    sheets.value = [{ name: 'Hoja 1', data: data.value, styles: {}, formulas: {}, colWidths: {}, rowHeights: {} }]
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

      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)

      sheets.value = []

      workbook.eachSheet((worksheet, sheetIndex) => {
        loadingMessage.value = `Procesando hoja ${sheetIndex} de ${workbook.worksheets.length}...`

        const rows = Math.max(DEFAULT_ROWS, Math.min(worksheet.rowCount, 10000))
        const cols = Math.max(DEFAULT_COLS, Math.min(worksheet.columnCount, 702))

        const normalizedData = []
        const importedStyles = {}
        const importedFormulas = {}
        const colWidths = {}
        const rowHeightsData = {}

        // Extract column widths
        for (let col = 1; col <= cols; col++) {
          const column = worksheet.getColumn(col)
          if (column.width) {
            // ExcelJS width is in characters, convert to pixels (approx 7px per char)
            colWidths[col - 1] = Math.round(column.width * 7)
          }
        }

        // Process rows
        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
          const row = worksheet.getRow(rowIndex + 1) // ExcelJS is 1-indexed
          const rowData = []

          // Row height
          if (row.height) {
            rowHeightsData[rowIndex] = Math.round(row.height * 1.333) // points to pixels
          }

          for (let colIndex = 0; colIndex < cols; colIndex++) {
            const cell = row.getCell(colIndex + 1) // ExcelJS is 1-indexed

            // Get cell value and formula
            let value = ''
            let formula = null

            if (cell.formula) {
              // Cell has a formula
              formula = cell.formula
              // Use the calculated result as display value
              value = cell.result !== undefined ? String(cell.result) : ''
            } else if (cell.value !== null && cell.value !== undefined) {
              if (typeof cell.value === 'object') {
                // Handle rich text, formula results, etc.
                if (cell.value.formula) {
                  formula = cell.value.formula
                  value = cell.value.result !== undefined ? String(cell.value.result) : ''
                } else {
                  value = cell.text || cell.value.result || cell.value.toString() || ''
                }
              } else {
                value = String(cell.value)
              }
            }

            rowData.push(value)

            // Store formula if exists
            if (formula) {
              importedFormulas[`${rowIndex}-${colIndex}`] = formula
            }

            // Extract styles
            const style = convertFromExcelJSStyle(cell)
            if (style && Object.keys(style).length > 0) {
              importedStyles[`${rowIndex}-${colIndex}`] = style
            }
          }

          normalizedData.push(rowData)
        }

        sheets.value.push({
          name: worksheet.name,
          data: normalizedData,
          styles: importedStyles,
          formulas: importedFormulas,
          colWidths,
          rowHeights: rowHeightsData
        })
      })

      activeSheetIndex.value = 0
      data.value = sheets.value[0].data
      cellStyles.value = sheets.value[0].styles || {}
      cellFormulas.value = sheets.value[0].formulas || {}
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

  // Convert hex color to ARGB format (with FF prefix for full opacity)
  function hexToArgb(hex) {
    if (!hex) return null
    const clean = hex.replace('#', '').toUpperCase()
    return clean.length === 6 ? 'FF' + clean : clean
  }

  // Convert ARGB to hex color (with #)
  function argbToHex(argb) {
    if (!argb) return null
    // Handle ARGB (8 chars) or RGB (6 chars)
    const rgb = argb.length === 8 ? argb.slice(2) : argb
    return '#' + rgb.toLowerCase()
  }

  // Convert ExcelJS cell style to our format
  function convertFromExcelJSStyle(cell) {
    if (!cell) return null

    const style = {}

    // Font styles
    if (cell.font) {
      if (cell.font.bold) style.bold = true
      if (cell.font.italic) style.italic = true
      if (cell.font.underline) style.underline = true
      if (cell.font.strike) style.strikethrough = true
      if (cell.font.size) style.fontSize = cell.font.size
      if (cell.font.color?.argb) {
        style.textColor = argbToHex(cell.font.color.argb)
      }
    }

    // Alignment
    if (cell.alignment) {
      if (cell.alignment.horizontal) style.alignH = cell.alignment.horizontal
      if (cell.alignment.vertical) style.alignV = cell.alignment.vertical
      if (cell.alignment.wrapText) style.wrapText = true
    }

    // Number format
    if (cell.numFmt && cell.numFmt !== 'General') {
      style.numFmt = cell.numFmt
    }

    // Background fill
    if (cell.fill && cell.fill.type === 'pattern' && cell.fill.pattern !== 'none') {
      const fgColor = cell.fill.fgColor
      if (fgColor) {
        if (fgColor.argb && fgColor.argb !== 'FF000000' && fgColor.argb !== '00000000') {
          style.bgColor = argbToHex(fgColor.argb)
        } else if (fgColor.theme !== undefined) {
          // Theme colors mapping
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
    }

    // Borders
    if (cell.border) {
      const borders = {}
      if (cell.border.top?.style) borders.top = true
      if (cell.border.right?.style) borders.right = true
      if (cell.border.bottom?.style) borders.bottom = true
      if (cell.border.left?.style) borders.left = true

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

      const workbook = new ExcelJS.Workbook()

      for (const sheet of sheets.value) {
        loadingMessage.value = `Procesando hoja ${sheet.name}...`

        const worksheet = workbook.addWorksheet(sheet.name)
        const sheetData = sheet.data
        const styles = sheet.styles || {}
        const colWidths = sheet.colWidths || {}
        const rowHeightsData = sheet.rowHeights || {}

        // Set column widths
        const maxCols = sheetData[0]?.length || 0
        for (let col = 0; col < maxCols; col++) {
          const width = colWidths[col] ? colWidths[col] / 7 : 14 // Convert pixels to characters
          worksheet.getColumn(col + 1).width = width
        }

        // Add rows with data, styles and formulas
        const formulas = sheet.formulas || {}

        sheetData.forEach((rowData, rowIndex) => {
          const row = worksheet.addRow(rowData)

          // Set row height
          if (rowHeightsData[rowIndex]) {
            row.height = rowHeightsData[rowIndex] / 1.333 // Convert pixels to points
          }

          // Apply cell styles and formulas
          rowData.forEach((cellValue, colIndex) => {
            const key = `${rowIndex}-${colIndex}`
            const cell = row.getCell(colIndex + 1)

            // Apply formula if exists
            const formula = formulas[key]
            if (formula) {
              cell.value = { formula: formula, result: cellValue }
            }

            // Apply style
            const style = styles[key]
            if (style) {
              applyStyleToExcelCell(cell, style)
            }
          })
        })
      }

      const exportName = fileName.value
        ? fileName.value.replace(/\.[^.]+$/, '') + '_editado.xlsx'
        : 'documento.xlsx'

      loadingMessage.value = 'Descargando...'

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = exportName
      link.click()
      URL.revokeObjectURL(link.href)

      stopLoading()
    } catch (error) {
      console.error('Export error:', error)
      stopLoading()
      alert('Error al exportar el archivo')
    }
  }

  // Apply our cell style to ExcelJS cell
  function applyStyleToExcelCell(cell, style) {
    if (!style || Object.keys(style).length === 0) return

    // Font styles
    if (style.bold || style.italic || style.textColor || style.fontSize || style.underline || style.strikethrough) {
      cell.font = {
        bold: style.bold || false,
        italic: style.italic || false,
        underline: style.underline || false,
        strike: style.strikethrough || false
      }
      if (style.fontSize) {
        cell.font.size = style.fontSize
      }
      if (style.textColor) {
        cell.font.color = { argb: hexToArgb(style.textColor) }
      }
    }

    // Alignment
    if (style.alignH || style.alignV || style.wrapText) {
      cell.alignment = {}
      if (style.alignH) cell.alignment.horizontal = style.alignH
      if (style.alignV) cell.alignment.vertical = style.alignV
      if (style.wrapText) cell.alignment.wrapText = true
    }

    // Number format
    if (style.numFmt) {
      cell.numFmt = style.numFmt
    }

    // Background fill
    if (style.bgColor) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: hexToArgb(style.bgColor) }
      }
    }

    // Borders
    if (style.borders) {
      const borderStyle = { style: 'thin', color: { argb: 'FF737373' } }
      cell.border = {}
      if (style.borders.top) cell.border.top = borderStyle
      if (style.borders.right) cell.border.right = borderStyle
      if (style.borders.bottom) cell.border.bottom = borderStyle
      if (style.borders.left) cell.border.left = borderStyle
    }
  }

  async function exportCsv() {
    startLoading('Exportando CSV...', true)

    try {
      await new Promise(resolve => setTimeout(resolve, 0))

      // Generate CSV manually
      const csv = data.value.map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote or newline
          const str = String(cell || '')
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"'
          }
          return str
        }).join(',')
      ).join('\n')

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
      sheets.value[activeSheetIndex.value].formulas = cellFormulas.value
      sheets.value[activeSheetIndex.value].colWidths = columnWidths.value
      sheets.value[activeSheetIndex.value].rowHeights = rowHeights.value
    }
  }

  function switchSheet(index) {
    saveCurrentSheetState()
    activeSheetIndex.value = index
    data.value = sheets.value[index].data
    cellStyles.value = sheets.value[index].styles || {}
    cellFormulas.value = sheets.value[index].formulas || {}
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

  // Sheet management functions
  function addSheet(name = null) {
    saveCurrentSheetState()

    // Generate unique name
    let sheetName = name
    if (!sheetName) {
      let num = sheets.value.length + 1
      sheetName = `Hoja ${num}`
      while (sheets.value.some(s => s.name === sheetName)) {
        num++
        sheetName = `Hoja ${num}`
      }
    }

    const newSheet = {
      name: sheetName,
      data: createEmptyData(),
      styles: {},
      colWidths: {},
      rowHeights: {}
    }

    sheets.value.push(newSheet)
    switchSheet(sheets.value.length - 1)
    return sheets.value.length - 1
  }

  function renameSheet(index, newName) {
    if (index < 0 || index >= sheets.value.length) return false
    if (!newName || newName.trim() === '') return false

    // Check if name already exists
    const trimmedName = newName.trim()
    if (sheets.value.some((s, i) => i !== index && s.name === trimmedName)) {
      return false
    }

    sheets.value[index].name = trimmedName
    return true
  }

  function deleteSheet(index) {
    if (sheets.value.length <= 1) return false // Keep at least one sheet
    if (index < 0 || index >= sheets.value.length) return false

    sheets.value.splice(index, 1)

    // Adjust active index if needed
    if (activeSheetIndex.value >= sheets.value.length) {
      activeSheetIndex.value = sheets.value.length - 1
    }

    // Load the new active sheet
    data.value = sheets.value[activeSheetIndex.value].data
    cellStyles.value = sheets.value[activeSheetIndex.value].styles || {}
    columnWidths.value = sheets.value[activeSheetIndex.value].colWidths || {}
    rowHeights.value = sheets.value[activeSheetIndex.value].rowHeights || {}
    selectedCell.value = null
    editingCell.value = null
    resetHistory()

    return true
  }

  function duplicateSheet(index) {
    if (index < 0 || index >= sheets.value.length) return false

    saveCurrentSheetState()

    const sourceSheet = sheets.value[index]
    let copyName = `${sourceSheet.name} (copia)`
    let num = 1
    while (sheets.value.some(s => s.name === copyName)) {
      num++
      copyName = `${sourceSheet.name} (copia ${num})`
    }

    const newSheet = {
      name: copyName,
      data: JSON.parse(JSON.stringify(sourceSheet.data)),
      styles: JSON.parse(JSON.stringify(sourceSheet.styles || {})),
      formulas: JSON.parse(JSON.stringify(sourceSheet.formulas || {})),
      colWidths: JSON.parse(JSON.stringify(sourceSheet.colWidths || {})),
      rowHeights: JSON.parse(JSON.stringify(sourceSheet.rowHeights || {}))
    }

    sheets.value.splice(index + 1, 0, newSheet)
    switchSheet(index + 1)
    return true
  }

  // Formula management
  function getCellFormula(row, col) {
    return cellFormulas.value[`${row}-${col}`] || null
  }

  function setCellFormula(row, col, formula) {
    const key = `${row}-${col}`
    if (formula && formula.trim()) {
      // Store formula (remove leading = if present for storage)
      let cleanFormula = formula.trim()
      if (cleanFormula.startsWith('=')) {
        cleanFormula = cleanFormula.slice(1)
      }
      cellFormulas.value[key] = cleanFormula
    } else {
      delete cellFormulas.value[key]
    }
  }

  function hasFormula(row, col) {
    return !!cellFormulas.value[`${row}-${col}`]
  }

  // Get display value for a cell (handles formulas)
  function getCellDisplayValue(row, col) {
    const formula = getCellFormula(row, col)
    if (formula) {
      // Return formula with = prefix for display in edit mode
      return '=' + formula
    }
    return data.value[row]?.[col] || ''
  }

  // Parse cell reference (e.g., "A1" -> {row: 0, col: 0})
  function parseCellRef(ref) {
    const match = ref.match(/^([A-Z]+)(\d+)$/i)
    if (!match) return null

    const colStr = match[1].toUpperCase()
    const rowNum = parseInt(match[2], 10) - 1

    let colNum = 0
    for (let i = 0; i < colStr.length; i++) {
      colNum = colNum * 26 + (colStr.charCodeAt(i) - 64)
    }
    colNum -= 1

    return { row: rowNum, col: colNum }
  }

  // Get cell value by reference (e.g., "A1")
  function getCellValueByRef(ref) {
    const parsed = parseCellRef(ref)
    if (!parsed) return 0
    const val = data.value[parsed.row]?.[parsed.col]
    if (val === '' || val === undefined || val === null) return 0
    const num = parseFloat(val)
    return isNaN(num) ? 0 : num
  }

  // Parse range (e.g., "A1:B3") and return array of values
  function parseRange(range) {
    const parts = range.split(':')
    if (parts.length !== 2) return [getCellValueByRef(range)]

    const start = parseCellRef(parts[0])
    const end = parseCellRef(parts[1])
    if (!start || !end) return []

    const values = []
    for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
      for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
        const val = data.value[r]?.[c]
        if (val !== '' && val !== undefined && val !== null) {
          const num = parseFloat(val)
          if (!isNaN(num)) values.push(num)
        }
      }
    }
    return values
  }

  // Parse function arguments (handles nested functions and ranges)
  function parseArgs(argsStr) {
    const args = []
    let current = ''
    let depth = 0

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i]
      if (char === '(') depth++
      else if (char === ')') depth--
      else if (char === ',' && depth === 0) {
        args.push(current.trim())
        current = ''
        continue
      }
      current += char
    }
    if (current.trim()) args.push(current.trim())
    return args
  }

  // Alias de funciones en español → inglés
  const FUNC_ALIASES = {
    SUMA: 'SUM',
    PROMEDIO: 'AVERAGE',
    MEDIA: 'AVERAGE',
    CONTAR: 'COUNT',
    CONTARA: 'COUNTA',
    SI: 'IF',
    REDONDEAR: 'ROUND',
    RAIZ: 'SQRT',
    POTENCIA: 'POWER',
    PRODUCTO: 'PRODUCT',
    CONCATENAR: 'CONCAT',
    CONCATENATE: 'CONCAT',
    MINIMO: 'MIN',
    MAXIMO: 'MAX'
  }

  // Get raw cell value by reference (string, sin coerción numérica)
  function getCellRawByRef(ref) {
    const parsed = parseCellRef(ref)
    if (!parsed) return ''
    const val = data.value[parsed.row]?.[parsed.col]
    return val === undefined || val === null ? '' : String(val)
  }

  // Cuenta celdas no vacías de un rango o referencia
  function countNonEmpty(arg) {
    const parts = arg.split(':')
    if (parts.length !== 2) {
      return getCellRawByRef(arg).trim() !== '' ? 1 : 0
    }
    const start = parseCellRef(parts[0])
    const end = parseCellRef(parts[1])
    if (!start || !end) return 0
    let count = 0
    for (let r = Math.min(start.row, end.row); r <= Math.max(start.row, end.row); r++) {
      for (let c = Math.min(start.col, end.col); c <= Math.max(start.col, end.col); c++) {
        const val = data.value[r]?.[c]
        if (val !== '' && val !== undefined && val !== null) count++
      }
    }
    return count
  }

  // Resuelve un argumento a lista de valores numéricos
  function argToValues(arg, visitedCells) {
    if (arg.includes(':')) return parseRange(arg)
    if (/^[A-Z]+\d+$/i.test(arg)) return [getCellValueByRef(arg)]
    const num = parseFloat(arg)
    if (!isNaN(num) && /^-?[\d.]+$/.test(arg.trim())) return [num]
    // Expresión (las funciones anidadas ya fueron sustituidas)
    const result = evaluateExpression(arg, visitedCells)
    const n = parseFloat(result)
    return isNaN(n) ? [] : [n]
  }

  // Resuelve un argumento a string (para CONCAT)
  function argToString(arg, visitedCells) {
    const trimmed = arg.trim()
    if (/^"(.*)"$/.test(trimmed)) return trimmed.slice(1, -1)
    if (/^[A-Z]+\d+$/i.test(trimmed)) return getCellRawByRef(trimmed)
    const result = evaluateExpression(trimmed, visitedCells)
    return String(result)
  }

  // Ejecuta una función de hoja de cálculo (args sin paréntesis anidados)
  function callFunction(name, argsStr, visitedCells) {
    const funcName = FUNC_ALIASES[name.toUpperCase()] || name.toUpperCase()
    const args = parseArgs(argsStr)
    const allValues = () => args.flatMap(a => argToValues(a, visitedCells))

    switch (funcName) {
      case 'SUM':
        return allValues().reduce((a, b) => a + b, 0)
      case 'AVERAGE':
      case 'AVG': {
        const values = allValues()
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
      }
      case 'MIN': {
        const values = allValues()
        return values.length > 0 ? Math.min(...values) : 0
      }
      case 'MAX': {
        const values = allValues()
        return values.length > 0 ? Math.max(...values) : 0
      }
      case 'COUNT':
        return allValues().length
      case 'COUNTA':
        return args.reduce((acc, a) => acc + countNonEmpty(a), 0)
      case 'PRODUCT': {
        const values = allValues()
        return values.length > 0 ? values.reduce((a, b) => a * b, 1) : 0
      }
      case 'ABS': {
        const values = allValues()
        return values.length > 0 ? Math.abs(values[0]) : 0
      }
      case 'ROUND': {
        const values = allValues()
        const num = values[0] || 0
        const decimals = values[1] || 0
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
      }
      case 'SQRT': {
        const values = allValues()
        return values.length > 0 ? Math.sqrt(values[0]) : 0
      }
      case 'POWER':
      case 'POW': {
        const values = allValues()
        return values.length >= 2 ? Math.pow(values[0], values[1]) : 0
      }
      case 'CONCAT':
        return args.map(a => argToString(a, visitedCells)).join('')
      case 'IF': {
        if (args.length >= 2) {
          const condition = evaluateExpression(args[0], visitedCells)
          const isTrue = condition === true || (condition !== false && condition && condition !== 0 && condition !== '0' && condition !== 'FALSE')
          if (isTrue) return evaluateExpression(args[1], visitedCells)
          return args.length >= 3 ? evaluateExpression(args[2], visitedCells) : 0
        }
        return 0
      }
      default:
        return '#NAME?'
    }
  }

  // Sustituye referencias de celda por sus valores
  function substituteRefs(expr, visitedCells) {
    return expr.replace(/\b([A-Z]+\d+)\b/gi, (match) => {
      const cellKey = match.toUpperCase()
      const parsed = parseCellRef(cellKey)
      if (!parsed) return '0'

      if (visitedCells.has(cellKey)) return '#REF!'

      const refFormula = getCellFormula(parsed.row, parsed.col)
      if (refFormula) {
        const branch = new Set(visitedCells)
        branch.add(cellKey)
        const result = evaluateExpression(refFormula, branch)
        const num = parseFloat(result)
        return isNaN(num) ? '0' : String(num)
      }

      return String(getCellValueByRef(match))
    })
  }

  // Evalúa una expresión: funciones (de dentro hacia fuera), refs,
  // aritmética y comparaciones (=, <>, <=, >=, <, >)
  function evaluateExpression(formula, visitedCells = new Set()) {
    if (formula === null || formula === undefined) return ''

    let expr = String(formula).trim()
    if (expr.startsWith('=')) expr = expr.slice(1)
    if (expr === '') return ''

    // Resolver funciones de la más interna hacia fuera
    const fnRe = /([A-Za-z]+)\(([^()]*)\)/
    let guard = 0
    let m
    while ((m = expr.match(fnRe)) && guard++ < 100) {
      const result = callFunction(m[1], m[2], visitedCells)
      if (result === '#NAME?') return '#NAME?'
      expr = expr.slice(0, m.index) + String(result) + expr.slice(m.index + m[0].length)
    }

    // Sustituir referencias de celda
    expr = substituteRefs(expr, visitedCells)
    if (expr.includes('#REF!')) return '#REF!'

    // Comparaciones estilo Excel → JS
    let jsExpr = expr
      .replace(/<>/g, '!==')
      .replace(/(?<![<>!=])=(?!=)/g, '===')

    try {
      if (/^[\d\s+\-*/().<>=!&|]+$/.test(jsExpr)) {
        const result = Function('"use strict"; return (' + jsExpr + ')')()
        if (typeof result === 'boolean') return result
        return isNaN(result) || !isFinite(result) ? '#ERROR!' : result
      }
      // Literal de texto entre comillas: devolver sin comillas
      const strMatch = expr.trim().match(/^"(.*)"$/)
      if (strMatch) return strMatch[1]
      return expr
    } catch (e) {
      return '#ERROR!'
    }
  }

  // API pública (mantiene el nombre histórico)
  function evaluateFormula(formula, visitedCells = new Set()) {
    const result = evaluateExpression(formula, visitedCells)
    if (result === true) return 'TRUE'
    if (result === false) return 'FALSE'
    return result
  }

  // Evalúa la fórmula de una celda protegiendo contra auto-referencia
  function evaluateCellFormula(row, col) {
    const formula = cellFormulas.value[`${row}-${col}`]
    if (!formula) return ''
    const visited = new Set([`${getColumnLabel(col)}${row + 1}`])
    return evaluateFormula(formula, visited)
  }

  // Recalculate all formulas
  function recalculateFormulas() {
    Object.keys(cellFormulas.value).forEach((key) => {
      const [row, col] = key.split('-').map(Number)
      if (!data.value[row]) return
      const result = evaluateCellFormula(row, col)
      data.value[row][col] = String(result)
    })
  }

  // Cell selection and editing
  function selectCell(row, col) {
    selectedCell.value = { row, col }
    selectionAnchor.value = { row, col }
    selectionEnd.value = { row, col }
  }

  function startEdit(row, col) {
    editingCell.value = { row, col }
    // If cell has formula, show the formula for editing
    const formula = getCellFormula(row, col)
    if (formula) {
      editValue.value = '=' + formula
    } else {
      editValue.value = data.value[row][col]
    }
  }

  function finishEdit() {
    if (!editingCell.value) return

    const { row, col } = editingCell.value
    const oldValue = data.value[row][col]
    const newValue = editValue.value

    if (oldValue !== newValue || getCellFormula(row, col)) {
      saveToHistory()

      // Check if it's a formula
      if (newValue && newValue.toString().trim().startsWith('=')) {
        const formula = newValue.trim().slice(1) // Remove leading =
        setCellFormula(row, col, formula)
        // Evaluate (protegido contra auto-referencia) and store result
        data.value[row][col] = String(evaluateCellFormula(row, col))
      } else {
        // Clear any existing formula
        setCellFormula(row, col, null)
        data.value[row][col] = newValue
      }

      // Recalculate dependent formulas
      recalculateFormulas()
    }

    editingCell.value = null
  }

  function cancelEdit() {
    editingCell.value = null
    editValue.value = ''
  }

  // Clipboard operations (soportan rangos: se copia como TSV)
  function snapshotSelection(isCut) {
    const b = selectionBounds.value ||
      (selectedCell.value ? { r1: selectedCell.value.row, r2: selectedCell.value.row, c1: selectedCell.value.col, c2: selectedCell.value.col } : null)
    if (!b) return null

    const matrix = []
    const styles = []
    const formulas = []
    for (let r = b.r1; r <= b.r2; r++) {
      const rowVals = [], rowStyles = [], rowFormulas = []
      for (let c = b.c1; c <= b.c2; c++) {
        rowVals.push(data.value[r]?.[c] ?? '')
        rowStyles.push(JSON.parse(JSON.stringify(getCellStyle(r, c))))
        rowFormulas.push(cellFormulas.value[`${r}-${c}`] || null)
      }
      matrix.push(rowVals)
      styles.push(rowStyles)
      formulas.push(rowFormulas)
    }

    clipboard.value = { matrix, styles, formulas, bounds: { ...b }, isCut }
    const tsv = matrix.map(r => r.join('\t')).join('\n')
    navigator.clipboard?.writeText(tsv).catch(() => {})
    return clipboard.value
  }

  function copyCell() {
    snapshotSelection(false)
  }

  function cutCell() {
    snapshotSelection(true)
  }

  async function pasteCell() {
    if (!selectedCell.value) return

    const { row: startRow, col: startCol } = selectedCell.value

    // Leer texto del portapapeles del sistema (puede venir de Excel como TSV)
    let text = null
    try {
      text = await navigator.clipboard.readText()
    } catch (e) {
      // Sin permiso: usar portapapeles interno
    }

    let matrix
    const internal = clipboard.value
    const internalTsv = internal?.matrix ? internal.matrix.map(r => r.join('\t')).join('\n') : null

    if (text !== null && text !== internalTsv) {
      // Texto externo: parsear TSV/multilínea
      const rows = text.replace(/\r\n?/g, '\n').split('\n')
      if (rows.length > 1 && rows[rows.length - 1] === '') rows.pop()
      matrix = rows.map(r => r.split('\t'))
    } else if (internal?.matrix) {
      matrix = internal.matrix
    } else if (text !== null) {
      matrix = [[text]]
    } else {
      return
    }

    saveToHistory()

    // Expandir la hoja si hace falta
    const neededRows = startRow + matrix.length
    const neededCols = startCol + Math.max(...matrix.map(r => r.length))
    if (neededRows > data.value.length) addRows(neededRows - data.value.length)
    if (neededCols > (data.value[0]?.length || 0)) addColumns(neededCols - (data.value[0]?.length || 0))

    const sameAsInternal = internal?.matrix &&
      matrix.length === internal.matrix.length &&
      matrix[0]?.length === internal.matrix[0]?.length &&
      (text === null || text === internalTsv)

    matrix.forEach((rowVals, dr) => {
      rowVals.forEach((val, dc) => {
        const r = startRow + dr
        const c = startCol + dc
        if (!data.value[r] || c >= data.value[r].length) return

        const key = getCellStyleKey(r, c)
        if (sameAsInternal) {
          const style = internal.styles?.[dr]?.[dc]
          if (style && Object.keys(style).length > 0) {
            cellStyles.value[key] = JSON.parse(JSON.stringify(style))
          }
          const formula = internal.formulas?.[dr]?.[dc]
          if (formula) {
            cellFormulas.value[`${r}-${c}`] = formula
            data.value[r][c] = String(evaluateCellFormula(r, c))
            return
          }
          delete cellFormulas.value[`${r}-${c}`]
        } else {
          delete cellFormulas.value[`${r}-${c}`]
        }
        data.value[r][c] = val
      })
    })

    // Vaciar origen si era cortar
    if (sameAsInternal && internal.isCut && internal.bounds) {
      const b = internal.bounds
      for (let r = b.r1; r <= b.r2; r++) {
        for (let c = b.c1; c <= b.c2; c++) {
          if (data.value[r]) data.value[r][c] = ''
          delete cellStyles.value[getCellStyleKey(r, c)]
          delete cellFormulas.value[`${r}-${c}`]
        }
      }
      clipboard.value = null
    }

    recalculateFormulas()
  }

  function clearCell() {
    if (!selectedCell.value && !selectionBounds.value) return

    saveToHistory()
    forEachSelectedCell((r, c) => {
      if (data.value[r]) data.value[r][c] = ''
      delete cellFormulas.value[`${r}-${c}`]
    })
    recalculateFormulas()
  }

  // Style operations — se aplican a toda la selección (rango o celda única)
  function applyToSelection(fn) {
    const cell = editingCell.value || selectedCell.value
    if (!cell && !selectionBounds.value) return false

    saveToHistory()
    forEachSelectedCell((r, c) => {
      const key = getCellStyleKey(r, c)
      if (!cellStyles.value[key]) cellStyles.value[key] = {}
      fn(cellStyles.value[key], r, c)
    })
    return true
  }

  function setCellStyle(property, value) {
    applyToSelection((style) => {
      if (value === null || value === undefined) {
        delete style[property]
      } else {
        style[property] = value
      }
    })
  }

  function toggleCellStyle(property) {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return
    // El estado objetivo se decide por la celda activa para uniformar el rango
    const target = !getCellStyle(cell.row, cell.col)[property]
    applyToSelection((style) => {
      style[property] = target
    })
  }

  function setBorders(preset) {
    const borderConfigs = {
      'none': { top: false, right: false, bottom: false, left: false },
      'all': { top: true, right: true, bottom: true, left: true },
      'bottom': { top: false, right: false, bottom: true, left: false },
      'top-bottom': { top: true, right: false, bottom: true, left: false },
      'left-right': { top: false, right: true, bottom: false, left: true }
    }
    const config = borderConfigs[preset] || borderConfigs['none']
    applyToSelection((style) => {
      style.borders = { ...config }
    })
  }

  function setAlignment(type, value) {
    applyToSelection((style) => {
      if (type === 'horizontal') style.alignH = value
      else if (type === 'vertical') style.alignV = value
    })
  }

  function setFontSize(size) {
    applyToSelection((style) => {
      style.fontSize = size
    })
  }

  function setNumberFormat(format) {
    applyToSelection((style) => {
      if (format === 'General') delete style.numFmt
      else style.numFmt = format
    })
  }

  function toggleWrapText() {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return
    const target = !getCellStyle(cell.row, cell.col).wrapText
    applyToSelection((style) => {
      style.wrapText = target
    })
  }

  // ============ FORMATO COMO TABLA ============
  function formatAsTable(presetId, options = {}) {
    const b = selectionBounds.value
    if (!b || b.r1 === b.r2) return false // requiere al menos cabecera + 1 fila

    const preset = TABLE_PRESETS.find(p => p.id === presetId) || TABLE_PRESETS[0]
    const { zebra = true } = options

    saveToHistory()

    for (let r = b.r1; r <= b.r2; r++) {
      for (let c = b.c1; c <= b.c2; c++) {
        const key = getCellStyleKey(r, c)
        const style = { ...(cellStyles.value[key] || {}) }

        if (r === b.r1) {
          // Fila de cabecera
          style.bold = true
          style.bgColor = preset.header
          style.textColor = preset.headerText
        } else {
          // Filas de datos: zebra en filas alternas
          const dataIndex = r - b.r1 - 1
          if (zebra && dataIndex % 2 === 1) {
            style.bgColor = preset.zebra
          } else {
            delete style.bgColor
          }
          if (style.textColor === preset.headerText) delete style.textColor
          style.bold = false
        }

        // Separadores horizontales sutiles
        style.borders = { ...(style.borders || {}), bottom: true }

        cellStyles.value[key] = style
      }
    }
    return true
  }

  // ============ FILTROS POR COLUMNA ============
  const filtersEnabled = ref(false)
  const columnFilters = ref({})

  const hasActiveFilters = computed(() =>
    filtersEnabled.value && Object.keys(columnFilters.value).length > 0
  )

  function toggleFilters() {
    filtersEnabled.value = !filtersEnabled.value
    if (!filtersEnabled.value) columnFilters.value = {}
  }

  function setColumnFilter(col, text) {
    const next = { ...columnFilters.value }
    if (text && text.trim() !== '') {
      next[col] = text
    } else {
      delete next[col]
    }
    columnFilters.value = next
  }

  function clearFilters() {
    columnFilters.value = {}
  }

  // La fila 1 se trata como cabecera y nunca se oculta
  function isRowVisible(rowIndex) {
    if (!hasActiveFilters.value) return true
    if (rowIndex === 0) return true
    for (const [col, text] of Object.entries(columnFilters.value)) {
      const val = String(data.value[rowIndex]?.[col] ?? '').toLowerCase()
      if (!val.includes(String(text).toLowerCase())) return false
    }
    return true
  }

  const visibleRowCount = computed(() => {
    if (!hasActiveFilters.value) return data.value.length
    let n = 0
    for (let i = 0; i < data.value.length; i++) {
      if (isRowVisible(i)) n++
    }
    return n
  })

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

    // Font size
    if (style.fontSize) {
      computed.fontSize = style.fontSize + 'px'
    }

    // Underline and strikethrough
    const textDecorations = []
    if (style.underline) textDecorations.push('underline')
    if (style.strikethrough) textDecorations.push('line-through')
    if (textDecorations.length > 0) {
      computed.textDecoration = textDecorations.join(' ')
    }

    // Horizontal alignment
    if (style.alignH) {
      const alignMap = { left: 'left', center: 'center', right: 'right', justify: 'justify' }
      computed.textAlign = alignMap[style.alignH] || 'left'
    }

    // Vertical alignment
    if (style.alignV) {
      const vAlignMap = { top: 'flex-start', middle: 'center', bottom: 'flex-end' }
      computed.alignItems = vAlignMap[style.alignV] || 'center'
      computed.display = 'flex'
    }

    // Text wrapping
    if (style.wrapText) {
      computed.whiteSpace = 'pre-wrap'
      computed.wordBreak = 'break-word'
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
        if (row > 0) selectCell(row - 1, col)
        break
      case 'down':
        if (row < maxRow) selectCell(row + 1, col)
        break
      case 'left':
        if (col > 0) selectCell(row, col - 1)
        break
      case 'right':
        if (col < maxCol) selectCell(row, col + 1)
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
    setAlignment,
    setFontSize,
    setNumberFormat,
    toggleWrapText,
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
    getRowHeight,

    // Sheet management
    addSheet,
    renameSheet,
    deleteSheet,
    duplicateSheet,

    // Formula management
    cellFormulas,
    getCellFormula,
    setCellFormula,
    hasFormula,
    getCellDisplayValue,
    evaluateFormula,
    evaluateCellFormula,
    recalculateFormulas,

    // Range selection
    selectionAnchor,
    selectionEnd,
    isSelecting,
    selectionBounds,
    hasMultiSelection,
    selectionStats,
    startSelection,
    extendSelection,
    extendSelectionTo,
    endSelection,
    isCellInSelection,
    forEachSelectedCell,

    // Table formatting
    formatAsTable,

    // Column filters
    filtersEnabled,
    columnFilters,
    hasActiveFilters,
    toggleFilters,
    setColumnFilter,
    clearFilters,
    isRowVisible,
    visibleRowCount
  }
}
