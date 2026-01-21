<script setup>
defineProps({
  activeTab: String,
  themeColor: String
})

const emit = defineEmits(['change'])

const tabs = [
  {
    id: 'jwt',
    name: 'JWT Debugger',
    icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
  },
  {
    id: 'base64',
    name: 'Base64',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
  },
  {
    id: 'hash',
    name: 'Hash Generator',
    icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4'
  }
]
</script>

<template>
  <div class="flex border-b border-neutral-800 bg-neutral-900/30">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="emit('change', tab.id)"
      class="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative"
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
