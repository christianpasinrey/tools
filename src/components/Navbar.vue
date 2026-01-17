<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const tools = [
  { path: '/audio-editor', name: 'Audio Editor', icon: '🎵' },
  { path: '/image-editor', name: 'Image Editor', icon: '🖼️' },
  { path: '/pdf-editor', name: 'PDF Editor', icon: '📄' },
  { path: '/gif-maker', name: 'GIF Maker', icon: '🎞️' },
]
</script>

<template>
  <nav class="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div class="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">T</span>
          </div>
          <span class="text-white font-semibold text-xl">Tools</span>
        </router-link>

        <div class="flex items-center gap-2">
          <router-link
            v-for="tool in tools"
            :key="tool.path"
            :to="tool.path"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              route.path === tool.path
                ? 'bg-violet-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            ]"
          >
            <span class="mr-2">{{ tool.icon }}</span>
            {{ tool.name }}
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>
