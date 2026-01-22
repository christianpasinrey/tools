<script setup>
import { ref, nextTick } from 'vue'
import KanbanTaskCard from './KanbanTaskCard.vue'

const props = defineProps({
  column: { type: Object, required: true },
  colIndex: { type: Number, required: true },
  boardTags: { type: Array, default: () => [] },
  dragOverColumn: { type: String, default: null },
  dragOverIndex: { type: Number, default: -1 },
  draggedColumn: { type: Number, default: null },
  dragOverColumnIndex: { type: Number, default: -1 },
  draggedTask: { type: Object, default: null }
})

const emit = defineEmits([
  'delete-column', 'update-title',
  'open-task', 'create-task', 'delete-task',
  'task-dragstart', 'task-dragend',
  'column-dragover', 'column-drop',
  'column-dragstart', 'column-dragover-header', 'column-drop-header', 'column-dragend'
])

const editingTitle = ref(false)
const titleInput = ref('')

function startEditTitle() {
  editingTitle.value = true
  titleInput.value = props.column.title
  nextTick(() => {
    const input = document.querySelector('.col-title-input-' + props.column.id)
    if (input) input.focus()
  })
}

function saveTitle() {
  if (titleInput.value.trim()) {
    emit('update-title', props.column.id, titleInput.value.trim())
  }
  editingTitle.value = false
}

function deleteColumn() {
  if (props.column.tasks.length > 0) {
    if (!confirm(`Eliminar "${props.column.title}" con ${props.column.tasks.length} tarea(s)?`)) return
  }
  emit('delete-column', props.column.id)
}
</script>

<template>
  <div
    class="flex flex-col w-72 bg-neutral-900/50 rounded-xl border border-neutral-800 shrink-0 max-h-full transition-all"
    :class="{
      'border-indigo-500/50 scale-[1.02]': dragOverColumnIndex === colIndex && draggedColumn !== null,
      'opacity-50': draggedColumn === colIndex
    }"
    @dragover="emit('column-dragover', $event, column.id, column.tasks.length)"
    @drop="emit('column-drop', $event, column.id, -1)"
  >
    <!-- Column Header -->
    <div
      class="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800 cursor-grab active:cursor-grabbing shrink-0"
      draggable="true"
      @dragstart="emit('column-dragstart', $event, colIndex)"
      @dragover="emit('column-dragover-header', $event, colIndex)"
      @drop="emit('column-drop-header', $event, colIndex)"
      @dragend="emit('column-dragend')"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <svg class="w-3.5 h-3.5 text-neutral-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
        </svg>
        <template v-if="editingTitle">
          <input
            v-model="titleInput"
            @keydown.enter="saveTitle"
            @keydown.escape="editingTitle = false"
            @blur="saveTitle"
            :class="'col-title-input-' + column.id"
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-indigo-500/50"
          />
        </template>
        <template v-else>
          <span
            class="text-xs font-medium text-neutral-300 truncate cursor-pointer hover:text-white"
            @dblclick="startEditTitle"
          >
            {{ column.title }}
          </span>
          <span class="text-[10px] text-neutral-600 shrink-0">{{ column.tasks.length }}</span>
        </template>
      </div>
      <div class="flex items-center gap-1 shrink-0 ml-2">
        <button
          @click="emit('create-task', column.id)"
          class="p-1 text-neutral-600 hover:text-indigo-400 transition-colors"
          title="Añadir tarea"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
        <button
          @click="deleteColumn"
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
      <div
        v-for="(task, taskIndex) in column.tasks"
        :key="task.id"
        :class="{
          'border-indigo-500/50 bg-indigo-500/5 rounded-lg': dragOverColumn === column.id && dragOverIndex === taskIndex
        }"
        @dragover="emit('column-dragover', $event, column.id, taskIndex)"
        @drop.stop="emit('column-drop', $event, column.id, taskIndex)"
        @click="emit('open-task', task, column.id)"
      >
        <KanbanTaskCard
          :task="task"
          :board-tags="boardTags"
          @delete="(id) => emit('delete-task', column.id, id)"
          @dragstart="(e) => emit('task-dragstart', e, task, column.id)"
          @dragend="(e) => emit('task-dragend', e)"
        />
      </div>

      <!-- Drop zone indicator at bottom -->
      <div
        v-if="draggedTask && dragOverColumn === column.id && dragOverIndex === column.tasks.length"
        class="h-1 bg-indigo-500/30 rounded-full mx-2"
      ></div>
    </div>
  </div>
</template>
