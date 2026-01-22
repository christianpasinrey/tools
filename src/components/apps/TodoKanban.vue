<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// === Encoding/Decoding (rot13 + base64) ===
function rot13(str) {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

function encode(data) {
  const json = JSON.stringify(data)
  return btoa(unescape(encodeURIComponent(rot13(json))))
}

function decode(encoded) {
  try {
    const decoded = rot13(decodeURIComponent(escape(atob(encoded))))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

// === IndexedDB helpers ===
const DB_NAME = 'todo-kanban-db'
const STORE_NAME = 'boards'
const BOARD_ID = 'default'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveBoard(columns) {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put({ id: BOARD_ID, data: encode(columns) })
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

async function loadBoard() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(BOARD_ID)
    return new Promise((resolve) => {
      request.onsuccess = () => {
        db.close()
        if (request.result && request.result.data) {
          resolve(decode(request.result.data))
        } else {
          resolve(null)
        }
      }
      request.onerror = () => { db.close(); resolve(null) }
    })
  } catch {
    return null
  }
}

// === State ===
const columns = ref([])
const isLoaded = ref(false)

const defaultColumns = [
  { id: genId(), title: 'To Do', tasks: [] },
  { id: genId(), title: 'In Progress', tasks: [] },
  { id: genId(), title: 'Done', tasks: [] }
]

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// === Persistence ===
let saveTimeout = null
function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveBoard(columns.value)
  }, 300)
}

watch(columns, () => {
  if (isLoaded.value) scheduleSave()
}, { deep: true })

onMounted(async () => {
  const saved = await loadBoard()
  if (saved && Array.isArray(saved) && saved.length > 0) {
    columns.value = saved
  } else {
    columns.value = defaultColumns
  }
  isLoaded.value = true
})

// === Drag & Drop ===
const draggedTask = ref(null)
const draggedFromColumn = ref(null)
const dragOverColumn = ref(null)
const dragOverIndex = ref(-1)
const draggedColumn = ref(null)
const dragOverColumnIndex = ref(-1)

function onTaskDragStart(e, task, columnId) {
  draggedTask.value = task
  draggedFromColumn.value = columnId
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', task.id)
  e.target.classList.add('opacity-50')
}

function onTaskDragEnd(e) {
  e.target.classList.remove('opacity-50')
  draggedTask.value = null
  draggedFromColumn.value = null
  dragOverColumn.value = null
  dragOverIndex.value = -1
}

function onColumnDragOver(e, columnId, taskIndex) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverColumn.value = columnId
  dragOverIndex.value = taskIndex
}

function onColumnDrop(e, targetColumnId, dropIndex) {
  e.preventDefault()
  if (!draggedTask.value) return

  const sourceCol = columns.value.find(c => c.id === draggedFromColumn.value)
  const targetCol = columns.value.find(c => c.id === targetColumnId)
  if (!sourceCol || !targetCol) return

  const taskIdx = sourceCol.tasks.findIndex(t => t.id === draggedTask.value.id)
  if (taskIdx === -1) return

  const [task] = sourceCol.tasks.splice(taskIdx, 1)

  const insertAt = dropIndex >= 0 ? dropIndex : targetCol.tasks.length
  targetCol.tasks.splice(insertAt, 0, task)

  dragOverColumn.value = null
  dragOverIndex.value = -1
}

// Column drag
function onColumnDragStart(e, index) {
  draggedColumn.value = index
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', 'column')
}

function onColumnDragOverHeader(e, index) {
  e.preventDefault()
  if (draggedColumn.value === null) return
  dragOverColumnIndex.value = index
}

function onColumnDropHeader(e, index) {
  e.preventDefault()
  if (draggedColumn.value === null || draggedColumn.value === index) return
  const [col] = columns.value.splice(draggedColumn.value, 1)
  columns.value.splice(index, 0, col)
  draggedColumn.value = null
  dragOverColumnIndex.value = -1
}

function onColumnDragEnd() {
  draggedColumn.value = null
  dragOverColumnIndex.value = -1
}

// === Column Management ===
const editingColumnId = ref(null)
const editingColumnTitle = ref('')

function addColumn() {
  columns.value.push({
    id: genId(),
    title: 'New Column',
    tasks: []
  })
  nextTick(() => {
    const container = document.querySelector('.kanban-scroll')
    if (container) container.scrollLeft = container.scrollWidth
  })
}

function startEditColumn(col) {
  editingColumnId.value = col.id
  editingColumnTitle.value = col.title
}

function saveColumnTitle(col) {
  if (editingColumnTitle.value.trim()) {
    col.title = editingColumnTitle.value.trim()
  }
  editingColumnId.value = null
}

function deleteColumn(colId) {
  const col = columns.value.find(c => c.id === colId)
  if (col && col.tasks.length > 0) {
    if (!confirm(`Eliminar "${col.title}" con ${col.tasks.length} tarea(s)?`)) return
  }
  columns.value = columns.value.filter(c => c.id !== colId)
}

// === Task Management ===
const addingToColumn = ref(null)
const newTaskTitle = ref('')
const newTaskDescription = ref('')
const newTaskPriority = ref('medium')

const editingTask = ref(null)
const editTaskTitle = ref('')
const editTaskDescription = ref('')
const editTaskPriority = ref('medium')

function startAddTask(colId) {
  addingToColumn.value = colId
  newTaskTitle.value = ''
  newTaskDescription.value = ''
  newTaskPriority.value = 'medium'
  nextTick(() => {
    const input = document.querySelector('.new-task-input')
    if (input) input.focus()
  })
}

function confirmAddTask(colId) {
  if (!newTaskTitle.value.trim()) return
  const col = columns.value.find(c => c.id === colId)
  if (!col) return
  col.tasks.push({
    id: genId(),
    title: newTaskTitle.value.trim(),
    description: newTaskDescription.value.trim(),
    priority: newTaskPriority.value,
    createdAt: Date.now()
  })
  addingToColumn.value = null
}

function cancelAddTask() {
  addingToColumn.value = null
}

function startEditTask(task) {
  editingTask.value = task.id
  editTaskTitle.value = task.title
  editTaskDescription.value = task.description || ''
  editTaskPriority.value = task.priority || 'medium'
}

function saveEditTask(task) {
  if (editTaskTitle.value.trim()) {
    task.title = editTaskTitle.value.trim()
    task.description = editTaskDescription.value.trim()
    task.priority = editTaskPriority.value
  }
  editingTask.value = null
}

function cancelEditTask() {
  editingTask.value = null
}

function deleteTask(colId, taskId) {
  const col = columns.value.find(c => c.id === colId)
  if (!col) return
  col.tasks = col.tasks.filter(t => t.id !== taskId)
}

// === Helpers ===
const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444'
}

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
}

function goToStorage() {
  router.push('/technology#browser-storage')
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-sm font-medium text-white">Kanban Board</h2>
        <span class="text-xs text-neutral-500">{{ columns.reduce((acc, c) => acc + c.tasks.length, 0) }} tareas</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="goToStorage"
          class="flex items-center gap-1.5 px-2 py-1 text-[10px] text-neutral-500 hover:text-indigo-400 transition-colors"
          title="Ver datos en Browser Storage"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          IndexedDB
        </button>
        <button
          @click="addColumn"
          class="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded transition-colors"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Columna
        </button>
      </div>
    </div>

    <!-- Board -->
    <div class="flex-1 overflow-x-auto overflow-y-hidden kanban-scroll">
      <div class="flex gap-4 p-4 h-full min-w-max">
        <!-- Columns -->
        <div
          v-for="(col, colIndex) in columns"
          :key="col.id"
          class="flex flex-col w-72 bg-neutral-900/50 rounded-xl border border-neutral-800 shrink-0 max-h-full transition-all"
          :class="{
            'border-indigo-500/50 scale-[1.02]': dragOverColumnIndex === colIndex && draggedColumn !== null,
            'opacity-50': draggedColumn === colIndex
          }"
          @dragover="onColumnDragOver($event, col.id, col.tasks.length)"
          @drop="onColumnDrop($event, col.id, -1)"
        >
          <!-- Column Header -->
          <div
            class="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800 cursor-grab active:cursor-grabbing shrink-0"
            draggable="true"
            @dragstart="onColumnDragStart($event, colIndex)"
            @dragover="onColumnDragOverHeader($event, colIndex)"
            @drop="onColumnDropHeader($event, colIndex)"
            @dragend="onColumnDragEnd"
          >
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <svg class="w-3.5 h-3.5 text-neutral-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
              </svg>
              <template v-if="editingColumnId === col.id">
                <input
                  v-model="editingColumnTitle"
                  @keydown.enter="saveColumnTitle(col)"
                  @keydown.escape="editingColumnId = null"
                  @blur="saveColumnTitle(col)"
                  class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-indigo-500/50"
                  autofocus
                />
              </template>
              <template v-else>
                <span
                  class="text-xs font-medium text-neutral-300 truncate cursor-pointer hover:text-white"
                  @dblclick="startEditColumn(col)"
                >
                  {{ col.title }}
                </span>
                <span class="text-[10px] text-neutral-600 shrink-0">{{ col.tasks.length }}</span>
              </template>
            </div>
            <div class="flex items-center gap-1 shrink-0 ml-2">
              <button
                @click="startAddTask(col.id)"
                class="p-1 text-neutral-600 hover:text-indigo-400 transition-colors"
                title="Añadir tarea"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
              <button
                @click="deleteColumn(col.id)"
                class="p-1 text-neutral-600 hover:text-red-400 transition-colors"
                title="Eliminar columna"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Tasks List -->
          <div class="flex-1 overflow-y-auto p-2 space-y-2">
            <!-- Add Task Form -->
            <div v-if="addingToColumn === col.id" class="bg-neutral-800/80 rounded-lg p-2.5 border border-indigo-500/30">
              <input
                v-model="newTaskTitle"
                placeholder="Título de la tarea"
                class="new-task-input w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 mb-2"
                @keydown.enter="confirmAddTask(col.id)"
                @keydown.escape="cancelAddTask"
              />
              <textarea
                v-model="newTaskDescription"
                placeholder="Descripción (opcional)"
                rows="2"
                class="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 mb-2 resize-none"
              ></textarea>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <button
                    v-for="(label, key) in priorityLabels"
                    :key="key"
                    @click="newTaskPriority = key"
                    class="px-2 py-0.5 text-[10px] rounded-full border transition-colors"
                    :class="newTaskPriority === key
                      ? 'border-current text-white'
                      : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'"
                    :style="newTaskPriority === key ? { color: priorityColors[key], borderColor: priorityColors[key] + '80' } : {}"
                  >
                    {{ label }}
                  </button>
                </div>
                <div class="flex items-center gap-1">
                  <button @click="cancelAddTask" class="px-2 py-1 text-[10px] text-neutral-500 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button
                    @click="confirmAddTask(col.id)"
                    :disabled="!newTaskTitle.trim()"
                    class="px-2.5 py-1 text-[10px] bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded transition-colors"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>

            <!-- Task Cards -->
            <div
              v-for="(task, taskIndex) in col.tasks"
              :key="task.id"
              class="group relative bg-neutral-800/60 hover:bg-neutral-800 rounded-lg p-2.5 border border-neutral-700/50 hover:border-neutral-600 cursor-grab active:cursor-grabbing transition-all"
              :class="{
                'border-indigo-500/50 bg-indigo-500/5': dragOverColumn === col.id && dragOverIndex === taskIndex
              }"
              draggable="true"
              @dragstart="onTaskDragStart($event, task, col.id)"
              @dragend="onTaskDragEnd"
              @dragover="onColumnDragOver($event, col.id, taskIndex)"
              @drop.stop="onColumnDrop($event, col.id, taskIndex)"
            >
              <!-- Edit Mode -->
              <template v-if="editingTask === task.id">
                <input
                  v-model="editTaskTitle"
                  class="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/50 mb-1.5"
                  @keydown.enter="saveEditTask(task)"
                  @keydown.escape="cancelEditTask"
                  autofocus
                />
                <textarea
                  v-model="editTaskDescription"
                  rows="2"
                  class="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-indigo-500/50 mb-1.5 resize-none"
                ></textarea>
                <div class="flex items-center justify-between">
                  <div class="flex gap-1">
                    <button
                      v-for="(label, key) in priorityLabels"
                      :key="key"
                      @click="editTaskPriority = key"
                      class="px-1.5 py-0.5 text-[10px] rounded-full border transition-colors"
                      :class="editTaskPriority === key
                        ? 'border-current text-white'
                        : 'border-neutral-700 text-neutral-500'"
                      :style="editTaskPriority === key ? { color: priorityColors[key], borderColor: priorityColors[key] + '80' } : {}"
                    >
                      {{ label }}
                    </button>
                  </div>
                  <div class="flex gap-1">
                    <button @click="cancelEditTask" class="px-2 py-0.5 text-[10px] text-neutral-500 hover:text-white">Cancelar</button>
                    <button @click="saveEditTask(task)" class="px-2 py-0.5 text-[10px] bg-indigo-500 text-white rounded">Guardar</button>
                  </div>
                </div>
              </template>

              <!-- View Mode -->
              <template v-else>
                <!-- Priority indicator -->
                <div
                  class="absolute top-0 left-0 w-0.5 h-full rounded-l-lg"
                  :style="{ backgroundColor: priorityColors[task.priority || 'medium'] }"
                ></div>

                <div class="flex items-start justify-between gap-2">
                  <span class="text-xs text-white leading-snug pl-1.5">{{ task.title }}</span>
                  <!-- Actions -->
                  <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      @click.stop="startEditTask(task)"
                      class="p-0.5 text-neutral-500 hover:text-indigo-400 transition-colors"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button
                      @click.stop="deleteTask(col.id, task.id)"
                      class="p-0.5 text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Description -->
                <p v-if="task.description" class="text-[10px] text-neutral-500 mt-1 pl-1.5 line-clamp-2">
                  {{ task.description }}
                </p>

                <!-- Footer -->
                <div class="flex items-center gap-2 mt-2 pl-1.5">
                  <span
                    class="text-[9px] px-1.5 py-0.5 rounded-full"
                    :style="{ color: priorityColors[task.priority || 'medium'], backgroundColor: priorityColors[task.priority || 'medium'] + '15', border: '1px solid ' + priorityColors[task.priority || 'medium'] + '30' }"
                  >
                    {{ priorityLabels[task.priority || 'medium'] }}
                  </span>
                </div>
              </template>
            </div>

            <!-- Drop zone indicator at bottom -->
            <div
              v-if="draggedTask && dragOverColumn === col.id && dragOverIndex === col.tasks.length"
              class="h-1 bg-indigo-500/30 rounded-full mx-2"
            ></div>
          </div>
        </div>

        <!-- Empty state / Add column button -->
        <div
          v-if="columns.length === 0"
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
