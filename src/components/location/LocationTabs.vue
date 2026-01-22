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
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
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
