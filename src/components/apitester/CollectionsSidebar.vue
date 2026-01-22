<script setup>
import { ref } from 'vue'

const props = defineProps({
  collections: Array,
  history: Array,
  sidebarTab: String,
  getMethodColor: Function
})

const emit = defineEmits([
  'update:sidebarTab', 'createCollection', 'renameCollection',
  'deleteCollection', 'toggleCollection', 'loadRequest',
  'deleteRequest', 'loadHistory', 'clearHistory',
  'exportPostman', 'exportHoppscotch'
])

const editingId = ref(null)
const editingName = ref('')

function startRename(col) {
  editingId.value = col.id
  editingName.value = col.name
}

function finishRename(id) {
  if (editingName.value.trim()) {
    emit('renameCollection', id, editingName.value.trim())
  }
  editingId.value = null
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function truncateUrl(url) {
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url?.slice(0, 40) || ''
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-900/50 border-r border-neutral-800">
    <!-- Sidebar Tabs -->
    <div class="flex border-b border-neutral-800">
      <button
        @click="emit('update:sidebarTab', 'collections')"
        class="flex-1 px-3 py-2 text-xs font-medium transition-colors"
        :class="sidebarTab === 'collections' ? 'text-white border-b-2 border-amber-500' : 'text-neutral-500 hover:text-neutral-300'"
      >
        Collections
      </button>
      <button
        @click="emit('update:sidebarTab', 'history')"
        class="flex-1 px-3 py-2 text-xs font-medium transition-colors"
        :class="sidebarTab === 'history' ? 'text-white border-b-2 border-amber-500' : 'text-neutral-500 hover:text-neutral-300'"
      >
        History
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Collections -->
      <div v-if="sidebarTab === 'collections'" class="p-2">
        <div
          v-for="col in collections"
          :key="col.id"
          class="mb-2"
        >
          <!-- Collection Header -->
          <div class="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-neutral-800/50 group">
            <button @click="emit('toggleCollection', col.id)" class="text-neutral-500">
              <svg class="w-3 h-3 transition-transform" :class="col.expanded ? 'rotate-90' : ''" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 6l8 4-8 4V6z"/>
              </svg>
            </button>

            <template v-if="editingId === col.id">
              <input
                v-model="editingName"
                @keydown.enter="finishRename(col.id)"
                @blur="finishRename(col.id)"
                class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-xs text-white outline-none"
                autofocus
              />
            </template>
            <template v-else>
              <span class="flex-1 text-xs text-neutral-300 truncate cursor-pointer" @dblclick="startRename(col)">
                {{ col.name }}
              </span>
            </template>

            <span class="text-xs text-neutral-600">{{ col.requests.length }}</span>
            <button
              @click="emit('deleteCollection', col.id)"
              class="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Collection Requests -->
          <div v-if="col.expanded" class="ml-4">
            <div
              v-for="req in col.requests"
              :key="req.id"
              @click="emit('loadRequest', req)"
              class="flex items-center gap-2 px-2 py-1 rounded hover:bg-neutral-800/50 cursor-pointer group"
            >
              <span
                class="text-xs font-mono font-bold shrink-0"
                :style="{ color: getMethodColor(req.method) }"
              >
                {{ req.method.slice(0, 3) }}
              </span>
              <span class="text-xs text-neutral-400 truncate flex-1">{{ req.name }}</span>
              <button
                @click.stop="emit('deleteRequest', col.id, req.id)"
                class="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty Collections -->
        <div v-if="collections.length === 0" class="text-center py-6">
          <div class="text-neutral-600 text-xs">No collections yet</div>
        </div>
      </div>

      <!-- History -->
      <div v-if="sidebarTab === 'history'" class="p-2">
        <div
          v-for="entry in history"
          :key="entry.id"
          @click="emit('loadHistory', entry)"
          class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-800/50 cursor-pointer"
        >
          <span
            class="text-xs font-mono font-bold shrink-0 w-7"
            :style="{ color: getMethodColor(entry.method) }"
          >
            {{ entry.method.slice(0, 3) }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-xs text-neutral-400 truncate">{{ truncateUrl(entry.url) }}</div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span
              class="text-xs font-mono"
              :style="{ color: entry.status ? (entry.status < 400 ? '#10b981' : '#ef4444') : '#6b7280' }"
            >
              {{ entry.status || '—' }}
            </span>
            <span class="text-xs text-neutral-600">{{ formatTime(entry.timestamp) }}</span>
          </div>
        </div>

        <!-- Empty History -->
        <div v-if="history.length === 0" class="text-center py-6">
          <div class="text-neutral-600 text-xs">No history yet</div>
        </div>
      </div>
    </div>

    <!-- Bottom Actions -->
    <div class="p-2 border-t border-neutral-800 flex flex-col gap-1">
      <div v-if="sidebarTab === 'collections'" class="flex gap-1">
        <button
          @click="emit('createCollection')"
          class="flex-1 px-2 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
        >
          + New
        </button>
        <button
          @click="emit('exportPostman')"
          class="px-2 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
          title="Export Postman"
        >
          PM
        </button>
        <button
          @click="emit('exportHoppscotch')"
          class="px-2 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
          title="Export Hoppscotch"
        >
          HS
        </button>
      </div>
      <div v-else class="flex gap-1">
        <button
          @click="emit('clearHistory')"
          class="flex-1 px-2 py-1.5 text-xs bg-neutral-800 hover:bg-red-900/30 text-neutral-400 hover:text-red-400 rounded transition-colors"
          :disabled="history.length === 0"
        >
          Clear History
        </button>
      </div>
    </div>
  </div>
</template>
