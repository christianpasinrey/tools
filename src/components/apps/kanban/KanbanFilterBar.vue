<script setup>
import { ref } from 'vue'

const props = defineProps({
  priority: { type: String, default: null },
  tags: { type: Array, default: () => [] },
  dateRange: { type: Object, default: () => ({ from: null, to: null }) },
  boardTags: { type: Array, default: () => [] }
})

const emit = defineEmits(['update-priority', 'update-tags', 'update-date-range', 'clear', 'add-tag', 'remove-tag'])

const showTagManager = ref(false)
const newTagName = ref('')
const newTagColor = ref('#818cf8')

const tagColors = ['#ef4444', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#818cf8', '#a855f7', '#ec4899']

const priorityOptions = [
  { value: null, label: 'Todas' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' }
]

function toggleTag(tagId) {
  const current = [...props.tags]
  const idx = current.indexOf(tagId)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(tagId)
  emit('update-tags', current)
}

function addTag() {
  if (!newTagName.value.trim()) return
  emit('add-tag', { name: newTagName.value.trim(), color: newTagColor.value })
  newTagName.value = ''
}

function updateFrom(val) {
  emit('update-date-range', { ...props.dateRange, from: val || null })
}

function updateTo(val) {
  emit('update-date-range', { ...props.dateRange, to: val || null })
}
</script>

<template>
  <div class="flex items-center gap-3 px-4 py-2 border-b border-neutral-800 bg-neutral-900/30 flex-wrap">
    <!-- Priority -->
    <div class="flex items-center gap-1">
      <span class="text-[10px] text-neutral-500">Prioridad:</span>
      <select
        :value="priority"
        @change="emit('update-priority', $event.target.value || null)"
        class="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-indigo-500/50"
      >
        <option v-for="opt in priorityOptions" :key="opt.label" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <!-- Tags filter -->
    <div class="flex items-center gap-1">
      <span class="text-[10px] text-neutral-500">Tags:</span>
      <button
        v-for="tag in boardTags"
        :key="tag.id"
        @click="toggleTag(tag.id)"
        class="px-1.5 py-0.5 text-[9px] rounded-full border transition-all"
        :class="tags.includes(tag.id) ? 'opacity-100' : 'opacity-40 hover:opacity-70'"
        :style="{ color: tag.color, borderColor: tag.color + '60', backgroundColor: tags.includes(tag.id) ? tag.color + '20' : 'transparent' }"
      >
        {{ tag.name }}
      </button>
      <button
        @click="showTagManager = !showTagManager"
        class="px-1 py-0.5 text-[9px] text-neutral-500 hover:text-indigo-400 border border-neutral-700 rounded-full transition-colors"
        title="Gestionar tags"
      >+</button>
    </div>

    <!-- Date range -->
    <div class="flex items-center gap-1">
      <span class="text-[10px] text-neutral-500">Desde:</span>
      <input
        type="date"
        :value="dateRange.from"
        @input="updateFrom($event.target.value)"
        class="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-indigo-500/50"
      />
      <span class="text-[10px] text-neutral-500">Hasta:</span>
      <input
        type="date"
        :value="dateRange.to"
        @input="updateTo($event.target.value)"
        class="bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-indigo-500/50"
      />
    </div>

    <!-- Clear -->
    <button
      @click="emit('clear')"
      class="text-[10px] text-neutral-500 hover:text-red-400 transition-colors ml-auto"
    >Limpiar</button>

    <!-- Tag Manager (inline) -->
    <div v-if="showTagManager" class="w-full flex items-center gap-2 mt-1 pt-2 border-t border-neutral-800">
      <span class="text-[10px] text-neutral-500">Nuevo tag:</span>
      <input
        v-model="newTagName"
        placeholder="Nombre"
        class="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-[10px] text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 w-24"
        @keydown.enter="addTag"
      />
      <div class="flex gap-0.5">
        <button
          v-for="c in tagColors"
          :key="c"
          @click="newTagColor = c"
          class="w-3.5 h-3.5 rounded-full border-2 transition-transform"
          :class="newTagColor === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'"
          :style="{ backgroundColor: c }"
        ></button>
      </div>
      <button
        @click="addTag"
        :disabled="!newTagName.trim()"
        class="px-2 py-0.5 text-[10px] bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 text-white rounded"
      >Crear</button>

      <!-- Existing tags with delete -->
      <div class="flex items-center gap-1 ml-2">
        <span
          v-for="tag in boardTags"
          :key="tag.id"
          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] rounded-full border"
          :style="{ color: tag.color, borderColor: tag.color + '60' }"
        >
          {{ tag.name }}
          <button @click="emit('remove-tag', tag.id)" class="hover:text-red-400">&times;</button>
        </span>
      </div>
    </div>
  </div>
</template>
