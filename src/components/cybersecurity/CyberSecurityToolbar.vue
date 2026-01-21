<script setup>
defineProps({
  themeColor: String
})

const emit = defineEmits(['color-change'])

const colors = [
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Amarillo', value: '#eab308' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' }
]
</script>

<template>
  <div class="flex items-center justify-between px-4 h-12 border-b border-neutral-800 bg-neutral-900/50">
    <div class="flex items-center gap-3">
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center"
        :style="{ backgroundColor: themeColor + '20' }"
      >
        <svg
          class="w-4 h-4"
          :style="{ color: themeColor }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <div>
        <h1 class="text-sm font-semibold text-white leading-tight">CyberSecurity</h1>
        <p class="text-xs text-neutral-500">JWT, Base64, Hash</p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div
        v-for="color in colors"
        :key="color.value"
        @click="emit('color-change', color.value)"
        class="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110"
        :class="{ 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900': themeColor === color.value }"
        :style="{ backgroundColor: color.value }"
        :title="color.name"
      />
    </div>
  </div>
</template>
