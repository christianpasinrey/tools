<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSpreadsheet, TEXT_COLORS, BG_COLORS } from '../../composables/useSpreadsheet'

const spreadsheet = useSpreadsheet()
const fileInputRef = ref(null)
const cellInputRef = ref(null)

const showMenu = ref(false)
const showFormatSheet = ref(false)
const editingCell = ref(null)
const editValue = ref('')
const toastMessage = ref('')
const toastVisible = ref(false)

// Current selection info
const currentCell = computed(() => {
  const sel = spreadsheet.selectedCell.value
  if (!sel) return null
  return {
    ref: `${spreadsheet.getColumnLabel(sel.col)}${sel.row + 1}`,
    value: spreadsheet.data.value?.[sel.row]?.[sel.col] ?? '',
    row: sel.row,
    col: sel.col
  }
})

function showToast(msg) {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 2000)
}

onMounted(() => {
  spreadsheet.initEmptySheet()
})

// File handling
const openFile = () => {
  fileInputRef.value?.click()
  showMenu.value = false
}

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (file) {
    await spreadsheet.loadFile(file)
    showToast('Archivo cargado')
  }
  e.target.value = ''
}

const newSheet = () => {
  spreadsheet.initEmptySheet()
  showMenu.value = false
  showToast('Nueva hoja')
}

const downloadXlsx = async () => {
  await spreadsheet.exportXlsx()
  showMenu.value = false
  showToast('Descargado')
}

// Cell editing
const startEditing = (row, col) => {
  spreadsheet.selectCell(row, col)
  editingCell.value = { row, col }
  editValue.value = spreadsheet.data.value?.[row]?.[col] ?? ''
  nextTick(() => {
    cellInputRef.value?.focus()
  })
}

const finishEditing = () => {
  if (editingCell.value && spreadsheet.data.value) {
    const { row, col } = editingCell.value
    // Ensure row exists
    while (spreadsheet.data.value.length <= row) {
      spreadsheet.data.value.push([])
    }
    // Ensure column exists
    while (spreadsheet.data.value[row].length <= col) {
      spreadsheet.data.value[row].push('')
    }
    spreadsheet.data.value[row][col] = editValue.value
  }
  editingCell.value = null
  editValue.value = ''
}

const cancelEditing = () => {
  editingCell.value = null
  editValue.value = ''
}

// Cell selection
const handleCellTap = (row, col) => {
  if (editingCell.value) {
    finishEditing()
  }
  spreadsheet.selectCell(row, col)
}

const handleCellDoubleTap = (row, col) => {
  startEditing(row, col)
}

// Format actions
const applyBold = () => {
  if (!currentCell.value) return
  spreadsheet.toggleCellStyle('bold')
}

const applyItalic = () => {
  if (!currentCell.value) return
  spreadsheet.toggleCellStyle('italic')
}

const applyTextColor = (color) => {
  if (!currentCell.value) return
  spreadsheet.setCellStyle('color', color)
}

const applyBgColor = (color) => {
  if (!currentCell.value) return
  spreadsheet.setCellStyle('bgColor', color)
}

const applyAlign = (align) => {
  if (!currentCell.value) return
  spreadsheet.setAlignment(align)
}

// Get cell style
const getCellComputedStyle = (row, col) => {
  const style = spreadsheet.getCellStyle(row, col)
  return {
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
    color: style.color || '#e5e5e5',
    backgroundColor: style.bgColor || 'transparent',
    textAlign: style.align || 'left'
  }
}

// Get cell value
const getCellValue = (row, col) => {
  return spreadsheet.data.value?.[row]?.[col] ?? ''
}

// Visible rows/cols for mobile (limited for performance)
const visibleRows = computed(() => Math.min(spreadsheet.data.value?.length || 50, 100))
const visibleCols = computed(() => Math.min(spreadsheet.data.value?.[0]?.length || 26, 26))
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-950">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80 shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18"/>
        </svg>
        <span class="text-sm font-medium text-white">{{ spreadsheet.fileName.value || 'Hoja de cálculo' }}</span>
      </div>
      <button @click="showMenu = !showMenu" class="p-2 text-neutral-400 active:text-white" style="touch-action: manipulation;">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
        </svg>
      </button>
    </div>

    <!-- Menu Dropdown -->
    <Transition name="fade">
      <div v-if="showMenu" class="absolute top-14 right-4 z-50 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl overflow-hidden">
        <button @click="newSheet" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nueva hoja
        </button>
        <button @click="openFile" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700 border-t border-neutral-700">
          <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          Abrir archivo
        </button>
        <button @click="downloadXlsx" class="w-full px-4 py-3 text-left text-sm text-white flex items-center gap-3 active:bg-neutral-700 border-t border-neutral-700">
          <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Descargar .xlsx
        </button>
      </div>
    </Transition>

    <!-- Click outside to close -->
    <div v-if="showMenu || showFormatSheet" class="fixed inset-0 z-40" @click="showMenu = false; showFormatSheet = false"></div>

    <!-- Cell Info Bar -->
    <div class="flex items-center gap-2 px-3 py-2 bg-neutral-900/50 border-b border-neutral-800">
      <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded min-w-[40px] text-center">
        {{ currentCell?.ref || '-' }}
      </span>
      <div class="flex-1 text-sm text-neutral-300 truncate">
        {{ currentCell?.value || '' }}
      </div>
    </div>

    <!-- Spreadsheet Grid -->
    <div class="flex-1 overflow-auto bg-neutral-900">
      <table class="border-collapse min-w-full">
        <!-- Header row -->
        <thead class="sticky top-0 z-10">
          <tr>
            <th class="w-10 h-8 bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-500"></th>
            <th
              v-for="col in visibleCols"
              :key="col"
              class="min-w-[80px] h-8 bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-400 font-medium"
            >
              {{ spreadsheet.getColumnLabel(col - 1) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row">
            <!-- Row number -->
            <td class="w-10 h-9 bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-400 text-center sticky left-0 z-5">
              {{ row }}
            </td>
            <!-- Cells -->
            <td
              v-for="col in visibleCols"
              :key="col"
              @click="handleCellTap(row - 1, col - 1)"
              @dblclick="handleCellDoubleTap(row - 1, col - 1)"
              class="min-w-[80px] h-9 border-2 px-1 text-sm transition-colors"
              :class="{
                'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-400/50': spreadsheet.selectedCell.value?.row === row - 1 && spreadsheet.selectedCell.value?.col === col - 1,
                'bg-neutral-800 border-neutral-700': !(spreadsheet.selectedCell.value?.row === row - 1 && spreadsheet.selectedCell.value?.col === col - 1)
              }"
              :style="getCellComputedStyle(row - 1, col - 1)"
            >
              <template v-if="editingCell?.row === row - 1 && editingCell?.col === col - 1">
                <input
                  ref="cellInputRef"
                  v-model="editValue"
                  class="w-full h-full bg-white text-black px-1 outline-none text-sm"
                  @blur="finishEditing"
                  @keydown.enter="finishEditing"
                  @keydown.escape="cancelEditing"
                />
              </template>
              <template v-else>
                {{ getCellValue(row - 1, col - 1) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bottom Toolbar -->
    <div class="bg-neutral-900 border-t border-neutral-800 px-2 py-2 mb-14">
      <div class="flex items-center justify-between">
        <!-- Edit current cell -->
        <button
          @click="currentCell && startEditing(currentCell.row, currentCell.col)"
          class="mobile-sheet-btn flex-1 mr-2"
          :disabled="!currentCell"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Editar
        </button>

        <!-- Format button -->
        <button @click="showFormatSheet = !showFormatSheet" class="mobile-sheet-btn" :class="showFormatSheet ? 'bg-emerald-500/20 text-emerald-400' : ''">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
          </svg>
        </button>
      </div>

      <!-- Format Sheet -->
      <Transition name="slide">
        <div v-if="showFormatSheet" class="mt-3 pt-3 border-t border-neutral-800">
          <!-- Text format -->
          <div class="flex items-center gap-2 mb-3">
            <button @click="applyBold" class="mobile-sheet-btn-sm" :disabled="!currentCell">
              <span class="font-bold">B</span>
            </button>
            <button @click="applyItalic" class="mobile-sheet-btn-sm" :disabled="!currentCell">
              <span class="italic">I</span>
            </button>
            <div class="w-px h-6 bg-neutral-700"></div>
            <button @click="applyAlign('left')" class="mobile-sheet-btn-sm" :disabled="!currentCell">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16"/>
              </svg>
            </button>
            <button @click="applyAlign('center')" class="mobile-sheet-btn-sm" :disabled="!currentCell">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16"/>
              </svg>
            </button>
            <button @click="applyAlign('right')" class="mobile-sheet-btn-sm" :disabled="!currentCell">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16"/>
              </svg>
            </button>
          </div>

          <!-- Colors -->
          <div class="mb-2">
            <p class="text-[10px] text-neutral-500 uppercase mb-1">Color texto</p>
            <div class="flex gap-1 flex-wrap">
              <button
                v-for="color in TEXT_COLORS"
                :key="color"
                @click="applyTextColor(color)"
                class="w-7 h-7 rounded border border-neutral-600"
                :style="{ backgroundColor: color }"
                :disabled="!currentCell"
              ></button>
            </div>
          </div>

          <div>
            <p class="text-[10px] text-neutral-500 uppercase mb-1">Color fondo</p>
            <div class="flex gap-1 flex-wrap">
              <button
                v-for="color in BG_COLORS"
                :key="color"
                @click="applyBgColor(color)"
                class="w-7 h-7 rounded border border-neutral-600"
                :style="{ backgroundColor: color }"
                :disabled="!currentCell"
              ></button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Hidden file input -->
    <input ref="fileInputRef" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileSelect" />

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastVisible" class="fixed bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-neutral-800 text-white text-sm rounded-full shadow-lg z-50">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>
