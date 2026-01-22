<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  task: { type: Object, default: null },
  boardTags: { type: Array, default: () => [] }
})

const emit = defineEmits(['save', 'cancel'])

const title = ref('')
const description = ref('')
const priority = ref('medium')
const dueDate = ref('')
const selectedTags = ref([])
const subtasks = ref([])
const newSubtask = ref('')
const showPreview = ref(false)

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

// Initialize form with task data if editing
watch(() => props.task, (t) => {
  if (t) {
    title.value = t.title || ''
    description.value = t.description || ''
    priority.value = t.priority || 'medium'
    dueDate.value = t.dueDate || ''
    selectedTags.value = [...(t.tags || [])]
    subtasks.value = (t.subtasks || []).map(s => ({ ...s }))
  } else {
    title.value = ''
    description.value = ''
    priority.value = 'medium'
    dueDate.value = ''
    selectedTags.value = []
    subtasks.value = []
  }
}, { immediate: true })

const renderedPreview = computed(() => {
  if (!description.value) return ''
  return DOMPurify.sanitize(marked.parse(description.value, { breaks: true, gfm: true }))
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

function toggleTag(tagId) {
  const idx = selectedTags.value.indexOf(tagId)
  if (idx >= 0) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(tagId)
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
}

nextTick(() => {
  const input = document.querySelector('.task-form-title')
  if (input) input.focus()
})
</script>

<template>
  <div class="bg-neutral-800/80 rounded-lg p-2.5 border border-indigo-500/30">
    <!-- Title -->
    <input
      v-model="title"
      placeholder="Título de la tarea"
      class="task-form-title w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 mb-2"
      @keydown.enter.prevent="save"
      @keydown.escape="emit('cancel')"
    />

    <!-- Description with markdown toggle -->
    <div class="mb-2">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] text-neutral-500">Descripción (Markdown)</span>
        <button
          @click="showPreview = !showPreview"
          class="text-[10px] px-1.5 py-0.5 rounded text-neutral-500 hover:text-indigo-400 transition-colors"
        >
          {{ showPreview ? 'Editar' : 'Preview' }}
        </button>
      </div>
      <textarea
        v-if="!showPreview"
        v-model="description"
        placeholder="Descripción (opcional, soporta Markdown)"
        rows="2"
        class="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 resize-none"
      ></textarea>
      <div
        v-else
        class="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1.5 text-xs text-neutral-300 min-h-[3rem] prose-micro"
        v-html="renderedPreview"
      ></div>
    </div>

    <!-- Priority -->
    <div class="flex items-center gap-1 mb-2">
      <button
        v-for="(label, key) in priorityLabels"
        :key="key"
        @click="priority = key"
        class="px-2 py-0.5 text-[10px] rounded-full border transition-colors"
        :class="priority === key
          ? 'border-current text-white'
          : 'border-neutral-700 text-neutral-500 hover:text-neutral-300'"
        :style="priority === key ? { color: priorityColors[key], borderColor: priorityColors[key] + '80' } : {}"
      >
        {{ label }}
      </button>
    </div>

    <!-- Due date -->
    <div class="flex items-center gap-2 mb-2">
      <span class="text-[10px] text-neutral-500">Fecha:</span>
      <input
        v-model="dueDate"
        type="date"
        class="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-white outline-none focus:border-indigo-500/50"
      />
      <button
        v-if="dueDate"
        @click="dueDate = ''"
        class="text-[10px] text-neutral-500 hover:text-red-400"
      >x</button>
    </div>

    <!-- Tags -->
    <div v-if="boardTags.length" class="flex items-center gap-1 mb-2 flex-wrap">
      <span class="text-[10px] text-neutral-500 mr-1">Tags:</span>
      <button
        v-for="tag in boardTags"
        :key="tag.id"
        @click="toggleTag(tag.id)"
        class="px-1.5 py-0.5 text-[10px] rounded-full border transition-all"
        :class="selectedTags.includes(tag.id)
          ? 'opacity-100'
          : 'opacity-40 hover:opacity-70'"
        :style="{ color: tag.color, borderColor: tag.color + '60', backgroundColor: selectedTags.includes(tag.id) ? tag.color + '20' : 'transparent' }"
      >
        {{ tag.name }}
      </button>
    </div>

    <!-- Subtasks -->
    <div class="mb-2">
      <div v-if="subtasks.length" class="space-y-1 mb-1.5">
        <div
          v-for="sub in subtasks"
          :key="sub.id"
          class="flex items-center gap-1.5 group/sub"
        >
          <input
            type="checkbox"
            v-model="sub.done"
            class="w-3 h-3 rounded border-neutral-600 bg-neutral-900 text-indigo-500 focus:ring-0 focus:ring-offset-0"
          />
          <span class="text-[10px] text-neutral-300 flex-1" :class="{ 'line-through text-neutral-600': sub.done }">
            {{ sub.title }}
          </span>
          <button
            @click="removeSubtask(sub.id)"
            class="text-neutral-600 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity"
          >
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <input
          v-model="newSubtask"
          placeholder="+ Subtarea"
          class="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50"
          @keydown.enter.prevent="addSubtask"
        />
        <button
          v-if="newSubtask.trim()"
          @click="addSubtask"
          class="px-1.5 py-0.5 text-[10px] bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
        >+</button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-1">
      <button @click="emit('cancel')" class="px-2 py-1 text-[10px] text-neutral-500 hover:text-white transition-colors">
        Cancelar
      </button>
      <button
        @click="save"
        :disabled="!title.trim()"
        class="px-2.5 py-1 text-[10px] bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded transition-colors"
      >
        {{ task ? 'Guardar' : 'Añadir' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.prose-micro :deep(p) { margin: 0; }
.prose-micro :deep(a) { color: #818cf8; }
.prose-micro :deep(code) { font-size: 9px; background: rgba(255,255,255,0.05); padding: 1px 3px; border-radius: 2px; }
</style>
