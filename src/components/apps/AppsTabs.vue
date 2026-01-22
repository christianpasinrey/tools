<script setup>
defineProps({
  activeTab: String,
  themeColor: String
})

const emit = defineEmits(['change'])

const tabs = [
  {
    id: 'map',
    name: 'Map Editor',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
  },
  {
    id: 'todo',
    name: 'TODO Kanban',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
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
