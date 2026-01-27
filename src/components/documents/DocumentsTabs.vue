<script setup>
defineProps({
  activeTab: String,
  themeColor: String
})

const emit = defineEmits(['change'])

const tabs = [
  {
    id: 'pdf',
    name: 'PDF',
    shortName: 'PDF',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  },
  {
    id: 'spreadsheet',
    name: 'Hojas de cálculo',
    shortName: 'Hojas',
    icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
  },
  {
    id: 'docx',
    name: 'DOCX',
    shortName: 'DOCX',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    shortName: 'MD',
    icon: 'M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm3 8v-4l2 2 2-2v4m4-4v4h2l-3-4-3 4h2'
  }
]
</script>

<template>
  <div class="doc-tabs-container flex border-b border-neutral-800 bg-neutral-900/30 overflow-x-auto">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="emit('change', tab.id)"
      class="flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap shrink-0"
      :class="activeTab === tab.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
      </svg>
      <span class="hidden sm:inline">{{ tab.name }}</span>
      <span class="sm:hidden">{{ tab.shortName }}</span>
      <div
        v-if="activeTab === tab.id"
        class="absolute bottom-0 left-0 right-0 h-0.5"
        :style="{ backgroundColor: themeColor }"
      />
    </button>
  </div>
</template>

<style scoped>
.doc-tabs-container {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.doc-tabs-container::-webkit-scrollbar {
  display: none;
}
</style>
