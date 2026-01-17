<script setup>
defineProps({
  fileName: String,
  fileInfo: Object,
  historyIndex: Number,
  historyLength: Number,
  themeColor: String
})

const emit = defineEmits(['close', 'export'])

const formatShortTime = (seconds) => {
  if (!seconds) return '0.0s'
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds/60)}m ${Math.floor(seconds%60)}s`
}
</script>

<template>
  <div class="w-52 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
    <!-- File -->
    <div class="p-3 border-b border-neutral-800">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-8 h-8 rounded flex items-center justify-center" :style="{ backgroundColor: themeColor + '1a' }">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" :style="{ color: themeColor }">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-neutral-200 truncate">{{ fileName }}</p>
          <p class="text-[10px] text-neutral-600">{{ formatShortTime(fileInfo?.duration) }}</p>
        </div>
        <button @click="emit('close')" class="w-6 h-6 rounded hover:bg-neutral-800 flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Info -->
    <div class="p-3 border-b border-neutral-800 space-y-2">
      <p class="text-[10px] text-neutral-600 uppercase tracking-wider font-medium">Info</p>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p class="text-neutral-600 text-[10px]">Channels</p>
          <p class="text-neutral-300 font-mono">{{ fileInfo?.channels === 2 ? 'Stereo' : 'Mono' }}</p>
        </div>
        <div>
          <p class="text-neutral-600 text-[10px]">Sample Rate</p>
          <p class="text-neutral-300 font-mono">{{ fileInfo?.sampleRate ? (fileInfo.sampleRate / 1000).toFixed(1) : 0 }}k</p>
        </div>
        <div>
          <p class="text-neutral-600 text-[10px]">Bit Depth</p>
          <p class="text-neutral-300 font-mono">16 bit</p>
        </div>
        <div>
          <p class="text-neutral-600 text-[10px]">Duration</p>
          <p class="text-neutral-300 font-mono">{{ formatShortTime(fileInfo?.duration) }}</p>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="p-3 border-b border-neutral-800">
      <p class="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">History</p>
      <div class="flex items-center gap-2">
        <div class="flex-1 h-1.5 bg-neutral-800 rounded overflow-hidden">
          <div
            class="h-full transition-all"
            :style="{ width: ((historyIndex + 1) / historyLength * 100) + '%', backgroundColor: themeColor + '80' }"
          ></div>
        </div>
        <span class="text-[10px] text-neutral-500 font-mono">{{ historyIndex + 1 }}/{{ historyLength }}</span>
      </div>
    </div>

    <!-- Export -->
    <div class="mt-auto p-3">
      <button
        @click="emit('export')"
        class="w-full h-8 rounded text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 hover:brightness-110"
        :style="{ backgroundColor: themeColor }"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export WAV
      </button>
    </div>
  </div>
</template>
