<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const tools = [
  { path: '/audio-editor', name: 'Audio Editor', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
  { path: '/image-editor', name: 'Image Editor', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/pdf-editor', name: 'PDF Editor', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { path: '/gif-maker', name: 'GIF Maker', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
]
</script>

<template>
  <nav class="h-16 bg-neutral-900 border-b border-neutral-800 sticky top-0 z-50">
    <div class="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
      <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div class="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">T</span>
        </div>
        <span class="text-white font-semibold text-lg">Tools</span>
      </router-link>

      <div class="flex items-center gap-1">
        <router-link
          v-for="tool in tools"
          :key="tool.path"
          :to="tool.path"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors',
            route.path === tool.path
              ? 'bg-green-600 text-white'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          ]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
          </svg>
          {{ tool.name }}
        </router-link>
      </div>
    </div>
  </nav>
</template>
