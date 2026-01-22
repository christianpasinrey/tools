<script setup>
import { ref } from 'vue'
import VaultSaveLoad from '../common/VaultSaveLoad.vue'

const props = defineProps({
  themeColor: String,
  getData: Function,
})

const emit = defineEmits(['color-change', 'load'])

const showColors = ref(false)
const colors = [
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f97316', '#eab308', '#22c55e', '#ef4444'
]
</script>

<template>
  <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 justify-between shrink-0">
    <div class="flex items-center gap-2">
      <svg class="w-5 h-5" :style="{ color: themeColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
      </svg>
      <span class="text-white font-medium">Dev Tools</span>
    </div>

    <div class="flex items-center gap-2">
      <VaultSaveLoad storeName="devtools-snippets" :getData="getData" label="snippet" @load="(data) => emit('load', data)" />

      <div class="relative">
        <button
          @click="showColors = !showColors"
        class="p-1.5 rounded hover:bg-neutral-800 transition-colors flex items-center gap-2"
        title="Theme color"
      >
        <div class="w-4 h-4 rounded" :style="{ backgroundColor: themeColor }"></div>
        <svg class="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      <div
        v-if="showColors"
        class="absolute right-0 top-full mt-1 p-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50"
      >
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="color in colors"
            :key="color"
            @click="emit('color-change', color); showColors = false"
            class="w-6 h-6 rounded transition-transform hover:scale-110"
            :class="{ 'ring-2 ring-white ring-offset-1 ring-offset-neutral-800': color === themeColor }"
            :style="{ backgroundColor: color }"
          ></button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
