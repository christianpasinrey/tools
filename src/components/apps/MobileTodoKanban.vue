<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useKanbanStorage } from '../../composables/kanban/useKanbanStorage.js'

const storage = useKanbanStorage()
const { boards, currentBoardId, createBoard, genId } = storage

// === Board State ===
const currentBoard = ref(null)
const boardDataMap = ref({})

const columns = computed({
  get: () => currentBoard.value ? currentBoard.value.columns : [],
  set: (val) => { if (currentBoard.value) currentBoard.value.columns = val }
})

// Initialize
currentBoard.value = createBoard('Mi Tablero')

// === Current column (swipe navigation) ===
const currentColumnIndex = ref(0)
const currentColumn = computed(() => columns.value[currentColumnIndex.value] || null)

// Reset index when columns change
watch(columns, (cols) => {
  if (currentColumnIndex.value >= cols.length) {
    currentColumnIndex.value = Math.max(0, cols.length - 1)
  }
}, { deep: true })

// === Swipe handling ===
const touchStartX = ref(0)
const touchEndX = ref(0)
const hasMoved = ref(false)

const onTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchEndX.value = e.touches[0].clientX
  hasMoved.value = false
}

const onTouchMove = (e) => {
  touchEndX.value = e.touches[0].clientX
  // Solo marcar como movimiento si hay desplazamiento significativo
  if (Math.abs(touchEndX.value - touchStartX.value) > 10) {
    hasMoved.value = true
  }
}

const onTouchEnd = () => {
  // Solo procesar swipe si realmente hubo movimiento horizontal
  if (!hasMoved.value) return

  const diff = touchStartX.value - touchEndX.value
  const threshold = 80 // Threshold más alto para evitar swipes accidentales

  if (diff > threshold && currentColumnIndex.value < columns.value.length - 1) {
    currentColumnIndex.value++
  } else if (diff < -threshold && currentColumnIndex.value > 0) {
    currentColumnIndex.value--
  }
}

// === Task editing ===
const editingTask = ref(null)
const showTaskModal = ref(false)
const taskForm = ref({ title: '', description: '', priority: 'medium' })

const openTask = (task) => {
  editingTask.value = task
  taskForm.value = {
    title: task.title,
    description: task.description || '',
    priority: task.priority || 'medium'
  }
  showTaskModal.value = true
}

const openCreateTask = () => {
  editingTask.value = null
  taskForm.value = { title: '', description: '', priority: 'medium' }
  showTaskModal.value = true
}

const saveTask = () => {
  if (!taskForm.value.title.trim()) return

  if (editingTask.value) {
    Object.assign(editingTask.value, taskForm.value)
  } else {
    currentColumn.value.tasks.push({
      id: genId(),
      ...taskForm.value,
      createdAt: Date.now()
    })
  }
  showTaskModal.value = false
}

const deleteTask = (taskId) => {
  if (!currentColumn.value) return
  currentColumn.value.tasks = currentColumn.value.tasks.filter(t => t.id !== taskId)
  showTaskModal.value = false
}

// === Column management ===
const showColumnMenu = ref(false)
const editingColumnTitle = ref(false)
const columnTitleInput = ref('')

const startEditColumnTitle = () => {
  columnTitleInput.value = currentColumn.value?.title || ''
  editingColumnTitle.value = true
  showColumnMenu.value = false
}

const saveColumnTitle = () => {
  if (currentColumn.value && columnTitleInput.value.trim()) {
    currentColumn.value.title = columnTitleInput.value.trim()
  }
  editingColumnTitle.value = false
}

const addColumn = () => {
  columns.value.push({
    id: genId(),
    title: 'Nueva Columna',
    tasks: []
  })
  currentColumnIndex.value = columns.value.length - 1
  showColumnMenu.value = false
}

const deleteColumn = () => {
  if (columns.value.length <= 1) return
  columns.value.splice(currentColumnIndex.value, 1)
  if (currentColumnIndex.value >= columns.value.length) {
    currentColumnIndex.value = columns.value.length - 1
  }
  showColumnMenu.value = false
}

// === Move task to another column ===
const showMoveMenu = ref(false)
const taskToMove = ref(null)

const openMoveMenu = (task) => {
  taskToMove.value = task
  showMoveMenu.value = true
}

const moveTaskTo = (targetColIndex) => {
  if (!taskToMove.value || targetColIndex === currentColumnIndex.value) {
    showMoveMenu.value = false
    return
  }

  // Remove from current
  currentColumn.value.tasks = currentColumn.value.tasks.filter(t => t.id !== taskToMove.value.id)

  // Add to target
  columns.value[targetColIndex].tasks.push(taskToMove.value)

  showMoveMenu.value = false
  taskToMove.value = null
}

// Priority colors
const priorityColors = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30'
}

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
}
</script>

<template>
  <div class="flex flex-col h-full bg-neutral-950">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900">
      <div class="flex items-center gap-2">
        <h1 class="text-sm font-semibold text-white">{{ currentBoard?.name }}</h1>
        <span class="text-xs text-neutral-500">{{ columns.length }} columnas</span>
      </div>
      <button
        @click="addColumn"
        class="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <!-- Column tabs / indicators -->
    <div class="flex items-center gap-1 px-4 py-2 border-b border-neutral-800/50 bg-neutral-900/50 overflow-x-auto">
      <button
        v-for="(col, index) in columns"
        :key="col.id"
        @click="currentColumnIndex = index"
        class="px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all"
        :class="index === currentColumnIndex
          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          : 'text-neutral-500 hover:text-neutral-300'"
      >
        {{ col.title }}
        <span class="ml-1 text-neutral-600">({{ col.tasks.length }})</span>
      </button>
    </div>

    <!-- Column controls -->
    <div v-if="currentColumn" class="flex items-center justify-between px-4 py-2 border-b border-neutral-800/50">
      <div class="flex items-center gap-2">
        <template v-if="editingColumnTitle">
          <input
            v-model="columnTitleInput"
            @blur="saveColumnTitle"
            @keyup.enter="saveColumnTitle"
            class="px-2 py-1 text-sm bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-indigo-500"
            autofocus
          />
        </template>
        <template v-else>
          <h2 class="text-sm font-medium text-white">{{ currentColumn.title }}</h2>
          <span class="text-xs text-neutral-600">{{ currentColumn.tasks.length }} tareas</span>
        </template>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="startEditColumnTitle"
          class="p-1.5 text-neutral-500 hover:text-white rounded"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          @click="deleteColumn"
          :disabled="columns.length <= 1"
          class="p-1.5 text-neutral-500 hover:text-red-400 rounded disabled:opacity-30"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Tasks list (swipeable area) -->
    <div
      class="flex-1 overflow-y-auto"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div v-if="currentColumn" class="p-4 space-y-3 pb-24">
        <!-- Task cards -->
        <div
          v-for="task in currentColumn.tasks"
          :key="task.id"
          @click="openTask(task)"
          class="p-4 bg-neutral-900 border border-neutral-800 rounded-xl active:bg-neutral-800/50"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-medium text-white mb-1">{{ task.title }}</h3>
              <p v-if="task.description" class="text-xs text-neutral-500 line-clamp-2">{{ task.description }}</p>
            </div>
            <span
              class="px-2 py-0.5 text-[10px] font-medium rounded border shrink-0"
              :class="priorityColors[task.priority || 'medium']"
            >
              {{ priorityLabels[task.priority || 'medium'] }}
            </span>
          </div>

          <!-- Move button -->
          <button
            @click.stop="openMoveMenu(task)"
            class="mt-3 flex items-center gap-1 text-xs text-neutral-500 hover:text-indigo-400"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Mover
          </button>
        </div>

        <!-- Empty state -->
        <div v-if="currentColumn.tasks.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
          <div class="w-16 h-16 mb-4 rounded-2xl bg-neutral-800/50 flex items-center justify-center">
            <svg class="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="text-sm text-neutral-500">Sin tareas en esta columna</p>
          <p class="text-xs text-neutral-600 mt-1">Desliza para cambiar de columna</p>
        </div>
      </div>
    </div>

    <!-- FAB: Add task -->
    <button
      @click="openCreateTask"
      class="fixed bottom-24 right-4 w-14 h-14 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center z-50"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Task Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showTaskModal" class="fixed inset-0 z-[9999] bg-black/80" @click.self="showTaskModal = false">
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-4 pb-8 max-h-[80dvh] overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-white">
                {{ editingTask ? 'Editar tarea' : 'Nueva tarea' }}
              </h3>
              <button @click="showTaskModal = false" class="p-2 text-neutral-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs text-neutral-500 mb-1">Título</label>
                <input
                  v-model="taskForm.title"
                  type="text"
                  class="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="¿Qué necesitas hacer?"
                />
              </div>

              <div>
                <label class="block text-xs text-neutral-500 mb-1">Descripción</label>
                <textarea
                  v-model="taskForm.description"
                  rows="3"
                  class="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Detalles adicionales..."
                ></textarea>
              </div>

              <div>
                <label class="block text-xs text-neutral-500 mb-2">Prioridad</label>
                <div class="flex gap-2">
                  <button
                    v-for="(label, key) in priorityLabels"
                    :key="key"
                    @click="taskForm.priority = key"
                    class="flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all"
                    :class="taskForm.priority === key ? priorityColors[key] : 'bg-neutral-800 text-neutral-500 border-neutral-700'"
                  >
                    {{ label }}
                  </button>
                </div>
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  v-if="editingTask"
                  @click="deleteTask(editingTask.id)"
                  class="px-4 py-2.5 text-sm text-red-400 border border-red-500/30 rounded-lg"
                >
                  Eliminar
                </button>
                <button
                  @click="saveTask"
                  class="flex-1 px-4 py-2.5 text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg"
                >
                  {{ editingTask ? 'Guardar' : 'Crear tarea' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Move task modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showMoveMenu" class="fixed inset-0 z-[9999] bg-black/80" @click.self="showMoveMenu = false">
          <div class="absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-4 pb-8">
            <h3 class="text-base font-semibold text-white mb-4">Mover a...</h3>
            <div class="space-y-2">
              <button
                v-for="(col, index) in columns"
                :key="col.id"
                @click="moveTaskTo(index)"
                class="w-full px-4 py-3 text-left text-sm rounded-lg transition-all"
                :class="index === currentColumnIndex
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-neutral-800 text-white hover:bg-neutral-700'"
              >
                {{ col.title }}
                <span v-if="index === currentColumnIndex" class="text-xs text-indigo-400/60 ml-2">(actual)</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: translateY(100%);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
