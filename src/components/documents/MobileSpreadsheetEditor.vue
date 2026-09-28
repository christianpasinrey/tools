<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSpreadsheet, TEXT_COLORS, BG_COLORS } from '../../composables/useSpreadsheet'
import { toast } from '../../composables/useToast'
import TbToolbar from '../ui/TbToolbar.vue'
import TbToolbarGroup from '../ui/TbToolbarGroup.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbButton from '../ui/TbButton.vue'
import TbMenu from '../ui/TbMenu.vue'

const spreadsheet = useSpreadsheet()
const fileInputRef = ref(null)
const cellInputRef = ref(null)

const showFormatSheet = ref(false)
const editingCell = ref(null)
const editValue = ref('')

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

onMounted(() => {
  spreadsheet.initEmptySheet()
})

// File handling
const openFile = () => fileInputRef.value?.click()

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  await spreadsheet.loadFile(file)
  toast('Archivo abierto', { tone: 'success' })
}

const newSheet = () => {
  spreadsheet.initEmptySheet()
  toast('Hoja nueva')
}

const downloadXlsx = async () => {
  await spreadsheet.exportXlsx()
  toast('Hoja descargada', { tone: 'success' })
}

const menuItems = [
  { label: 'Hoja nueva', icon: 'file-plus', action: () => newSheet() },
  { label: 'Abrir .xlsx o .csv', icon: 'folder', action: () => openFile() },
  { label: 'Descargar .xlsx', icon: 'download', action: () => downloadXlsx() }
]

// Cell editing
const startEditing = (row, col) => {
  spreadsheet.selectCell(row, col)
  editingCell.value = { row, col }
  editValue.value = spreadsheet.data.value?.[row]?.[col] ?? ''
  nextTick(() => {
    const input = Array.isArray(cellInputRef.value) ? cellInputRef.value[0] : cellInputRef.value
    input?.focus()
  })
}

const finishEditing = () => {
  if (editingCell.value && spreadsheet.data.value) {
    const { row, col } = editingCell.value
    while (spreadsheet.data.value.length <= row) spreadsheet.data.value.push([])
    while (spreadsheet.data.value[row].length <= col) spreadsheet.data.value[row].push('')
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
  if (editingCell.value) finishEditing()
  spreadsheet.selectCell(row, col)
}

const isSelected = (row, col) =>
  spreadsheet.selectedCell.value?.row === row && spreadsheet.selectedCell.value?.col === col

// Format actions: mismas claves de estilo que el escritorio (textColor, bgColor, alignH)
const applyBold = () => currentCell.value && spreadsheet.toggleCellStyle('bold')
const applyItalic = () => currentCell.value && spreadsheet.toggleCellStyle('italic')
const applyTextColor = (color) => currentCell.value && spreadsheet.setCellStyle('textColor', color)
const applyBgColor = (color) => currentCell.value && spreadsheet.setCellStyle('bgColor', color)
const applyAlign = (align) => currentCell.value && spreadsheet.setAlignment('horizontal', align)

// Estilo de celda: el composable resuelve el color de texto según fondo y tema
const getCellStyle = (row, col) => {
  const computedStyle = spreadsheet.getCellComputedStyle(row, col)
  const style = spreadsheet.getCellStyle(row, col)
  return { ...computedStyle, textAlign: style.alignH || 'left' }
}

const getCellValue = (row, col) => spreadsheet.data.value?.[row]?.[col] ?? ''

// Visible rows/cols for mobile (limited for performance)
const visibleRows = computed(() => Math.min(spreadsheet.data.value?.length || 50, 100))
const visibleCols = computed(() => Math.min(spreadsheet.data.value?.[0]?.length || 26, 26))
</script>

<template>
  <div class="h-full flex flex-col bg-tb-bg text-tb-ink font-ui" style="--cat: var(--cat-documents)">
    <!-- Celda activa -->
    <div class="shrink-0 flex items-center gap-2 pl-3 pr-2 py-2 border-b border-tb-line bg-tb-surface">
      <span class="min-w-11 px-2 py-1 rounded-md text-center text-xs font-code text-[var(--cat)] bg-[color-mix(in_srgb,var(--cat)_12%,transparent)]">
        {{ currentCell?.ref || '—' }}
      </span>
      <p class="flex-1 min-w-0 text-sm text-tb-ink truncate">
        {{ currentCell ? currentCell.value : (spreadsheet.fileName.value || 'Toca una celda') }}
      </p>
      <TbMenu label="Más opciones" icon="more-vertical" icon-only align="end" :items="menuItems" />
    </div>

    <!-- Rejilla -->
    <div class="flex-1 overflow-auto bg-tb-surface">
      <table class="border-collapse min-w-full">
        <thead class="sticky top-0 z-10">
          <tr>
            <th class="w-10 h-8 bg-tb-surface-2 border border-tb-line"></th>
            <th
              v-for="col in visibleCols"
              :key="col"
              class="min-w-20 h-8 bg-tb-surface-2 border border-tb-line text-[11px] font-code font-medium text-tb-muted"
            >
              {{ spreadsheet.getColumnLabel(col - 1) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row">
            <td class="w-10 h-9 sticky left-0 z-[5] bg-tb-surface-2 border border-tb-line text-[11px] font-code text-center text-tb-muted">
              {{ row }}
            </td>
            <td
              v-for="col in visibleCols"
              :key="col"
              class="min-w-20 h-9 px-1 text-sm border border-tb-line"
              :class="isSelected(row - 1, col - 1) && 'outline-2 outline-[var(--cat)] -outline-offset-2'"
              :style="getCellStyle(row - 1, col - 1)"
              @click="handleCellTap(row - 1, col - 1)"
              @dblclick="startEditing(row - 1, col - 1)"
            >
              <input
                v-if="editingCell?.row === row - 1 && editingCell?.col === col - 1"
                ref="cellInputRef"
                v-model="editValue"
                :aria-label="`Valor de ${currentCell?.ref}`"
                class="w-full h-full px-1 text-sm bg-tb-surface text-tb-ink outline-none"
                @blur="finishEditing"
                @keydown.enter="finishEditing"
                @keydown.escape="cancelEditing"
              />
              <template v-else>{{ getCellValue(row - 1, col - 1) }}</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Barra inferior -->
    <div class="shrink-0 border-t border-tb-line bg-tb-surface px-2 py-2">
      <div class="flex items-center gap-2">
        <TbButton icon="edit" class="flex-1" :disabled="!currentCell" @click="currentCell && startEditing(currentCell.row, currentCell.col)">
          Editar celda
        </TbButton>
        <TbIconButton icon="bold" label="Formato de celda" size="lg" :active="showFormatSheet" @click="showFormatSheet = !showFormatSheet" />
      </div>

      <div v-if="showFormatSheet" class="mt-2 pt-2 border-t border-tb-line space-y-3">
        <TbToolbar label="Formato">
          <TbToolbarGroup label="Estilo">
            <TbIconButton icon="bold" label="Negrita" size="lg" :disabled="!currentCell" @click="applyBold" />
            <TbIconButton icon="italic" label="Cursiva" size="lg" :disabled="!currentCell" @click="applyItalic" />
          </TbToolbarGroup>
          <TbToolbarGroup label="Alineación">
            <TbIconButton icon="align-left" label="Alinear a la izquierda" size="lg" :disabled="!currentCell" @click="applyAlign('left')" />
            <TbIconButton icon="align-center" label="Centrar" size="lg" :disabled="!currentCell" @click="applyAlign('center')" />
            <TbIconButton icon="align-right" label="Alinear a la derecha" size="lg" :disabled="!currentCell" @click="applyAlign('right')" />
          </TbToolbarGroup>
        </TbToolbar>

        <fieldset>
          <legend class="mb-1.5 text-xs text-tb-muted">Color del texto</legend>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="color in TEXT_COLORS"
              :key="color"
              type="button"
              class="sheet-swatch"
              :aria-label="`Texto ${color}`"
              :style="{ backgroundColor: color }"
              :disabled="!currentCell"
              @click="applyTextColor(color)"
            ></button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="mb-1.5 text-xs text-tb-muted">Color de fondo</legend>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="color in BG_COLORS"
              :key="color"
              type="button"
              class="sheet-swatch"
              :aria-label="`Fondo ${color}`"
              :style="{ backgroundColor: color }"
              :disabled="!currentCell"
              @click="applyBgColor(color)"
            ></button>
          </div>
        </fieldset>
      </div>
    </div>

    <input ref="fileInputRef" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileSelect" />
  </div>
</template>

<style scoped>
.sheet-swatch { width: 30px; height: 30px; border-radius: 8px; box-shadow: inset 0 0 0 1px rgb(0 0 0 / .18); }
.sheet-swatch:disabled { opacity: .4; }
</style>
