<script setup>
defineProps({
  hasFile: Boolean,
  hasSelection: Boolean,
  canUndo: Boolean,
  canRedo: Boolean,
  zoomLevel: Number
})

const emit = defineEmits([
  'open', 'export', 'undo', 'redo',
  'trim', 'delete', 'silence',
  'fadeIn', 'fadeOut', 'normalize',
  'zoom'
])

const handleZoom = (e) => emit('zoom', parseInt(e.target.value))
</script>

<template>
  <div class="h-10 bg-neutral-900 border-b border-neutral-800 flex items-center px-1 gap-px text-xs shrink-0">
    <!-- File -->
    <div class="flex items-center border-r border-neutral-800 pr-1">
      <button @click="emit('open')" class="h-7 px-2.5 rounded hover:bg-neutral-800 flex items-center gap-1.5 transition-colors">
        <svg class="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
        </svg>
        Open
      </button>
      <button v-if="hasFile" @click="emit('export')" class="h-7 px-2.5 rounded hover:bg-neutral-800 flex items-center gap-1.5 transition-colors">
        <svg class="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export
      </button>
    </div>

    <!-- History -->
    <div v-if="hasFile" class="flex items-center border-r border-neutral-800 px-1">
      <button @click="emit('undo')" :disabled="!canUndo" :class="['h-7 w-7 rounded flex items-center justify-center transition-colors', canUndo ? 'hover:bg-neutral-800' : 'opacity-30']">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
        </svg>
      </button>
      <button @click="emit('redo')" :disabled="!canRedo" :class="['h-7 w-7 rounded flex items-center justify-center transition-colors', canRedo ? 'hover:bg-neutral-800' : 'opacity-30']">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
        </svg>
      </button>
    </div>

    <!-- Edit -->
    <div v-if="hasFile" class="flex items-center border-r border-neutral-800 px-1">
      <button @click="emit('trim')" :disabled="!hasSelection" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', hasSelection ? 'hover:bg-neutral-800' : 'opacity-30']">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
        Trim
      </button>
      <button @click="emit('delete')" :disabled="!hasSelection" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', hasSelection ? 'hover:bg-neutral-800' : 'opacity-30']">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Delete
      </button>
      <button @click="emit('silence')" :disabled="!hasSelection" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', hasSelection ? 'hover:bg-neutral-800' : 'opacity-30']">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
        Silence
      </button>
    </div>

    <!-- FX -->
    <div v-if="hasFile" class="flex items-center border-r border-neutral-800 px-1">
      <button @click="emit('fadeIn')" :disabled="!hasSelection" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', hasSelection ? 'hover:bg-neutral-800' : 'opacity-30']">
        Fade In
      </button>
      <button @click="emit('fadeOut')" :disabled="!hasSelection" :class="['h-7 px-2 rounded flex items-center gap-1 transition-colors', hasSelection ? 'hover:bg-neutral-800' : 'opacity-30']">
        Fade Out
      </button>
      <button @click="emit('normalize')" class="h-7 px-2 rounded hover:bg-neutral-800 transition-colors">
        Normalize
      </button>
    </div>

    <!-- Zoom -->
    <div v-if="hasFile" class="flex items-center gap-2 px-2 ml-auto text-neutral-500">
      <span class="text-[10px] uppercase tracking-wider">Zoom</span>
      <input
        type="range"
        min="10"
        max="200"
        :value="zoomLevel"
        @input="handleZoom"
        class="w-20 h-1 bg-neutral-800 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-500 [&::-webkit-slider-thumb]:rounded-sm"
      />
    </div>
  </div>
</template>
