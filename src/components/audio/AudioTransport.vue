<script setup>
defineProps({
  isPlaying: Boolean,
  volume: Number,
  themeColor: String
})

const emit = defineEmits(['play', 'stop', 'skipForward', 'skipBackward', 'volume'])

const handleVolume = (e) => emit('volume', parseFloat(e.target.value))
</script>

<template>
  <div class="h-16 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center gap-2 shrink-0">
    <button @click="emit('skipBackward')" class="w-9 h-9 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
    </button>

    <button @click="emit('stop')" class="w-9 h-9 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors">
      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>
    </button>

    <button @click="emit('play')" class="w-11 h-11 rounded-full flex items-center justify-center transition-all text-white hover:brightness-110" :style="{ backgroundColor: themeColor }">
      <svg v-if="!isPlaying" class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
    </button>

    <button @click="emit('skipForward')" class="w-9 h-9 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
    </button>

    <div class="flex items-center gap-2 ml-4 pl-4 border-l border-neutral-800">
      <svg class="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
      </svg>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="volume"
        @input="handleVolume"
        class="w-16 h-1 bg-neutral-800 rounded appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-neutral-400 [&::-webkit-slider-thumb]:rounded-sm"
      />
    </div>
  </div>
</template>
