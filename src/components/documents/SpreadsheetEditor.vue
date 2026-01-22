<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useSpreadsheet, TEXT_COLORS, BG_COLORS, BORDER_PRESETS, FONT_SIZES, NUMBER_FORMATS, isDark, toggleDark } from '../../composables/useSpreadsheet'

// Dropdown state for toolbar menus
const showFontSizeDropdown = ref(false)
const showNumberFormatDropdown = ref(false)
const showTextColorDropdown = ref(false)
const showBgColorDropdown = ref(false)
const showBorderDropdown = ref(false)
const showRowColDropdown = ref(false)

const closeAllDropdowns = () => {
  showFontSizeDropdown.value = false
  showNumberFormatDropdown.value = false
  showTextColorDropdown.value = false
  showBgColorDropdown.value = false
  showBorderDropdown.value = false
  showRowColDropdown.value = false
}

const props = defineProps({
  themeColor: {
    type: String,
    default: '#22c55e'
  }
})

const spreadsheet = useSpreadsheet()
const fileInputRef = ref(null)
const editTextareaRef = ref(null)
const gridContainerRef = ref(null)
const formulaBarRef = ref(null)
const formulaBarValue = ref('')
const isEditingFormulaBar = ref(false)

// Sheet management state
const renamingSheetIndex = ref(null)
const renamingSheetName = ref('')
const sheetNameInputRef = ref(null)
const sheetContextMenu = ref({ visible: false, x: 0, y: 0, index: null })

// Initialize
onMounted(() => {
  spreadsheet.initEmptySheet()
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('mousemove', handleColumnResize)
  document.removeEventListener('mouseup', stopColumnResize)
  document.removeEventListener('mousemove', handleRowResize)
  document.removeEventListener('mouseup', stopRowResize)
})

// Global click handler
const handleGlobalClick = () => {
  spreadsheet.closeContextMenu()
  closeSheetContextMenu()
  closeAllDropdowns()
}

// File handling
const openFilePicker = () => fileInputRef.value?.click()

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (file) {
    await spreadsheet.loadFile(file)
  }
  e.target.value = ''
}

// Handle scroll for infinite expansion
const handleGridScroll = (e) => {
  const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = e.target
  spreadsheet.checkExpandColumns(scrollLeft, scrollWidth, clientWidth)
  spreadsheet.checkExpandRows(scrollTop, scrollHeight, clientHeight)
}

// Column resize handling
const resizingColumn = ref(null)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

// Row resize handling
const resizingRow = ref(null)
const resizeStartY = ref(0)
const resizeRowStartHeight = ref(0)

const startColumnResize = (e, colIndex) => {
  e.preventDefault()
  resizingColumn.value = colIndex
  resizeStartX.value = e.clientX
  resizeStartWidth.value = spreadsheet.getColumnWidth(colIndex)

  document.addEventListener('mousemove', handleColumnResize)
  document.addEventListener('mouseup', stopColumnResize)
}

const handleColumnResize = (e) => {
  if (resizingColumn.value === null) return

  const diff = e.clientX - resizeStartX.value
  const newWidth = Math.max(50, resizeStartWidth.value + diff)
  spreadsheet.setColumnWidth(resizingColumn.value, newWidth)
}

const stopColumnResize = () => {
  resizingColumn.value = null
  document.removeEventListener('mousemove', handleColumnResize)
  document.removeEventListener('mouseup', stopColumnResize)
}

// Row resize handling
const startRowResize = (e, rowIndex) => {
  e.preventDefault()
  resizingRow.value = rowIndex
  resizeStartY.value = e.clientY
  resizeRowStartHeight.value = spreadsheet.getRowHeight(rowIndex)

  document.addEventListener('mousemove', handleRowResize)
  document.addEventListener('mouseup', stopRowResize)
}

const handleRowResize = (e) => {
  if (resizingRow.value === null) return

  const diff = e.clientY - resizeStartY.value
  const newHeight = Math.max(20, resizeRowStartHeight.value + diff)
  spreadsheet.setRowHeight(resizingRow.value, newHeight)
}

const stopRowResize = () => {
  resizingRow.value = null
  document.removeEventListener('mousemove', handleRowResize)
  document.removeEventListener('mouseup', stopRowResize)
}

// Formula bar handling
const updateFormulaBarValue = () => {
  if (!spreadsheet.selectedCell.value) {
    formulaBarValue.value = ''
    return
  }
  const { row, col } = spreadsheet.selectedCell.value
  // Show formula if exists, otherwise show value
  const formula = spreadsheet.getCellFormula(row, col)
  formulaBarValue.value = formula ? '=' + formula : (spreadsheet.data.value[row]?.[col] || '')
}

const startFormulaBarEdit = () => {
  isEditingFormulaBar.value = true
  updateFormulaBarValue()
  nextTick(() => formulaBarRef.value?.focus())
}

const finishFormulaBarEdit = () => {
  if (!spreadsheet.selectedCell.value || !isEditingFormulaBar.value) return

  const { row, col } = spreadsheet.selectedCell.value
  const value = formulaBarValue.value

  spreadsheet.saveToHistory()

  if (value.startsWith('=')) {
    // It's a formula
    spreadsheet.setCellFormula(row, col, value)
    // For now, store the formula text as display (Excel would calculate)
    spreadsheet.data.value[row][col] = value
  } else {
    // Regular value - remove any existing formula
    spreadsheet.setCellFormula(row, col, null)
    spreadsheet.data.value[row][col] = value
  }

  isEditingFormulaBar.value = false
}

const cancelFormulaBarEdit = () => {
  isEditingFormulaBar.value = false
  updateFormulaBarValue()
}

const handleFormulaBarKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    finishFormulaBarEdit()
    spreadsheet.moveSelection('down')
    updateFormulaBarValue()
  } else if (e.key === 'Escape') {
    cancelFormulaBarEdit()
  } else if (e.key === 'Tab') {
    e.preventDefault()
    finishFormulaBarEdit()
    spreadsheet.moveSelection('right')
    updateFormulaBarValue()
  }
}

// Watch for cell selection changes to update formula bar
const originalSelectCell = spreadsheet.selectCell
spreadsheet.selectCell = (row, col) => {
  originalSelectCell(row, col)
  updateFormulaBarValue()
}

// Sheet management functions
const openSheetContextMenu = (e, index) => {
  sheetContextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    index
  }
}

const closeSheetContextMenu = () => {
  sheetContextMenu.value.visible = false
}

const startRenameSheet = async (index) => {
  renamingSheetIndex.value = index
  renamingSheetName.value = spreadsheet.sheets.value[index].name
  await nextTick()
  // Focus might need a slight delay
  setTimeout(() => {
    const inputs = document.querySelectorAll('input[type="text"]')
    inputs.forEach(input => {
      if (input.value === renamingSheetName.value) {
        input.focus()
        input.select()
      }
    })
  }, 50)
}

const finishRenameSheet = () => {
  if (renamingSheetIndex.value !== null && renamingSheetName.value.trim()) {
    spreadsheet.renameSheet(renamingSheetIndex.value, renamingSheetName.value.trim())
  }
  renamingSheetIndex.value = null
  renamingSheetName.value = ''
}

const cancelRenameSheet = () => {
  renamingSheetIndex.value = null
  renamingSheetName.value = ''
}

const confirmDeleteSheet = (index) => {
  const sheetName = spreadsheet.sheets.value[index].name
  if (confirm(`¿Eliminar la hoja "${sheetName}"?`)) {
    spreadsheet.deleteSheet(index)
  }
}

const hasContent = () => {
  // Check if there's any content in the spreadsheet
  return spreadsheet.data.value.some(row => row.some(cell => cell && cell.trim() !== ''))
}

const newDocument = () => {
  if (hasContent()) {
    if (confirm('¿Crear un nuevo documento? Se perderán los cambios no guardados.')) {
      spreadsheet.initEmptySheet()
    }
  } else {
    spreadsheet.initEmptySheet()
  }
}

// Cell editing
const startEditCell = async (row, col) => {
  spreadsheet.startEdit(row, col)
  await nextTick()
  editTextareaRef.value?.focus()
}

const handleCellKeydown = (e) => {
  // Shift+Enter for newline
  if (e.key === 'Enter' && e.shiftKey) {
    return // Allow default textarea behavior
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    spreadsheet.finishEdit()
    if (spreadsheet.selectedCell.value) {
      spreadsheet.moveSelection('down')
    }
  } else if (e.key === 'Escape') {
    spreadsheet.cancelEdit()
  } else if (e.key === 'Tab') {
    e.preventDefault()
    spreadsheet.finishEdit()
    spreadsheet.moveSelection('right')
  }

  // Format shortcuts while editing
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
    spreadsheet.toggleCellStyle('bold')
  }
  if (e.ctrlKey && e.key === 'i') {
    e.preventDefault()
    spreadsheet.toggleCellStyle('italic')
  }
}

// Global keyboard handler
const handleGlobalKeydown = (e) => {
  // Skip if editing
  if (spreadsheet.editingCell.value) return

  // Undo/Redo
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    spreadsheet.undo()
  }
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
    e.preventDefault()
    spreadsheet.redo()
  }

  // Cell operations
  if (spreadsheet.selectedCell.value) {
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      spreadsheet.copyCell()
    }
    if (e.ctrlKey && e.key === 'x') {
      e.preventDefault()
      spreadsheet.cutCell()
    }
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault()
      spreadsheet.pasteCell()
    }
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      spreadsheet.toggleCellStyle('bold')
    }
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault()
      spreadsheet.toggleCellStyle('italic')
    }
    if (e.key === 'Delete') {
      e.preventDefault()
      spreadsheet.clearCell()
    }

    // Navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      spreadsheet.moveSelection('up')
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      spreadsheet.moveSelection('down')
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      spreadsheet.moveSelection('left')
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      spreadsheet.moveSelection('right')
    }

    // Enter or F2 to edit
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault()
      startEditCell(spreadsheet.selectedCell.value.row, spreadsheet.selectedCell.value.col)
    }
  }
}

// Context menu actions
const handleContextAction = (action) => {
  switch (action) {
    case 'copy': spreadsheet.copyCell(); break
    case 'cut': spreadsheet.cutCell(); break
    case 'paste': spreadsheet.pasteCell(); break
    case 'clear': spreadsheet.clearCell(); break
    case 'insertRowAbove': spreadsheet.insertRowAbove(); break
    case 'insertRowBelow': spreadsheet.insertRowBelow(); break
    case 'deleteRow': spreadsheet.deleteRow(); break
    case 'insertColumnLeft': spreadsheet.insertColumnLeft(); break
    case 'insertColumnRight': spreadsheet.insertColumnRight(); break
    case 'deleteColumn': spreadsheet.deleteColumn(); break
  }
  spreadsheet.closeContextMenu()
}
</script>

<template>
  <div class="h-full flex flex-col" :class="isDark ? 'bg-neutral-950' : 'bg-gray-100'">
    <!-- Toolbar -->
    <div class="h-11 border-b flex items-center px-2 gap-1 shrink-0" :class="isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'">
      <!-- File actions -->
      <div class="flex items-center gap-1 pr-2 border-r" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click="newDocument"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'"
          title="Nuevo documento"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span>Nuevo</span>
        </button>

        <button
          @click="openFilePicker"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'"
          title="Abrir archivo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <span>Abrir</span>
        </button>
      </div>

      <!-- Undo/Redo -->
      <div class="flex items-center gap-1 pr-2 border-r" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click="spreadsheet.undo"
          :disabled="!spreadsheet.canUndo.value"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.canUndo.value
            ? (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
            : (isDark ? 'text-neutral-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')"
          title="Deshacer (Ctrl+Z)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
          </svg>
        </button>
        <button
          @click="spreadsheet.redo"
          :disabled="!spreadsheet.canRedo.value"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.canRedo.value
            ? (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
            : (isDark ? 'text-neutral-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')"
          title="Rehacer (Ctrl+Y)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
          </svg>
        </button>
      </div>

      <!-- Clipboard -->
      <div class="flex items-center gap-1 pr-2 border-r" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click="spreadsheet.copyCell"
          :disabled="!spreadsheet.selectedCell.value"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.selectedCell.value
            ? (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
            : (isDark ? 'text-neutral-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')"
          title="Copiar (Ctrl+C)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
        <button
          @click="spreadsheet.cutCell"
          :disabled="!spreadsheet.selectedCell.value"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.selectedCell.value
            ? (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
            : (isDark ? 'text-neutral-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')"
          title="Cortar (Ctrl+X)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>
          </svg>
        </button>
        <button
          @click="spreadsheet.pasteCell"
          :disabled="!spreadsheet.selectedCell.value"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.selectedCell.value
            ? (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')
            : (isDark ? 'text-neutral-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed')"
          title="Pegar (Ctrl+V)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </button>
      </div>

      <!-- Format - Font Size -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-1 pr-2 border-r relative" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click.stop="showFontSizeDropdown = !showFontSizeDropdown; showTextColorDropdown = false; showBgColorDropdown = false; showBorderDropdown = false; showNumberFormatDropdown = false; showRowColDropdown = false"
          class="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors min-w-[48px] justify-between"
          :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
          title="Tamaño de fuente"
        >
          <span>{{ spreadsheet.currentCellStyle.value.fontSize || 12 }}</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <!-- Font Size Dropdown -->
        <div
          v-if="showFontSizeDropdown"
          class="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto border"
          :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
          @click.stop
        >
          <button
            v-for="size in FONT_SIZES"
            :key="size"
            @click="spreadsheet.setFontSize(size); showFontSizeDropdown = false"
            class="w-full px-4 py-1 text-xs text-left hover:bg-opacity-10"
            :class="[
              isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100',
              spreadsheet.currentCellStyle.value.fontSize === size ? (isDark ? 'bg-neutral-800' : 'bg-gray-100') : ''
            ]"
          >{{ size }}</button>
        </div>
      </div>

      <!-- Format - Text Style -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-0.5 pr-2 border-r" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click="spreadsheet.toggleCellStyle('bold')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.bold
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Negrita (Ctrl+B)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"/></svg>
        </button>
        <button
          @click="spreadsheet.toggleCellStyle('italic')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.italic
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Cursiva (Ctrl+I)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4h4l-2 16h-4l2-16z"/></svg>
        </button>
        <button
          @click="spreadsheet.toggleCellStyle('underline')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.underline
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Subrayado (Ctrl+U)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 21h12v-2H6v2zM12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6z"/></svg>
        </button>
        <button
          @click="spreadsheet.toggleCellStyle('strikethrough')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.strikethrough
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Tachado"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>
        </button>
      </div>

      <!-- Format - Colors -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-0.5 pr-2 border-r relative" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <!-- Text Color -->
        <button
          @click.stop="showTextColorDropdown = !showTextColorDropdown; showBgColorDropdown = false; showFontSizeDropdown = false; showBorderDropdown = false; showNumberFormatDropdown = false; showRowColDropdown = false"
          class="p-1.5 rounded transition-colors flex flex-col items-center"
          :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
          title="Color de texto"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11 2L5.5 16h2.25l1.12-3h6.25l1.12 3h2.25L13 2h-2zm-1.38 9L12 4.67 14.38 11H9.62z"/></svg>
          <div class="w-4 h-1 rounded-sm mt-0.5" :style="{ backgroundColor: spreadsheet.currentCellStyle.value.textColor || (isDark ? '#d4d4d4' : '#171717') }"></div>
        </button>
        <!-- Text Color Dropdown -->
        <div
          v-if="showTextColorDropdown"
          class="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-xl z-50 border"
          :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
          @click.stop
        >
          <div class="grid grid-cols-6 gap-1">
            <button
              v-for="color in TEXT_COLORS"
              :key="'tc-' + color"
              @click="spreadsheet.setCellStyle('textColor', color); showTextColorDropdown = false"
              class="w-6 h-6 rounded border transition-transform hover:scale-110"
              :class="isDark ? 'border-neutral-600' : 'border-gray-300'"
              :style="{ backgroundColor: color }"
            />
          </div>
        </div>

        <!-- Background Color -->
        <button
          @click.stop="showBgColorDropdown = !showBgColorDropdown; showTextColorDropdown = false; showFontSizeDropdown = false; showBorderDropdown = false; showNumberFormatDropdown = false; showRowColDropdown = false"
          class="p-1.5 rounded transition-colors flex flex-col items-center"
          :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
          title="Color de fondo"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/></svg>
          <div class="w-4 h-1 rounded-sm mt-0.5" :style="{ backgroundColor: spreadsheet.currentCellStyle.value.bgColor || 'transparent' }" :class="!spreadsheet.currentCellStyle.value.bgColor ? (isDark ? 'border border-neutral-600' : 'border border-gray-300') : ''"></div>
        </button>
        <!-- Background Color Dropdown -->
        <div
          v-if="showBgColorDropdown"
          class="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-xl z-50 border"
          :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
          @click.stop
        >
          <div class="grid grid-cols-5 gap-1">
            <button
              v-for="color in BG_COLORS"
              :key="'bg-' + color"
              @click="spreadsheet.setCellStyle('bgColor', color); showBgColorDropdown = false"
              class="w-6 h-6 rounded border transition-transform hover:scale-110"
              :class="isDark ? 'border-neutral-600' : 'border-gray-300'"
              :style="{ backgroundColor: color }"
            />
            <button
              @click="spreadsheet.setCellStyle('bgColor', null); showBgColorDropdown = false"
              class="w-6 h-6 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Sin fondo"
            >
              <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Format - Alignment -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-0.5 pr-2 border-r" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <!-- Horizontal Alignment -->
        <button
          @click="spreadsheet.setAlignment('horizontal', 'left')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.alignH === 'left'
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Alinear izquierda"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          @click="spreadsheet.setAlignment('horizontal', 'center')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.alignH === 'center'
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Centrar"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          @click="spreadsheet.setAlignment('horizontal', 'right')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.alignH === 'right'
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Alinear derecha"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
        </button>
        <div class="w-px h-5 mx-0.5" :class="isDark ? 'bg-neutral-700' : 'bg-gray-200'"></div>
        <!-- Vertical Alignment -->
        <button
          @click="spreadsheet.setAlignment('vertical', 'top')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.alignV === 'top'
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Alinear arriba"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z"/></svg>
        </button>
        <button
          @click="spreadsheet.setAlignment('vertical', 'middle')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.alignV === 'middle'
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Centrar verticalmente"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 19h3v4h2v-4h3l-4-4-4 4zm8-14h-3V1h-2v4H8l4 4 4-4zM4 11v2h16v-2H4z"/></svg>
        </button>
        <button
          @click="spreadsheet.setAlignment('vertical', 'bottom')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.alignV === 'bottom'
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Alinear abajo"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z"/></svg>
        </button>
      </div>

      <!-- Format - Wrap & Borders -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-0.5 pr-2 border-r relative" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click="spreadsheet.toggleWrapText()"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.wrapText
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Ajustar texto"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 19h6v-2H4v2zM20 5H4v2h16V5zm-3 6H4v2h13.25c1.1 0 2 .9 2 2s-.9 2-2 2H15v-2l-3 3 3 3v-2h2c2.21 0 4-1.79 4-4s-1.79-4-4-4z"/></svg>
        </button>
        <button
          @click.stop="showBorderDropdown = !showBorderDropdown; showTextColorDropdown = false; showBgColorDropdown = false; showFontSizeDropdown = false; showNumberFormatDropdown = false; showRowColDropdown = false"
          class="p-1.5 rounded transition-colors"
          :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
          title="Bordes"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/></svg>
        </button>
        <!-- Borders Dropdown -->
        <div
          v-if="showBorderDropdown"
          class="absolute top-full left-0 mt-1 p-2 rounded-lg shadow-xl z-50 border"
          :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
          @click.stop
        >
          <div class="flex gap-1">
            <button
              @click="spreadsheet.setBorders('none'); showBorderDropdown = false"
              class="w-8 h-8 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Sin borde"
            >
              <svg class="w-5 h-5" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            <button
              @click="spreadsheet.setBorders('all'); showBorderDropdown = false"
              class="w-8 h-8 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Todos los bordes"
            >
              <div class="w-4 h-4 border-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
            <button
              @click="spreadsheet.setBorders('bottom'); showBorderDropdown = false"
              class="w-8 h-8 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Borde inferior"
            >
              <div class="w-4 h-4 border-b-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
            <button
              @click="spreadsheet.setBorders('top-bottom'); showBorderDropdown = false"
              class="w-8 h-8 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Bordes arriba/abajo"
            >
              <div class="w-4 h-4 border-t-2 border-b-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
            <button
              @click="spreadsheet.setBorders('left-right'); showBorderDropdown = false"
              class="w-8 h-8 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Bordes izq/der"
            >
              <div class="w-4 h-4 border-l-2 border-r-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Format - Number Format -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-0.5 pr-2 border-r relative" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click.stop="showNumberFormatDropdown = !showNumberFormatDropdown; showTextColorDropdown = false; showBgColorDropdown = false; showFontSizeDropdown = false; showBorderDropdown = false; showRowColDropdown = false"
          class="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
          :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
          title="Formato de número"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 17h2v-7h-2v7zm12-7v7h2v-4h2v-3h-4zm-6 7h2V7H7v2h2v8zM3 9h4V7H3v2z"/><path d="M17 7v2h2v-2h-2z"/></svg>
          <span>123</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <!-- Number Format Dropdown -->
        <div
          v-if="showNumberFormatDropdown"
          class="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[140px] border"
          :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
          @click.stop
        >
          <button
            v-for="fmt in NUMBER_FORMATS"
            :key="fmt.id"
            @click="spreadsheet.setNumberFormat(fmt.format); showNumberFormatDropdown = false"
            class="w-full px-4 py-1.5 text-xs text-left"
            :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'"
          >{{ fmt.name }}</button>
        </div>
      </div>

      <!-- Row/Column Operations -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-0.5 pr-2 border-r relative" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click.stop="showRowColDropdown = !showRowColDropdown; showTextColorDropdown = false; showBgColorDropdown = false; showFontSizeDropdown = false; showBorderDropdown = false; showNumberFormatDropdown = false"
          class="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
          :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
          title="Insertar/Eliminar filas y columnas"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M3 14h18M10 3v18M14 3v18"/></svg>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <!-- Row/Column Dropdown -->
        <div
          v-if="showRowColDropdown"
          class="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[180px] border"
          :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
          @click.stop
        >
          <div class="px-3 py-1 text-[10px] uppercase font-medium" :class="isDark ? 'text-neutral-500' : 'text-gray-400'">Filas</div>
          <button
            @click="spreadsheet.insertRowAbove(); showRowColDropdown = false"
            class="w-full px-4 py-1.5 text-xs text-left flex items-center gap-2"
            :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19V5m0 0l-4 4m4-4l4 4"/></svg>
            Insertar fila arriba
          </button>
          <button
            @click="spreadsheet.insertRowBelow(); showRowColDropdown = false"
            class="w-full px-4 py-1.5 text-xs text-left flex items-center gap-2"
            :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 5v14m0 0l4-4m-4 4l-4-4"/></svg>
            Insertar fila abajo
          </button>
          <button
            @click="spreadsheet.deleteRow(); showRowColDropdown = false"
            class="w-full px-4 py-1.5 text-xs text-left flex items-center gap-2"
            :class="isDark ? 'text-red-400 hover:bg-neutral-800' : 'text-red-600 hover:bg-gray-100'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 12H4"/></svg>
            Eliminar fila
          </button>
          <div class="my-1 border-t" :class="isDark ? 'border-neutral-700' : 'border-gray-200'"></div>
          <div class="px-3 py-1 text-[10px] uppercase font-medium" :class="isDark ? 'text-neutral-500' : 'text-gray-400'">Columnas</div>
          <button
            @click="spreadsheet.insertColumnLeft(); showRowColDropdown = false"
            class="w-full px-4 py-1.5 text-xs text-left flex items-center gap-2"
            :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 12H5m0 0l4-4m-4 4l4 4"/></svg>
            Insertar columna izquierda
          </button>
          <button
            @click="spreadsheet.insertColumnRight(); showRowColDropdown = false"
            class="w-full px-4 py-1.5 text-xs text-left flex items-center gap-2"
            :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14m0 0l-4-4m4 4l-4 4"/></svg>
            Insertar columna derecha
          </button>
          <button
            @click="spreadsheet.deleteColumn(); showRowColDropdown = false"
            class="w-full px-4 py-1.5 text-xs text-left flex items-center gap-2"
            :class="isDark ? 'text-red-400 hover:bg-neutral-800' : 'text-red-600 hover:bg-gray-100'"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16"/></svg>
            Eliminar columna
          </button>
        </div>
      </div>

      <!-- Export -->
      <div class="flex items-center gap-1 pr-2 border-r" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click="spreadsheet.exportXlsx"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          title="Exportar como XLSX"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>XLSX</span>
        </button>
        <button
          @click="spreadsheet.exportCsv"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors"
          :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
          title="Exportar como CSV"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          <span>CSV</span>
        </button>
      </div>

      <!-- Cell reference -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-2 px-2 text-xs">
        <span class="font-mono px-2 py-1 rounded" :class="isDark ? 'text-neutral-500 bg-neutral-800' : 'text-gray-600 bg-gray-100'">
          {{ spreadsheet.currentCellRef.value }}
        </span>
        <span class="truncate max-w-[200px]" :class="isDark ? 'text-neutral-400' : 'text-gray-500'">
          {{ spreadsheet.currentCellValue.value }}
        </span>
      </div>

      <div class="flex-1"></div>

      <!-- Dimensions info -->
      <div class="flex items-center gap-2 px-2 text-[10px]" :class="isDark ? 'text-neutral-600' : 'text-gray-400'">
        <span>{{ spreadsheet.data.value.length }} filas</span>
        <span>×</span>
        <span>{{ spreadsheet.data.value[0]?.length || 0 }} cols</span>
        <button
          @click="spreadsheet.addColumns(26)"
          class="px-1.5 py-0.5 rounded text-[10px] transition-colors"
          :class="isDark ? 'hover:bg-neutral-800 hover:text-neutral-400' : 'hover:bg-gray-100 hover:text-gray-600'"
          title="Añadir 26 columnas (A-Z)"
        >
          +cols
        </button>
      </div>

      <div v-if="spreadsheet.fileName.value" class="px-3 text-xs truncate max-w-xs" :class="isDark ? 'text-neutral-500' : 'text-gray-500'">
        {{ spreadsheet.fileName.value }}
      </div>

      <!-- Theme Toggle -->
      <button
        @click="toggleDark()"
        class="p-1.5 rounded transition-colors"
        :class="isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'"
        :title="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
      >
        <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      </button>
    </div>

    <!-- Formula Bar -->
    <div class="h-8 border-b flex items-center px-2 gap-2 shrink-0" :class="isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'">
      <!-- Cell Reference -->
      <div
        class="w-16 h-6 flex items-center justify-center text-xs font-mono font-medium rounded border"
        :class="isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-white border-gray-300 text-gray-700'"
      >
        {{ spreadsheet.currentCellRef.value || 'A1' }}
      </div>

      <!-- Function icon -->
      <div class="flex items-center justify-center w-6 h-6" :class="isDark ? 'text-neutral-500' : 'text-gray-400'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.871 4A17.926 17.926 0 003 12c0 2.874.673 5.59 1.871 8m14.258 0A17.926 17.926 0 0021 12c0-2.874-.673-5.59-1.871-8M9 9h1.246a1 1 0 01.961.725l1.586 5.55a1 1 0 00.961.725H15m-6 4h6"/>
        </svg>
      </div>

      <!-- Formula/Value Input -->
      <input
        ref="formulaBarRef"
        v-model="formulaBarValue"
        type="text"
        class="flex-1 h-6 px-2 text-sm font-mono rounded border outline-none transition-colors"
        :class="[
          isDark
            ? 'bg-neutral-800 border-neutral-700 text-neutral-200 focus:border-neutral-500 placeholder-neutral-600'
            : 'bg-white border-gray-300 text-gray-800 focus:border-gray-400 placeholder-gray-400',
          spreadsheet.hasFormula(spreadsheet.selectedCell.value?.row, spreadsheet.selectedCell.value?.col)
            ? 'text-blue-500'
            : ''
        ]"
        :placeholder="spreadsheet.selectedCell.value ? 'Introduce valor o fórmula (=SUM, =IF...)' : 'Selecciona una celda'"
        :disabled="!spreadsheet.selectedCell.value"
        @focus="startFormulaBarEdit"
        @blur="finishFormulaBarEdit"
        @keydown="handleFormulaBarKeydown"
      />

      <!-- Formula indicator -->
      <div
        v-if="spreadsheet.selectedCell.value && spreadsheet.hasFormula(spreadsheet.selectedCell.value.row, spreadsheet.selectedCell.value.col)"
        class="px-2 py-0.5 text-[10px] font-medium rounded"
        :class="isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'"
      >
        fx
      </div>
    </div>

    <!-- Sheet Tabs -->
    <div class="flex items-center border-b shrink-0" :class="isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'">
      <!-- Add Sheet Button -->
      <button
        @click="spreadsheet.addSheet()"
        class="w-8 h-8 flex items-center justify-center transition-colors shrink-0"
        :class="isDark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
        title="Añadir hoja"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
      </button>

      <!-- Sheet Tabs -->
      <div class="flex overflow-x-auto">
        <button
          v-for="(sheet, index) in spreadsheet.sheets.value"
          :key="index"
          @click="spreadsheet.switchSheet(index); updateFormulaBarValue()"
          @dblclick="startRenameSheet(index)"
          @contextmenu.prevent="openSheetContextMenu($event, index)"
          class="px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap relative group"
          :class="spreadsheet.activeSheetIndex.value === index
            ? (isDark ? 'text-white bg-neutral-800' : 'text-gray-900 bg-white')
            : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-500 hover:text-gray-700')"
        >
          <!-- Editing mode -->
          <input
            v-if="renamingSheetIndex === index"
            v-model="renamingSheetName"
            type="text"
            class="w-20 px-1 text-xs bg-transparent border-b outline-none"
            :class="isDark ? 'border-neutral-500 text-white' : 'border-gray-400 text-gray-900'"
            @blur="finishRenameSheet"
            @keydown.enter="finishRenameSheet"
            @keydown.escape="cancelRenameSheet"
            @click.stop
            ref="sheetNameInputRef"
          />
          <span v-else>{{ sheet.name }}</span>

          <!-- Close button (only when multiple sheets) -->
          <span
            v-if="spreadsheet.sheets.value.length > 1 && spreadsheet.activeSheetIndex.value === index"
            @click.stop="confirmDeleteSheet(index)"
            class="ml-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
          >×</span>

          <div
            v-if="spreadsheet.activeSheetIndex.value === index"
            class="absolute bottom-0 left-0 right-0 h-0.5"
            :style="{ backgroundColor: themeColor }"
          />
        </button>
      </div>
    </div>

    <!-- Sheet Context Menu -->
    <Teleport to="body">
      <div
        v-if="sheetContextMenu.visible"
        class="fixed rounded-lg shadow-xl py-1 z-[100] min-w-[160px] border"
        :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
        :style="{ left: sheetContextMenu.x + 'px', top: sheetContextMenu.y + 'px' }"
        @click.stop
      >
        <button
          @click="startRenameSheet(sheetContextMenu.index); closeSheetContextMenu()"
          class="w-full px-4 py-2 text-xs text-left flex items-center gap-2"
          :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
          Renombrar
        </button>
        <button
          @click="spreadsheet.duplicateSheet(sheetContextMenu.index); closeSheetContextMenu()"
          class="w-full px-4 py-2 text-xs text-left flex items-center gap-2"
          :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Duplicar
        </button>
        <div class="my-1 border-t" :class="isDark ? 'border-neutral-700' : 'border-gray-200'"></div>
        <button
          v-if="spreadsheet.sheets.value.length > 1"
          @click="confirmDeleteSheet(sheetContextMenu.index); closeSheetContextMenu()"
          class="w-full px-4 py-2 text-xs text-left flex items-center gap-2"
          :class="isDark ? 'text-red-400 hover:bg-neutral-800' : 'text-red-600 hover:bg-gray-100'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>
    </Teleport>

    <!-- Spreadsheet Grid -->
    <div
      ref="gridContainerRef"
      class="flex-1 overflow-auto relative"
      @scroll="handleGridScroll"
    >
      <table class="border-collapse min-w-full">
        <thead class="sticky top-0 z-10">
          <tr>
            <th class="h-8 border text-xs font-medium" style="width: 80px; min-width: 80px;" :class="isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-500' : 'bg-gray-100 border-gray-300 text-gray-500'"></th>
            <th
              v-for="(col, colIndex) in spreadsheet.columns.value"
              :key="colIndex"
              class="h-8 border text-xs font-medium relative group"
              :class="isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400' : 'bg-gray-100 border-gray-300 text-gray-600'"
              :style="{ width: spreadsheet.getColumnWidth(colIndex) + 'px', minWidth: spreadsheet.getColumnWidth(colIndex) + 'px' }"
            >
              {{ col }}
              <!-- Resize handle -->
              <div
                class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
                :class="isDark ? 'bg-neutral-500 hover:bg-neutral-400' : 'bg-gray-400 hover:bg-gray-500'"
                @mousedown="startColumnResize($event, colIndex)"
              ></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in spreadsheet.data.value" :key="rowIndex">
            <td
              class="border text-xs text-center font-medium sticky left-0 z-[5] relative group/row select-none"
              :class="isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-500' : 'bg-gray-100 border-gray-300 text-gray-500'"
              :style="{ height: spreadsheet.getRowHeight(rowIndex) + 'px', width: '80px', minWidth: '80px' }"
            >
              {{ rowIndex + 1 }}
              <!-- Row resize handle -->
              <div
                class="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize opacity-0 group-hover/row:opacity-100 transition-opacity"
                :class="isDark ? 'bg-neutral-500 hover:bg-neutral-400' : 'bg-gray-400 hover:bg-gray-500'"
                @mousedown="startRowResize($event, rowIndex)"
              ></div>
            </td>
            <td
              v-for="(cell, colIndex) in row"
              :key="colIndex"
              @click="spreadsheet.selectCell(rowIndex, colIndex)"
              @dblclick="startEditCell(rowIndex, colIndex)"
              @contextmenu="spreadsheet.openContextMenu($event, rowIndex, colIndex)"
              class="h-7 border text-xs px-2 cursor-cell transition-colors"
              :class="[
                isDark ? 'border-neutral-800' : 'border-gray-200',
                {
                  [isDark ? 'bg-neutral-900' : 'bg-blue-50']: spreadsheet.selectedCell.value?.row === rowIndex && spreadsheet.selectedCell.value?.col === colIndex && !spreadsheet.getCellStyle(rowIndex, colIndex).bgColor,
                  [isDark ? 'bg-neutral-950' : 'bg-white']: !(spreadsheet.selectedCell.value?.row === rowIndex && spreadsheet.selectedCell.value?.col === colIndex) && !spreadsheet.getCellStyle(rowIndex, colIndex).bgColor
                }
              ]"
              :style="{
                width: spreadsheet.getColumnWidth(colIndex) + 'px',
                minWidth: spreadsheet.getColumnWidth(colIndex) + 'px',
                height: spreadsheet.getRowHeight(rowIndex) + 'px',
                ...(spreadsheet.selectedCell.value?.row === rowIndex && spreadsheet.selectedCell.value?.col === colIndex
                  ? { outline: `2px solid ${themeColor}`, outlineOffset: '-1px' }
                  : {}),
                ...spreadsheet.getCellComputedStyle(rowIndex, colIndex)
              }"
            >
              <textarea
                v-if="spreadsheet.editingCell.value?.row === rowIndex && spreadsheet.editingCell.value?.col === colIndex"
                ref="editTextareaRef"
                v-model="spreadsheet.editValue.value"
                @blur="spreadsheet.finishEdit"
                @keydown="handleCellKeydown"
                rows="1"
                class="w-full h-full bg-white text-neutral-900 px-1 -mx-1 outline-none resize-none overflow-hidden"
                :style="{
                  boxShadow: `0 0 0 2px ${themeColor}`,
                  fontWeight: spreadsheet.getCellStyle(rowIndex, colIndex).bold ? 'bold' : 'normal',
                  fontStyle: spreadsheet.getCellStyle(rowIndex, colIndex).italic ? 'italic' : 'normal',
                  textAlign: spreadsheet.getCellStyle(rowIndex, colIndex).alignH || 'left',
                  minHeight: '24px'
                }"
              />
              <span v-else class="block whitespace-pre-wrap w-full" :class="{ 'truncate': !cell.includes('\n') }" :style="{ textAlign: spreadsheet.getCellStyle(rowIndex, colIndex).alignH || 'left' }">
                {{ cell }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Context Menu -->
      <Teleport to="body">
        <div
          v-if="spreadsheet.contextMenu.visible"
          class="fixed rounded-lg shadow-xl py-1 z-[100] min-w-[200px] border"
          :class="isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-gray-200'"
          :style="{ left: spreadsheet.contextMenu.x + 'px', top: spreadsheet.contextMenu.y + 'px' }"
          @click.stop
        >
          <!-- Clipboard -->
          <button @click="handleContextAction('copy')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            Copiar
            <span class="ml-auto" :class="isDark ? 'text-neutral-600' : 'text-gray-400'">Ctrl+C</span>
          </button>
          <button @click="handleContextAction('cut')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>
            </svg>
            Cortar
            <span class="ml-auto" :class="isDark ? 'text-neutral-600' : 'text-gray-400'">Ctrl+X</span>
          </button>
          <button @click="handleContextAction('paste')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Pegar
            <span class="ml-auto" :class="isDark ? 'text-neutral-600' : 'text-gray-400'">Ctrl+V</span>
          </button>
          <button @click="handleContextAction('clear')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Borrar
            <span class="ml-auto" :class="isDark ? 'text-neutral-600' : 'text-gray-400'">Supr</span>
          </button>

          <div class="my-1 border-t" :class="isDark ? 'border-neutral-700' : 'border-gray-200'"></div>

          <!-- Format -->
          <div class="px-3 py-1 text-[10px] uppercase font-medium" :class="isDark ? 'text-neutral-500' : 'text-gray-400'">Formato</div>
          <div class="flex items-center gap-1 px-3 py-1.5">
            <button
              @click="spreadsheet.toggleCellStyle('bold'); spreadsheet.closeContextMenu()"
              class="p-1.5 rounded transition-colors"
              :class="spreadsheet.currentCellStyle.value.bold
                ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
                : (isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500')"
              title="Negrita"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"/>
              </svg>
            </button>
            <button
              @click="spreadsheet.toggleCellStyle('italic'); spreadsheet.closeContextMenu()"
              class="p-1.5 rounded transition-colors"
              :class="spreadsheet.currentCellStyle.value.italic
                ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
                : (isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-gray-100 text-gray-500')"
              title="Cursiva"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4h4l-2 16h-4l2-16z"/>
              </svg>
            </button>
            <div class="w-px h-5 mx-1" :class="isDark ? 'bg-neutral-700' : 'bg-gray-200'"></div>
            <button
              v-for="color in TEXT_COLORS"
              :key="'ctx-text-' + color"
              @click="spreadsheet.setCellStyle('textColor', color); spreadsheet.closeContextMenu()"
              class="w-5 h-5 rounded border transition-transform hover:scale-110"
              :class="isDark ? 'border-neutral-600' : 'border-gray-300'"
              :style="{ backgroundColor: color }"
              title="Color de texto"
            />
          </div>

          <!-- Background -->
          <div class="flex items-center gap-1 px-3 py-1.5">
            <span class="text-[10px] mr-1" :class="isDark ? 'text-neutral-500' : 'text-gray-400'">Fondo:</span>
            <button
              v-for="color in BG_COLORS"
              :key="'ctx-bg-' + color"
              @click="spreadsheet.setCellStyle('bgColor', color); spreadsheet.closeContextMenu()"
              class="w-5 h-5 rounded border transition-transform hover:scale-110"
              :class="isDark ? 'border-neutral-600' : 'border-gray-300'"
              :style="{ backgroundColor: color }"
              title="Color de fondo"
            />
            <button
              @click="spreadsheet.setCellStyle('bgColor', null); spreadsheet.closeContextMenu()"
              class="w-5 h-5 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Sin fondo"
            >
              <svg class="w-3 h-3" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Borders -->
          <div class="flex items-center gap-1 px-3 py-1.5 pb-2">
            <span class="text-[10px] mr-1" :class="isDark ? 'text-neutral-500' : 'text-gray-400'">Bordes:</span>
            <button
              @click="spreadsheet.setBorders('none'); spreadsheet.closeContextMenu()"
              class="w-6 h-6 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Sin borde"
            >
              <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <button
              @click="spreadsheet.setBorders('all'); spreadsheet.closeContextMenu()"
              class="w-6 h-6 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Todos los bordes"
            >
              <div class="w-3.5 h-3.5 border-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
            <button
              @click="spreadsheet.setBorders('bottom'); spreadsheet.closeContextMenu()"
              class="w-6 h-6 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Borde inferior"
            >
              <div class="w-3.5 h-3.5 border-b-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
            <button
              @click="spreadsheet.setBorders('top-bottom'); spreadsheet.closeContextMenu()"
              class="w-6 h-6 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Bordes arriba/abajo"
            >
              <div class="w-3.5 h-3.5 border-t-2 border-b-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
            <button
              @click="spreadsheet.setBorders('left-right'); spreadsheet.closeContextMenu()"
              class="w-6 h-6 rounded border flex items-center justify-center"
              :class="isDark ? 'border-neutral-600 hover:bg-neutral-800' : 'border-gray-300 hover:bg-gray-100'"
              title="Bordes izq/der"
            >
              <div class="w-3.5 h-3.5 border-l-2 border-r-2" :class="isDark ? 'border-neutral-400' : 'border-gray-500'"></div>
            </button>
          </div>

          <div class="my-1 border-t" :class="isDark ? 'border-neutral-700' : 'border-gray-200'"></div>

          <!-- Row operations -->
          <button @click="handleContextAction('insertRowAbove')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19V5m0 0l-4 4m4-4l4 4"/>
            </svg>
            Insertar fila arriba
          </button>
          <button @click="handleContextAction('insertRowBelow')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 5v14m0 0l4-4m-4 4l-4-4"/>
            </svg>
            Insertar fila abajo
          </button>
          <button @click="handleContextAction('deleteRow')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-red-400 hover:bg-neutral-800' : 'text-red-600 hover:bg-gray-100'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 12H4"/>
            </svg>
            Eliminar fila
          </button>

          <div class="my-1 border-t" :class="isDark ? 'border-neutral-700' : 'border-gray-200'"></div>

          <!-- Column operations -->
          <button @click="handleContextAction('insertColumnLeft')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 12H5m0 0l4-4m-4 4l4 4"/>
            </svg>
            Insertar columna izquierda
          </button>
          <button @click="handleContextAction('insertColumnRight')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-gray-700 hover:bg-gray-100'">
            <svg class="w-4 h-4" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 12h14m0 0l-4-4m4 4l-4 4"/>
            </svg>
            Insertar columna derecha
          </button>
          <button @click="handleContextAction('deleteColumn')" class="w-full px-4 py-2 text-xs text-left flex items-center gap-3" :class="isDark ? 'text-red-400 hover:bg-neutral-800' : 'text-red-600 hover:bg-gray-100'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16"/>
            </svg>
            Eliminar columna
          </button>

          <div class="my-1 border-t" :class="isDark ? 'border-neutral-700' : 'border-gray-200'"></div>
          <div class="px-3 py-1.5 text-[10px]" :class="isDark ? 'text-neutral-600' : 'text-gray-400'">
            <span :class="isDark ? 'text-neutral-500' : 'text-gray-500'">Shift+Enter</span> salto de línea
          </div>
        </div>
      </Teleport>

    </div>

    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls,.csv"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Loading Overlay -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="spreadsheet.isLoading.value"
          class="fixed inset-0 z-[200] flex items-center justify-center"
          :class="isDark ? 'bg-black/70' : 'bg-white/70'"
        >
          <div class="flex flex-col items-center gap-4 p-8 rounded-xl" :class="isDark ? 'bg-neutral-900' : 'bg-white shadow-xl'">
            <!-- Spinner -->
            <div class="relative w-12 h-12">
              <div
                class="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                :style="{ borderColor: `${themeColor}40`, borderTopColor: themeColor }"
              ></div>
            </div>
            <!-- Message -->
            <p class="text-sm font-medium" :class="isDark ? 'text-neutral-300' : 'text-gray-700'">
              {{ spreadsheet.loadingMessage.value || 'Procesando...' }}
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #404040);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #525252);
}

.bg-neutral-950 {
  --scrollbar-thumb: #404040;
  --scrollbar-thumb-hover: #525252;
}
.bg-gray-100 {
  --scrollbar-thumb: #d1d5db;
  --scrollbar-thumb-hover: #9ca3af;
}

/* Loading overlay transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
