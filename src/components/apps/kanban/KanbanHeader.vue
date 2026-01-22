<script setup>
import { ref } from 'vue'

const props = defineProps({
  boardName: { type: String, default: 'Mi Tablero' },
  boards: { type: Array, default: () => [] },
  taskCount: { type: Number, default: 0 },
  searchQuery: { type: String, default: '' },
  hasActiveFilters: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false }
})

const emit = defineEmits([
  'add-column', 'toggle-filters', 'toggle-export',
  'lock', 'select-board', 'create-board', 'update-search'
])

const showBoardMenu = ref(false)
const newBoardName = ref('')
const searchFocused = ref(false)

function onSelectBoard(id) {
  emit('select-board', id)
  showBoardMenu.value = false
}

function onCreateBoard() {
  if (!newBoardName.value.trim()) return
  emit('create-board', newBoardName.value.trim())
  newBoardName.value = ''
  showBoardMenu.value = false
}
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
    <!-- Left: Board selector -->
    <div class="flex items-center gap-3 relative">
      <button
        @click="showBoardMenu = !showBoardMenu"
        class="flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-white hover:bg-neutral-800 rounded transition-colors"
      >
        {{ boardName }}
        <svg class="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      <span class="text-xs text-neutral-500">{{ taskCount }} tareas</span>

      <!-- Board dropdown -->
      <div
        v-if="showBoardMenu"
        class="absolute top-full left-0 mt-1 w-56 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden"
      >
        <div class="py-1">
          <button
            v-for="board in boards"
            :key="board.id"
            @click="onSelectBoard(board.id)"
            class="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center justify-between"
          >
            <span>{{ board.name }}</span>
          </button>
        </div>
        <div class="border-t border-neutral-700 p-2">
          <div class="flex gap-1">
            <input
              v-model="newBoardName"
              placeholder="Nuevo tablero..."
              class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[10px] text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50"
              @keydown.enter="onCreateBoard"
            />
            <button
              @click="onCreateBoard"
              :disabled="!newBoardName.trim()"
              class="px-2 py-1 text-[10px] bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 text-white rounded"
            >+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <!-- Search -->
      <div class="relative">
        <input
          :value="searchQuery"
          @input="emit('update-search', $event.target.value)"
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          placeholder="Buscar..."
          class="bg-neutral-800/50 border border-neutral-700 rounded px-2 py-1 text-[10px] text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 transition-all"
          :class="searchFocused || searchQuery ? 'w-32' : 'w-20'"
        />
      </div>

      <!-- Filter toggle -->
      <button
        @click="emit('toggle-filters')"
        class="relative p-1.5 text-neutral-500 hover:text-indigo-400 transition-colors"
        :class="{ 'text-indigo-400': hasActiveFilters }"
        title="Filtros"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
        </svg>
        <span
          v-if="hasActiveFilters"
          class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"
        ></span>
      </button>

      <!-- Export -->
      <button
        @click="emit('toggle-export')"
        class="p-1.5 text-neutral-500 hover:text-indigo-400 transition-colors"
        title="Export / Import"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </button>

      <!-- Lock -->
      <button
        @click="emit('lock')"
        class="p-1.5 transition-colors"
        :class="isLocked ? 'text-green-500 hover:text-green-400' : 'text-neutral-500 hover:text-amber-400'"
        :title="isLocked ? 'Bloqueado' : 'Bloquear'"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!isLocked" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </button>

      <!-- Add Column -->
      <button
        @click="emit('add-column')"
        class="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Columna
      </button>
    </div>
  </div>
</template>
