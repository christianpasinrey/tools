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

  function setAlignment(type, value) {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return

    saveToHistory()
    const key = getCellStyleKey(cell.row, cell.col)

    if (!cellStyles.value[key]) {
      cellStyles.value[key] = {}
    }

    if (type === 'horizontal') {
      cellStyles.value[key].alignH = value
    } else if (type === 'vertical') {
      cellStyles.value[key].alignV = value
    }
  }

  function setFontSize(size) {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return

    saveToHistory()
    const key = getCellStyleKey(cell.row, cell.col)

    if (!cellStyles.value[key]) {
      cellStyles.value[key] = {}
    }

    cellStyles.value[key].fontSize = size
  }

  function setNumberFormat(format) {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return

    saveToHistory()
    const key = getCellStyleKey(cell.row, cell.col)

    if (!cellStyles.value[key]) {
      cellStyles.value[key] = {}
    }

    if (format === 'General') {
      delete cellStyles.value[key].numFmt
    } else {
      cellStyles.value[key].numFmt = format
    }
  }

  function toggleWrapText() {
    const cell = editingCell.value || selectedCell.value
    if (!cell) return

    saveToHistory()
    const key = getCellStyleKey(cell.row, cell.col)

    if (!cellStyles.value[key]) {
      cellStyles.value[key] = {}
    }

    cellStyles.value[key].wrapText = !cellStyles.value[key].wrapText
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
    getCellDisplayValue
  }
}
