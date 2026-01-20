<script setup>
const props = defineProps({
  elements: Array,
  selectedIds: Array,
  themeColor: String
})

const emit = defineEmits([
  'select-element',
  'toggle-visibility',
  'toggle-lock',
  'delete-element',
  'reorder'
])

// Dragging state
let draggedIndex = null

const handleDragStart = (index, event) => {
  draggedIndex = index
  event.dataTransfer.effectAllowed = 'move'
}

const handleDragOver = (index, event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

const handleDrop = (index) => {
  if (draggedIndex !== null && draggedIndex !== index) {
    emit('reorder', draggedIndex, index)
  }
  draggedIndex = null
}

const getTypeIcon = (type) => {
  switch (type) {
    case 'rect':
      return 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z'
    case 'ellipse':
      return 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'
    case 'line':
      return 'M4 20L20 4'
    case 'polygon':
      return 'M12 2l9 7-3.5 9h-11L3 9l9-7z'
    case 'path':
      return 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
    case 'text':
      return 'M4 6h16M8 6v12M16 6v12M6 18h4M14 18h4'
    default:
      return 'M4 6h16v12H4V6z'
  }
}

// Reversed elements for display (top layers first)
const reversedElements = () => {
  return [...props.elements].reverse()
}

const getOriginalIndex = (reversedIndex) => {
  return props.elements.length - 1 - reversedIndex
}
</script>

<template>
  <div class="w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col overflow-hidden">
    <div class="p-3 border-b border-neutral-800 flex items-center justify-between">
      <h3 class="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Layers</h3>
      <span class="text-xs text-neutral-600">{{ elements.length }}</span>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div
        v-for="(element, idx) in reversedElements()"
        :key="element.id"
        :draggable="!element.locked"
        @dragstart="handleDragStart(getOriginalIndex(idx), $event)"
        @dragover="handleDragOver(getOriginalIndex(idx), $event)"
        @drop="handleDrop(getOriginalIndex(idx))"
        @click="emit('select-element', element.id, $event.ctrlKey || $event.metaKey)"
        class="group flex items-center gap-2 px-3 py-2 cursor-pointer border-l-2 transition-colors"
        :class="[
          selectedIds.includes(element.id)
            ? 'bg-neutral-800 border-l-current'
            : 'border-l-transparent hover:bg-neutral-800/50'
        ]"
        :style="selectedIds.includes(element.id) ? { borderLeftColor: themeColor } : {}"
      >
        <!-- Type Icon -->
        <svg
          class="w-4 h-4 shrink-0"
          :class="element.visible ? 'text-neutral-400' : 'text-neutral-600'"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="1.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" :d="getTypeIcon(element.type)" />
        </svg>

        <!-- Name -->
        <span
          class="flex-1 text-xs truncate"
          :class="element.visible ? 'text-neutral-300' : 'text-neutral-500 line-through'"
        >
          {{ element.name }}
        </span>

        <!-- Actions -->
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Visibility -->
          <button
            @click.stop="emit('toggle-visibility', element.id)"
            class="p-1 rounded hover:bg-neutral-700 transition-colors"
            :title="element.visible ? 'Hide' : 'Show'"
          >
            <svg
              class="w-3.5 h-3.5"
              :class="element.visible ? 'text-neutral-400' : 'text-neutral-600'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="element.visible"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                v-if="element.visible"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
          </button>

          <!-- Lock -->
          <button
            @click.stop="emit('toggle-lock', element.id)"
            class="p-1 rounded hover:bg-neutral-700 transition-colors"
            :title="element.locked ? 'Unlock' : 'Lock'"
          >
            <svg
              class="w-3.5 h-3.5"
              :class="element.locked ? 'text-amber-500' : 'text-neutral-400'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="element.locked"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          </button>

          <!-- Delete -->
          <button
            @click.stop="emit('delete-element', element.id)"
            class="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="elements.length === 0" class="p-4 text-center text-neutral-500 text-xs">
        No elements yet.<br>Use the drawing tools to create shapes.
      </div>
    </div>
  </div>
</template>
