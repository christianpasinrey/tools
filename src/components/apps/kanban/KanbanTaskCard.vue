<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  task: { type: Object, required: true },
  boardTags: { type: Array, default: () => [] }
})

const emit = defineEmits(['delete', 'dragstart', 'dragend'])

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

const renderedDescription = computed(() => {
  if (!props.task.description) return ''
  return DOMPurify.sanitize(marked.parse(props.task.description, { breaks: true, gfm: true }))
})

const taskTags = computed(() => {
  if (!props.task.tags || !props.task.tags.length) return []
  return props.task.tags
    .map(tagId => props.boardTags.find(t => t.id === tagId))
    .filter(Boolean)
})

const subtaskProgress = computed(() => {
  if (!props.task.subtasks || !props.task.subtasks.length) return null
  const done = props.task.subtasks.filter(s => s.done).length
  const total = props.task.subtasks.length
  return { done, total, percent: Math.round((done / total) * 100) }
})

const dueDateInfo = computed(() => {
  if (!props.task.dueDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(props.task.dueDate + 'T00:00:00')
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  let status = 'future'
  if (diffDays < 0) status = 'overdue'
  else if (diffDays <= 2) status = 'soon'

  const formatted = due.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return { status, formatted, diffDays }
})

const dueDateClasses = computed(() => {
  if (!dueDateInfo.value) return ''
  const map = {
    overdue: 'bg-red-500/15 text-red-400 border-red-500/30',
    soon: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    future: 'bg-green-500/15 text-green-400 border-green-500/30'
  }
  return map[dueDateInfo.value.status]
})

function onDragStart(e) {
  emit('dragstart', e)
  e.target.classList.add('opacity-50')
}

function onDragEnd(e) {
  e.target.classList.remove('opacity-50')
  emit('dragend', e)
}
</script>

<template>
  <div
    class="group relative bg-neutral-800/60 hover:bg-neutral-800 rounded-lg p-2.5 border border-neutral-700/50 hover:border-neutral-600 cursor-grab active:cursor-grabbing transition-all"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- Priority indicator -->
    <div
      class="absolute top-0 left-0 w-0.5 h-full rounded-l-lg"
      :style="{ backgroundColor: priorityColors[task.priority || 'medium'] }"
    ></div>

    <div class="flex items-start justify-between gap-2">
      <span class="text-xs text-white leading-snug pl-1.5">{{ task.title }}</span>
      <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          @click.stop="emit('delete', task.id)"
          class="p-0.5 text-neutral-500 hover:text-red-400 transition-colors"
          title="Eliminar"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Description (markdown rendered, truncated) -->
    <div
      v-if="task.description"
      class="text-[10px] text-neutral-500 mt-1 pl-1.5 line-clamp-2 prose-micro"
      v-html="renderedDescription"
    ></div>

    <!-- Tags + Subtask progress -->
    <div v-if="taskTags.length || subtaskProgress" class="flex items-center gap-1.5 mt-2 pl-1.5 flex-wrap">
      <span
        v-for="tag in taskTags"
        :key="tag.id"
        class="text-[9px] px-1.5 py-0.5 rounded-full border"
        :style="{ color: tag.color, backgroundColor: tag.color + '15', borderColor: tag.color + '30' }"
      >
        {{ tag.name }}
      </span>
      <span
        v-if="subtaskProgress"
        class="text-[9px] text-neutral-500 flex items-center gap-1"
      >
        <span class="inline-block w-8 h-1 bg-neutral-700 rounded-full overflow-hidden">
          <span class="block h-full bg-indigo-500 rounded-full" :style="{ width: subtaskProgress.percent + '%' }"></span>
        </span>
        {{ subtaskProgress.done }}/{{ subtaskProgress.total }}
      </span>
    </div>

    <!-- Footer: due date + priority -->
    <div class="flex items-center gap-2 mt-2 pl-1.5">
      <span
        v-if="dueDateInfo"
        class="text-[9px] px-1.5 py-0.5 rounded-full border flex items-center gap-0.5"
        :class="dueDateClasses"
      >
        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        {{ dueDateInfo.formatted }}
      </span>
      <span
        class="text-[9px] px-1.5 py-0.5 rounded-full"
        :style="{ color: priorityColors[task.priority || 'medium'], backgroundColor: priorityColors[task.priority || 'medium'] + '15', border: '1px solid ' + priorityColors[task.priority || 'medium'] + '30' }"
      >
        {{ priorityLabels[task.priority || 'medium'] }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.prose-micro :deep(p) { margin: 0; }
.prose-micro :deep(a) { color: #818cf8; }
.prose-micro :deep(code) { font-size: 9px; background: rgba(255,255,255,0.05); padding: 1px 3px; border-radius: 2px; }
.prose-micro :deep(ul), .prose-micro :deep(ol) { margin: 0; padding-left: 12px; }
</style>
