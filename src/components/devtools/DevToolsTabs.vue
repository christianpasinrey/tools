<script setup>
const props = defineProps({
  activeTab: String,
  themeColor: String
})

const emit = defineEmits(['change'])

const tabs = [
  {
    id: 'json',
    name: 'JSON Tools',
    icon: 'M4 6h16M4 12h8m-8 6h16'
  },
  {
    id: 'playground',
    name: 'HTML Playground',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
  }
]
</script>

<template>
  <div class="bg-neutral-900/50 border-b border-neutral-800 px-4 shrink-0">
    <div class="flex gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="emit('change', tab.id)"
        :class="[
          'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
          activeTab === tab.id
            ? 'text-white border-current'
            : 'text-neutral-500 border-transparent hover:text-neutral-300'
        ]"
        :style="activeTab === tab.id ? { borderColor: themeColor, color: themeColor } : {}"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tab.icon"/>
        </svg>
        {{ tab.name }}
      </button>
    </div>
  </div>
</template>
