<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  task: { type: Object, default: null },
  columnId: { type: String, default: null },
  columnName: { type: String, default: '' },
  boardTags: { type: Array, default: () => [] },
  mode: { type: String, default: 'view' } // 'view' | 'edit' | 'create'
})

const emit = defineEmits(['close', 'save', 'delete'])

const editing = ref(false)
const title = ref('')
const description = ref('')
const priority = ref('medium')
const dueDate = ref('')
const selectedTags = ref([])
const subtasks = ref([])
const newSubtask = ref('')
const showDescPreview = ref(false)

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

// Initialize form
watch(() => [props.task, props.mode], () => {
  if (props.mode === 'create') {
    editing.value = true
    title.value = ''
    description.value = ''
    priority.value = 'medium'
    dueDate.value = ''
    selectedTags.value = []
    subtasks.value = []
    nextTick(() => {
      const input = document.querySelector('.sidebar-title-input')
      if (input) input.focus()
    })
  } else if (props.task) {
    editing.value = props.mode === 'edit'
    title.value = props.task.title || ''
    description.value = props.task.description || ''
    priority.value = props.task.priority || 'medium'
    dueDate.value = props.task.dueDate || ''
    selectedTags.value = [...(props.task.tags || [])]
    subtasks.value = (props.task.subtasks || []).map(s => ({ ...s }))
  }
}, { immediate: true })

const renderedDescription = computed(() => {
  if (!description.value) return ''
  return DOMPurify.sanitize(marked.parse(description.value, { breaks: true, gfm: true }))
})

const taskTags = computed(() => {
  return selectedTags.value
    .map(tagId => props.boardTags.find(t => t.id === tagId))
    .filter(Boolean)
})

const subtaskProgress = computed(() => {
  if (!subtasks.value.length) return null
  const done = subtasks.value.filter(s => s.done).length
  return { done, total: subtasks.value.length, percent: Math.round((done / subtasks.value.length) * 100) }
})

const dueDateInfo = computed(() => {
  if (!dueDate.value) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate.value + 'T00:00:00')
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  let status = 'future'
  if (diffDays < 0) status = 'overdue'
  else if (diffDays <= 2) status = 'soon'
  return { status, formatted: due.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), diffDays }
})

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function addSubtask() {
  if (!newSubtask.value.trim()) return
  subtasks.value.push({ id: genId(), title: newSubtask.value.trim(), done: false })
  newSubtask.value = ''
}

function removeSubtask(id) {
  subtasks.value = subtasks.value.filter(s => s.id !== id)
}

function toggleSubtask(sub) {
  sub.done = !sub.done
  if (!editing.value) {
    // Auto-save subtask toggle in view mode
    save()
  }
}

function toggleTag(tagId) {
  const idx = selectedTags.value.indexOf(tagId)
  if (idx >= 0) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tagId)
}

function startEditing() {
  editing.value = true
}

function save() {
  if (!title.value.trim()) return
  emit('save', {
    title: title.value.trim(),
    description: description.value.trim(),
    priority: priority.value,
    dueDate: dueDate.value || null,
    tags: [...selectedTags.value],
    subtasks: subtasks.value.map(s => ({ ...s }))
  })
  if (props.mode === 'create') {
    emit('close')
  } else {
    editing.value = false
  }
}

function cancel() {
  if (props.mode === 'create') {
    emit('close')
  } else {
    editing.value = false
    // Reset to original
    if (props.task) {
      title.value = props.task.title || ''
      description.value = props.task.description || ''
      priority.value = props.task.priority || 'medium'
      dueDate.value = props.task.dueDate || ''
      selectedTags.value = [...(props.task.tags || [])]
      subtasks.value = (props.task.subtasks || []).map(s => ({ ...s }))
    }
  }
}

function onDelete() {
  if (confirm('Eliminar esta tarea?')) {
    emit('delete')
  }
}
</script>

<template>
  <div class="fixed inset-0 z-40 flex justify-end" @click.self="emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>

    <!-- Sidebar -->
    <div class="relative w-96 max-w-[90vw] h-full bg-neutral-900 border-l border-neutral-700 shadow-2xl flex flex-col overflow-hidden animate-slide-in">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-neutral-500 px-1.5 py-0.5 bg-neutral-800 rounded">{{ columnName }}</span>
          <span v-if="mode === 'create'" class="text-xs text-indigo-400">Nueva tarea</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            v-if="!editing && mode !== 'create'"
            @click="startEditing"
            class="p-1.5 text-neutral-500 hover:text-indigo-400 transition-colors"
            title="Editar"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button
            v-if="mode !== 'create'"
            @click="onDelete"
            class="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
          <button @click="emit('close')" class="p-1.5 text-neutral-500 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Title -->
        <div>
          <input
            v-if="editing"
            v-model="title"
            placeholder="Título de la tarea"
            class="sidebar-title-input w-full bg-transparent border-none text-base font-medium text-white placeholder-neutral-600 outline-none focus:ring-0 p-0"
            @keydown.enter.prevent="save"
          />
          <h3 v-else class="text-base font-medium text-white">{{ title }}</h3>
        </div>

        <!-- Priority -->
        <div>
          <label class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5 block">Prioridad</label>
          <div v-if="editing" class="flex gap-1.5">
            <button
              v-for="(label, key) in priorityLabels"
              :key="key"
              @click="priority = key"
              class="px-3 py-1 text-xs rounded-md border transition-all"
              :class="priority === key ? 'text-white font-medium' : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'"
              :style="priority === key ? { color: '#fff', backgroundColor: priorityColors[key] + '25', borderColor: priorityColors[key] + '80' } : {}"
            >
              {{ label }}
            </button>
          </div>
          <span
            v-else
            class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
            :style="{ color: priorityColors[priority], backgroundColor: priorityColors[priority] + '15', border: '1px solid ' + priorityColors[priority] + '30' }"
          >
            <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: priorityColors[priority] }"></span>
            {{ priorityLabels[priority] }}
          </span>
        </div>

        <!-- Due Date -->
        <div>
          <label class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5 block">Fecha</label>
          <div v-if="editing" class="flex items-center gap-2">
            <input
              v-model="dueDate"
              type="date"
              class="bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
            />
            <button v-if="dueDate" @click="dueDate = ''" class="text-xs text-neutral-500 hover:text-red-400">Quitar</button>
          </div>
          <div v-else-if="dueDateInfo" class="flex items-center gap-2">
            <span
              class="text-xs px-2 py-0.5 rounded-md border flex items-center gap-1"
              :class="{
                'bg-red-500/15 text-red-400 border-red-500/30': dueDateInfo.status === 'overdue',
                'bg-amber-500/15 text-amber-400 border-amber-500/30': dueDateInfo.status === 'soon',
                'bg-green-500/15 text-green-400 border-green-500/30': dueDateInfo.status === 'future'
              }"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              {{ dueDateInfo.formatted }}
            </span>
            <span v-if="dueDateInfo.status === 'overdue'" class="text-[10px] text-red-400">Vencida</span>
            <span v-else-if="dueDateInfo.status === 'soon'" class="text-[10px] text-amber-400">Pronto</span>
          </div>
          <span v-else class="text-xs text-neutral-600">Sin fecha</span>
        </div>

        <!-- Tags -->
        <div>
          <label class="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5 block">Tags</label>
          <div v-if="editing && boardTags.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in boardTags"
              :key="tag.id"
              @click="toggleTag(tag.id)"
              class="px-2 py-0.5 text-[11px] rounded-full border transition-all"
              :class="selectedTags.includes(tag.id) ? 'opacity-100' : 'opacity-40 hover:opacity-70'"
              :style="{ color: tag.color, borderColor: tag.color + '60', backgroundColor: selectedTags.includes(tag.id) ? tag.color + '20' : 'transparent' }"
            >
              {{ tag.name }}
            </button>
          </div>
          <div v-else-if="taskTags.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in taskTags"
              :key="tag.id"
              class="px-2 py-0.5 text-[11px] rounded-full border"
              :style="{ color: tag.color, borderColor: tag.color + '60', backgroundColor: tag.color + '15' }"
            >
              {{ tag.name }}
            </span>
          </div>
          <span v-else class="text-xs text-neutral-600">Sin tags</span>
        </div>

        <!-- Description -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[10px] text-neutral-500 uppercase tracking-wider">Descripcion</label>
            <button
              v-if="editing"
              @click="showDescPreview = !showDescPreview"
              class="text-[10px] text-neutral-500 hover:text-indigo-400 transition-colors"
            >
              {{ showDescPreview ? 'Editar' : 'Preview' }}
            </button>
          </div>
          <div v-if="editing && !showDescPreview">
            <textarea
              v-model="description"
              placeholder="Descripcion (Markdown soportado)"
              rows="4"
              class="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 resize-none font-mono"
            ></textarea>
          </div>
          <div
            v-else-if="description"
            class="text-xs text-neutral-300 leading-relaxed prose-sidebar"
            v-html="renderedDescription"
          ></div>
          <span v-else class="text-xs text-neutral-600 italic">Sin descripcion</span>
        </div>

        <!-- Subtasks -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[10px] text-neutral-500 uppercase tracking-wider">
              Subtareas
              <span v-if="subtaskProgress" class="text-neutral-600 normal-case">
                ({{ subtaskProgress.done }}/{{ subtaskProgress.total }})
              </span>
            </label>
          </div>

          <!-- Progress bar -->
          <div v-if="subtaskProgress" class="w-full h-1.5 bg-neutral-800 rounded-full mb-3 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="subtaskProgress.percent === 100 ? 'bg-green-500' : 'bg-indigo-500'"
              :style="{ width: subtaskProgress.percent + '%' }"
            ></div>
          </div>

          <!-- Subtask list -->
          <div class="space-y-1">
            <div
              v-for="sub in subtasks"
              :key="sub.id"
              class="flex items-center gap-2 group/sub py-1 px-2 rounded hover:bg-neutral-800/50 -mx-2"
            >
              <button
                @click="toggleSubtask(sub)"
                class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                :class="sub.done ? 'bg-indigo-500 border-indigo-500' : 'border-neutral-600 hover:border-indigo-500'"
              >
                <svg v-if="sub.done" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </button>
              <span class="text-xs flex-1" :class="sub.done ? 'line-through text-neutral-600' : 'text-neutral-300'">
                {{ sub.title }}
              </span>
              <button
                v-if="editing"
                @click="removeSubtask(sub.id)"
                class="text-neutral-600 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Add subtask -->
          <div v-if="editing" class="flex items-center gap-1.5 mt-2">
            <input
              v-model="newSubtask"
              placeholder="+ Añadir subtarea"
              class="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50"
              @keydown.enter.prevent="addSubtask"
            />
            <button
              v-if="newSubtask.trim()"
              @click="addSubtask"
              class="px-2 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded-md transition-colors"
            >+</button>
          </div>
        </div>

        <!-- Created at -->
        <div v-if="task && task.createdAt" class="pt-2 border-t border-neutral-800">
          <span class="text-[10px] text-neutral-600">
            Creada {{ new Date(task.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>
      </div>

      <!-- Footer actions -->
      <div v-if="editing" class="shrink-0 px-4 py-3 border-t border-neutral-800 flex items-center justify-between">
        <button @click="cancel" class="px-3 py-1.5 text-xs text-neutral-500 hover:text-white transition-colors">
          Cancelar
        </button>
        <button
          @click="save"
          :disabled="!title.trim()"
          class="px-4 py-1.5 text-xs bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-md font-medium transition-colors"
        >
          {{ mode === 'create' ? 'Crear tarea' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.2s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.prose-sidebar :deep(p) { margin: 0 0 0.5rem 0; }
.prose-sidebar :deep(a) { color: #818cf8; text-decoration: underline; }
.prose-sidebar :deep(code) { font-size: 11px; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius: 3px; }
.prose-sidebar :deep(pre) { background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px; margin: 0.5rem 0; overflow-x: auto; }
.prose-sidebar :deep(pre code) { background: none; padding: 0; }
.prose-sidebar :deep(ul), .prose-sidebar :deep(ol) { margin: 0.25rem 0; padding-left: 1.25rem; }
.prose-sidebar :deep(li) { margin: 0.125rem 0; }
.prose-sidebar :deep(h1), .prose-sidebar :deep(h2), .prose-sidebar :deep(h3) { font-size: 0.875rem; font-weight: 600; margin: 0.75rem 0 0.25rem 0; }
.prose-sidebar :deep(blockquote) { border-left: 2px solid #4f46e5; padding-left: 0.75rem; margin: 0.5rem 0; color: #a3a3a3; }
.prose-sidebar :deep(strong) { color: #fff; }
</style>
