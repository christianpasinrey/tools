<script setup>
defineProps({
  activeTab: String,
  themeColor: String
})

const emit = defineEmits(['change'])

const tabs = [
  {
    id: 'converter',
    name: 'Unit Converter',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
  },
  {
    id: 'color',
    name: 'Color Picker',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
  }
]
</script>

<template>
  <div class="flex border-b border-neutral-800 bg-neutral-900/30 overflow-x-auto scrollbar-hide">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="emit('change', tab.id)"
      class="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap shrink-0"
      :class="activeTab === tab.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
      </svg>
      {{ tab.name }}
      <div
        v-if="activeTab === tab.id"
        class="absolute bottom-0 left-0 right-0 h-0.5"
        :style="{ backgroundColor: themeColor }"
      />
    </button>
  </div>
</template>
