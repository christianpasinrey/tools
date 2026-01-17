<script setup>
const props = defineProps({
  history: Array,
  historyIndex: Number,
  themeColor: String
})

const emit = defineEmits(['restore'])
</script>

<template>
  <div class="h-24 bg-neutral-900 border-t border-neutral-800 flex items-center gap-2 px-3 overflow-x-auto shrink-0 scrollbar-thin scrollbar-accent">
    <span class="text-neutral-600 text-[10px] uppercase tracking-wider shrink-0">Historial</span>

    <div class="flex items-center gap-2 py-2">
      <button
        v-for="(state, index) in history"
        :key="index"
        @click="emit('restore', index)"
        :class="[
          'relative shrink-0 rounded overflow-hidden transition-all',
          index === historyIndex
            ? 'ring-2 scale-105'
            : 'opacity-60 hover:opacity-100 hover:scale-105'
        ]"
        :style="index === historyIndex ? { ringColor: themeColor } : {}"
        :title="`Estado ${index + 1}`"
      >
        <img
          :src="state.thumbnail || state.imageData"
          class="h-16 w-auto object-contain bg-neutral-800"
          :style="{ maxWidth: '100px' }"
        />
        <div
          v-if="index === 0"
          class="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-center text-neutral-400 py-0.5"
        >
          Original
        </div>
        <div
          v-else-if="index === historyIndex"
          class="absolute top-0 right-0 w-2 h-2 m-1 rounded-full"
          :style="{ backgroundColor: themeColor }"
        ></div>
      </button>
    </div>

    <div v-if="history.length === 0" class="text-neutral-600 text-xs">
      Sin historial
    </div>
  </div>
</template>
