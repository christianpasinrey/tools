<script setup>
const props = defineProps({
  currentTool: String,
  tools: Array,
  zoom: Number,
  showGrid: Boolean,
  snapToGrid: Boolean,
  canUndo: Boolean,
  canRedo: Boolean,
  hasSelection: Boolean,
  themeColor: String
})

const emit = defineEmits([
  'update:currentTool',
  'update:showGrid',
  'update:snapToGrid',
  'update:themeColor',
  'zoom-in',
  'zoom-out',
  'reset-zoom',
  'undo',
  'redo',
  'delete-selected',
  'duplicate-selected',
  'bring-to-front',
  'send-to-back',
  'export',
  'import',
  'clear-all'
])

const themeColors = [
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16'  // lime
]
</script>

<template>
  <div class="flex items-center gap-2 p-3 bg-neutral-900 border-b border-neutral-800 flex-wrap">
    <!-- Drawing Tools -->
    <div class="flex items-center gap-1 pr-3 border-r border-neutral-700">
      <button
        v-for="tool in tools"
        :key="tool.id"
        @click="emit('update:currentTool', tool.id)"
        :title="tool.name"
        class="p-2 rounded-lg transition-colors"
        :class="currentTool === tool.id
          ? 'text-white'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'"
        :style="currentTool === tool.id ? { backgroundColor: themeColor } : {}"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" :d="tool.icon" />
        </svg>
      </button>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 pr-3 border-r border-neutral-700">
      <button
        @click="emit('undo')"
        :disabled="!canUndo"
        title="Undo (Ctrl+Z)"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      <button
        @click="emit('redo')"
        :disabled="!canRedo"
        title="Redo (Ctrl+Y)"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>

    <!-- Selection Actions -->
    <div class="flex items-center gap-1 pr-3 border-r border-neutral-700">
      <button
        @click="emit('duplicate-selected')"
        :disabled="!hasSelection"
        title="Duplicate (Ctrl+D)"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        @click="emit('delete-selected')"
        :disabled="!hasSelection"
        title="Delete"
        class="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      <button
        @click="emit('bring-to-front')"
        :disabled="!hasSelection"
        title="Bring to Front"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 11l7-7 7 7M5 19l7-7 7 7" />
        </svg>
      </button>
      <button
        @click="emit('send-to-back')"
        :disabled="!hasSelection"
        title="Send to Back"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Grid & Snap -->
    <div class="flex items-center gap-1 pr-3 border-r border-neutral-700">
      <button
        @click="emit('update:showGrid', !showGrid)"
        :title="showGrid ? 'Hide Grid' : 'Show Grid'"
        class="p-2 rounded-lg transition-colors"
        :class="showGrid ? 'text-white bg-neutral-700' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16M6 4v16M12 4v16M18 4v16" />
        </svg>
      </button>
      <button
        @click="emit('update:snapToGrid', !snapToGrid)"
        :title="snapToGrid ? 'Disable Snap' : 'Enable Snap'"
        class="p-2 rounded-lg transition-colors"
        :class="snapToGrid ? 'text-white bg-neutral-700' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    </div>

    <!-- Zoom Controls -->
    <div class="flex items-center gap-1 pr-3 border-r border-neutral-700">
      <button
        @click="emit('zoom-out')"
        title="Zoom Out"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      </button>
      <button
        @click="emit('reset-zoom')"
        title="Reset Zoom"
        class="px-2 py-1 rounded text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors min-w-[48px]"
      >
        {{ Math.round(zoom * 100) }}%
      </button>
      <button
        @click="emit('zoom-in')"
        title="Zoom In"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Import/Export -->
    <div class="flex items-center gap-1 pl-3 border-l border-neutral-700">
      <button
        @click="emit('import')"
        title="Import SVG"
        class="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </button>
      <button
        @click="emit('export')"
        title="Export"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
        :style="{ backgroundColor: themeColor }"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </div>

    <!-- Theme Color -->
    <div class="flex items-center gap-1 pl-3 border-l border-neutral-700">
      <div class="flex items-center gap-1">
        <button
          v-for="color in themeColors"
          :key="color"
          @click="emit('update:themeColor', color)"
          class="w-5 h-5 rounded-full transition-transform hover:scale-110"
          :class="{ 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900': themeColor === color }"
          :style="{ backgroundColor: color }"
        ></button>
      </div>
    </div>
  </div>
</template>
