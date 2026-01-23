<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useKanbanDragDrop } from '../../composables/kanban/useKanbanDragDrop.js'
import { useAppCrypto } from '../../composables/useAppCrypto.js'
import { useKanbanStorage } from '../../composables/kanban/useKanbanStorage.js'
import VaultSaveLoad from '../common/VaultSaveLoad.vue'
import KanbanHeader from './kanban/KanbanHeader.vue'
import KanbanColumn from './kanban/KanbanColumn.vue'
import KanbanFilterBar from './kanban/KanbanFilterBar.vue'
import KanbanExportModal from './kanban/KanbanExportModal.vue'
import KanbanTaskSidebar from './kanban/KanbanTaskSidebar.vue'

// === Crypto (centralized app crypto for optional encryption) ===
const crypto = useAppCrypto()

// === Storage (with centralized crypto) ===
const storage = useKanbanStorage(crypto)
const { boards, currentBoardId, loadMeta, loadBoard, saveBoard, saveMeta, createBoard, deleteBoard, renameBoard, checkLegacy, migrateFromLegacy, genId } = storage

// === Board State ===
const currentBoard = ref(null)
const columns = computed({
  get: () => currentBoard.value ? currentBoard.value.columns : [],
  set: (val) => { if (currentBoard.value) currentBoard.value.columns = val }
})
const boardTags = computed(() => currentBoard.value ? currentBoard.value.tags : [])

// Vault save/load for boards
const getBoardData = () => {
  if (!currentBoard.value) return null
  return JSON.parse(JSON.stringify(currentBoard.value))
}

const loadBoardData = (data) => {
  if (!data || !data.columns) return
  currentBoard.value = data
  currentBoardId.value = data.id
}

const isLoaded = ref(false)

// === Drag & Drop ===
const {
  draggedTask, draggedFromColumn, dragOverColumn, dragOverIndex,
  draggedColumn, dragOverColumnIndex,
  onTaskDragStart, onTaskDragEnd,
  onColumnDragOver, onColumnDrop,
  onColumnDragStart, onColumnDragOverHeader, onColumnDropHeader, onColumnDragEnd
} = useKanbanDragDrop(columns)

// === Filters ===
const showFilters = ref(false)
const searchQuery = ref('')
const filterPriority = ref(null)
const filterTags = ref([])
const filterDateRange = ref({ from: null, to: null })

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || filterPriority.value || filterTags.value.length > 0 ||
    filterDateRange.value.from || filterDateRange.value.to)
})

const filteredColumns = computed(() => {
  if (!hasActiveFilters.value) return columns.value
  return columns.value.map(col => ({
    ...col,
    tasks: col.tasks.filter(task => {
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        if (!task.title.toLowerCase().includes(q) && !(task.description || '').toLowerCase().includes(q)) return false
      }
      if (filterPriority.value && task.priority !== filterPriority.value) return false
      if (filterTags.value.length > 0 && !filterTags.value.some(t => (task.tags || []).includes(t))) return false
      if (filterDateRange.value.from && (!task.dueDate || task.dueDate < filterDateRange.value.from)) return false
      if (filterDateRange.value.to && (!task.dueDate || task.dueDate > filterDateRange.value.to)) return false
      return true
    })
  }))
})

function clearFilters() {
  searchQuery.value = ''
  filterPriority.value = null
  filterTags.value = []
  filterDateRange.value = { from: null, to: null }
}

// === Export Modal ===
const showExport = ref(false)

// === Task Sidebar ===
const sidebarTask = ref(null)
const sidebarColumnId = ref(null)
const sidebarMode = ref('view') // 'view' | 'edit' | 'create'
const showSidebar = computed(() => sidebarMode.value === 'create' || sidebarTask.value !== null)

const sidebarColumnName = computed(() => {
  if (!sidebarColumnId.value || !currentBoard.value) return ''
  const col = currentBoard.value.columns.find(c => c.id === sidebarColumnId.value)
  return col ? col.title : ''
})

function openTask(task, columnId) {
  sidebarTask.value = task
  sidebarColumnId.value = columnId
  sidebarMode.value = 'view'
}

function openCreateTask(columnId) {
  sidebarTask.value = null
  sidebarColumnId.value = columnId
  sidebarMode.value = 'create'
}

function closeSidebar() {
  sidebarTask.value = null
  sidebarColumnId.value = null
  sidebarMode.value = 'view'
}

function onSidebarSave(data) {
  if (sidebarMode.value === 'create') {
    addTask(sidebarColumnId.value, data)
  } else if (sidebarTask.value) {
    editTask(sidebarColumnId.value, sidebarTask.value.id, data)
    // Update the local ref so sidebar reflects changes
    Object.assign(sidebarTask.value, data)
  }
}

function onSidebarDelete() {
  if (sidebarTask.value && sidebarColumnId.value) {
    deleteTask(sidebarColumnId.value, sidebarTask.value.id)
    closeSidebar()
  }
}

// === Persistence ===
let saveTimeout = null
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    if (currentBoard.value) saveBoard(currentBoard.value)
  }, 300)
}

watch(currentBoard, () => {
  if (isLoaded.value && currentBoard.value) scheduleSave()
}, { deep: true })

// === Initialization ===
onMounted(async () => {
  const metaData = await loadMeta()

  if (!metaData || !metaData.boards || metaData.boards.length === 0) {
    // Check legacy data
    const legacy = await checkLegacy()
    if (legacy) {
      currentBoard.value = await migrateFromLegacy(legacy)
    } else {
      currentBoard.value = await createBoard('Mi Tablero')
    }
  } else {
    await loadFirstBoard()
  }

  isLoaded.value = true
})

async function loadFirstBoard() {
  if (boards.value.length === 0) {
    currentBoard.value = await createBoard('Mi Tablero')
  } else {
    currentBoardId.value = boards.value[0].id
    const board = await loadBoard(boards.value[0].id)
    currentBoard.value = board || await createBoard('Mi Tablero')
  }
}

// === Board Actions ===
async function onSelectBoard(boardId) {
  if (currentBoard.value) await saveBoard(currentBoard.value)
  const board = await loadBoard(boardId)
  if (board) {
    currentBoard.value = board
    currentBoardId.value = boardId
  }
}

async function onCreateBoard(name) {
  if (currentBoard.value) await saveBoard(currentBoard.value)
  currentBoard.value = await createBoard(name)
}

// === Column Actions ===
function addColumn() {
  if (!currentBoard.value) return
  currentBoard.value.columns.push({
    id: genId(),
    title: 'Nueva Columna',
    tasks: []
  })
  nextTick(() => {
    const container = document.querySelector('.kanban-scroll')
    if (container) container.scrollLeft = container.scrollWidth
  })
}

function updateColumnTitle(colId, title) {
  const col = currentBoard.value.columns.find(c => c.id === colId)
  if (col) col.title = title
}

function deleteColumn(colId) {
  currentBoard.value.columns = currentBoard.value.columns.filter(c => c.id !== colId)
}

// === Task Actions ===
function addTask(colId, data) {
  const col = currentBoard.value.columns.find(c => c.id === colId)
  if (!col) return
  col.tasks.push({
    id: genId(),
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || null,
    tags: data.tags || [],
    subtasks: data.subtasks || [],
    createdAt: Date.now()
  })
}

function editTask(colId, taskId, data) {
  const col = currentBoard.value.columns.find(c => c.id === colId)
  if (!col) return
  const task = col.tasks.find(t => t.id === taskId)
  if (!task) return
  Object.assign(task, {
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || null,
    tags: data.tags || [],
    subtasks: data.subtasks || []
  })
}

function deleteTask(colId, taskId) {
  const col = currentBoard.value.columns.find(c => c.id === colId)
  if (!col) return
  col.tasks = col.tasks.filter(t => t.id !== taskId)
}

// === Tag Management ===
function addTag(tag) {
  if (!currentBoard.value) return
  currentBoard.value.tags.push({ id: genId(), ...tag })
}

function removeTag(tagId) {
  if (!currentBoard.value) return
  currentBoard.value.tags = currentBoard.value.tags.filter(t => t.id !== tagId)
  currentBoard.value.columns.forEach(col => {
    col.tasks.forEach(task => {
      if (task.tags) task.tags = task.tags.filter(t => t !== tagId)
    })
  })
}

// === Import ===
async function onImport(data) {
  const id = genId()
  const board = {
    id,
    name: data.name || 'Importado',
    createdAt: Date.now(),
    tags: data.tags || [],
    columns: data.columns || []
  }
  boards.value.push({ id, name: board.name, createdAt: board.createdAt })
  await saveMeta()
  await saveBoard(board)
  currentBoard.value = board
  currentBoardId.value = id
  showExport.value = false
}

// === Task count ===
const taskCount = computed(() => {
  return columns.value.reduce((acc, c) => acc + c.tasks.length, 0)
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <KanbanHeader
      :board-name="currentBoard?.name || 'Mi Tablero'"
      :boards="boards"
      :task-count="taskCount"
      :search-query="searchQuery"
      :has-active-filters="hasActiveFilters"
      @add-column="addColumn"
      @toggle-filters="showFilters = !showFilters"
      @toggle-export="showExport = !showExport"
      @select-board="onSelectBoard"
      @create-board="onCreateBoard"
      @update-search="searchQuery = $event"
    />

    <!-- Vault Save/Load -->
    <div v-if="currentBoard" class="h-8 bg-neutral-900/30 border-b border-neutral-800/50 flex items-center px-3 shrink-0">
      <VaultSaveLoad storeName="kanban-boards" :getData="getBoardData" label="tablero" @load="loadBoardData" />
    </div>

    <!-- Filter Bar -->
    <KanbanFilterBar
      v-if="showFilters"
      :priority="filterPriority"
      :tags="filterTags"
      :date-range="filterDateRange"
      :board-tags="boardTags"
      @update-priority="filterPriority = $event"
      @update-tags="filterTags = $event"
      @update-date-range="filterDateRange = $event"
      @clear="clearFilters"
      @add-tag="addTag"
      @remove-tag="removeTag"
    />

    <!-- Board -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden kanban-scroll">
      <div class="flex gap-4 p-4 h-full min-w-max">
        <KanbanColumn
          v-for="(col, colIndex) in filteredColumns"
          :key="col.id"
          :column="col"
          :col-index="colIndex"
          :board-tags="boardTags"
          :drag-over-column="dragOverColumn"
          :drag-over-index="dragOverIndex"
          :dragged-column="draggedColumn"
          :drag-over-column-index="dragOverColumnIndex"
          :dragged-task="draggedTask"
          @delete-column="deleteColumn"
          @update-title="updateColumnTitle"
          @open-task="openTask"
          @create-task="openCreateTask"
          @delete-task="deleteTask"
          @task-dragstart="(e, task, colId) => onTaskDragStart(e, task, colId)"
          @task-dragend="onTaskDragEnd"
          @column-dragover="onColumnDragOver"
          @column-drop="onColumnDrop"
          @column-dragstart="onColumnDragStart"
          @column-dragover-header="onColumnDragOverHeader"
          @column-drop-header="onColumnDropHeader"
          @column-dragend="onColumnDragEnd"
        />

        <!-- Empty state -->
        <div
          v-if="columns.length === 0 && isLoaded"
          class="flex flex-col items-center justify-center w-72 bg-neutral-900/30 rounded-xl border border-dashed border-neutral-700 p-8"
        >
          <svg class="w-10 h-10 text-neutral-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <p class="text-xs text-neutral-500 mb-3">Sin columnas</p>
          <button
            @click="addColumn"
            class="px-3 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded transition-colors"
          >
            Crear columna
          </button>
        </div>
      </div>
    </div>

    <!-- Export Modal -->
    <KanbanExportModal
      v-if="showExport"
      :board="currentBoard"
      @close="showExport = false"
      @import="onImport"
    />

    <!-- Task Sidebar -->
    <KanbanTaskSidebar
      v-if="showSidebar"
      :task="sidebarTask"
      :column-id="sidebarColumnId"
      :column-name="sidebarColumnName"
      :board-tags="boardTags"
      :mode="sidebarMode"
      @close="closeSidebar"
      @save="onSidebarSave"
      @delete="onSidebarDelete"
    />
  </div>
</template>

<style scoped>
.kanban-scroll::-webkit-scrollbar {
  height: 6px;
}
.kanban-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.kanban-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.kanban-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
