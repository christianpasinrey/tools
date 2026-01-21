<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useSpreadsheet, TEXT_COLORS, BG_COLORS, BORDER_PRESETS, isDark, toggleDark } from '../../composables/useSpreadsheet'

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

// Initialize
onMounted(() => {
  spreadsheet.initEmptySheet()
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('click', spreadsheet.closeContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('click', spreadsheet.closeContextMenu)
  document.removeEventListener('mousemove', handleColumnResize)
  document.removeEventListener('mouseup', stopColumnResize)
})

// File handling
const openFilePicker = () => fileInputRef.value?.click()

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (file) {
    await spreadsheet.loadFile(file)
  }
  e.target.value = ''
}

const handleDrop = async (e) => {
  spreadsheet.isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    await spreadsheet.loadFile(file)
  }
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

const newDocument = () => {
  if (confirm('¿Crear un nuevo documento? Se perderán los cambios no guardados.')) {
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

      <!-- Format -->
      <div v-if="spreadsheet.selectedCell.value" class="flex items-center gap-1 pr-2 border-r" :class="isDark ? 'border-neutral-800' : 'border-gray-200'">
        <button
          @click="spreadsheet.toggleCellStyle('bold')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.bold
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Negrita (Ctrl+B)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"/>
          </svg>
        </button>
        <button
          @click="spreadsheet.toggleCellStyle('italic')"
          class="p-1.5 rounded transition-colors"
          :class="spreadsheet.currentCellStyle.value.italic
            ? (isDark ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900')
            : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100')"
          title="Cursiva (Ctrl+I)"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4h4l-2 16h-4l2-16z"/>
          </svg>
        </button>
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

    <!-- Sheet Tabs -->
    <div v-if="spreadsheet.sheets.value.length > 1" class="flex border-b overflow-x-auto" :class="isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'">
      <button
        v-for="(sheet, index) in spreadsheet.sheets.value"
        :key="index"
        @click="spreadsheet.switchSheet(index)"
        class="px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap relative"
        :class="spreadsheet.activeSheetIndex.value === index
          ? (isDark ? 'text-white bg-neutral-800' : 'text-gray-900 bg-white')
          : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-gray-500 hover:text-gray-700')"
      >
        {{ sheet.name }}
        <div
          v-if="spreadsheet.activeSheetIndex.value === index"
          class="absolute bottom-0 left-0 right-0 h-0.5"
          :style="{ backgroundColor: themeColor }"
        />
      </button>
    </div>

    <!-- Spreadsheet Grid -->
    <div
      ref="gridContainerRef"
      class="flex-1 overflow-auto relative"
      @dragover.prevent="spreadsheet.isDragging.value = true"
      @dragleave="spreadsheet.isDragging.value = false"
      @drop.prevent="handleDrop"
      @scroll="handleGridScroll"
    >
      <table class="border-collapse min-w-full">
        <thead class="sticky top-0 z-10">
          <tr>
            <th class="w-12 h-8 border text-xs font-medium" :class="isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-500' : 'bg-gray-100 border-gray-300 text-gray-500'"></th>
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
              class="w-12 border text-xs text-center font-medium sticky left-0 z-[5]"
              :class="isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-500' : 'bg-gray-100 border-gray-300 text-gray-500'"
              :style="{ height: spreadsheet.getRowHeight(rowIndex) + 'px' }"
            >
              {{ rowIndex + 1 }}
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
                  minHeight: '24px'
                }"
              />
              <span v-else class="block whitespace-pre-wrap" :class="{ 'truncate': !cell.includes('\n') }">
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

      <!-- Empty State Overlay -->
      <div
        v-if="!spreadsheet.fileName.value && spreadsheet.data.value.every(row => row.every(cell => !cell))"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          @click="openFilePicker"
          class="flex flex-col items-center cursor-pointer pointer-events-auto p-8 rounded-lg border-2 border-dashed transition-colors"
          :class="spreadsheet.isDragging.value
            ? 'border-green-500/50 bg-green-500/5'
            : (isDark ? 'border-neutral-700 hover:border-neutral-600' : 'border-gray-300 hover:border-gray-400')"
        >
          <div class="w-16 h-16 rounded-lg border flex items-center justify-center mb-4" :class="isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-gray-100 border-gray-200'">
            <svg class="w-7 h-7" :class="isDark ? 'text-neutral-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </div>
          <p class="text-sm mb-1" :class="isDark ? 'text-neutral-400' : 'text-gray-600'">Arrastra un archivo Excel o CSV</p>
          <p class="text-xs" :class="isDark ? 'text-neutral-600' : 'text-gray-400'">o haz clic para buscar</p>
        </div>
      </div>
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
