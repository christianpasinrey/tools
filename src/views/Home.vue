<script setup>
const tools = [
  {
    path: '/audio-editor',
    name: 'Audio Editor',
    description: 'Corta, une y aplica efectos a archivos de audio. Visualización de ondas en tiempo real.',
    icon: '🎵',
    gradient: 'from-violet-500 to-purple-600',
    status: 'active'
  },
  {
    path: '/image-editor',
    name: 'Image Editor',
    description: 'Edita imágenes con filtros, recortes, ajustes de color y más herramientas profesionales.',
    icon: '🖼️',
    gradient: 'from-emerald-500 to-teal-600',
    status: 'coming'
  },
  {
    path: '/pdf-editor',
    name: 'PDF Editor',
    description: 'Combina, divide, rota y anota documentos PDF directamente en el navegador.',
    icon: '📄',
    gradient: 'from-orange-500 to-red-600',
    status: 'coming'
  },
  {
    path: '/gif-maker',
    name: 'GIF Maker',
    description: 'Crea GIFs desde videos o imágenes. Control de FPS y optimización de tamaño.',
    icon: '🎞️',
    gradient: 'from-pink-500 to-rose-600',
    status: 'coming'
  },
  {
    path: '/svg-editor',
    name: 'SVG Editor',
    description: 'Edita y manipula archivos SVG de forma visual. Perfecto para iconos.',
    icon: '✏️',
    gradient: 'from-cyan-500 to-blue-600',
    status: 'coming'
  },
  {
    path: '/video-editor',
    name: 'Video Editor',
    description: 'Corta clips, añade texto y transiciones. Procesamiento 100% en el navegador.',
    icon: '🎬',
    gradient: 'from-amber-500 to-yellow-600',
    status: 'coming'
  }
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 blur-3xl"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-8">
          <span class="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
          <span class="text-violet-300 text-sm font-medium">100% en el navegador, sin servidores</span>
        </div>

        <h1 class="text-5xl sm:text-7xl font-bold text-white mb-6">
          Web
          <span class="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Tools</span>
        </h1>

        <p class="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          Herramientas profesionales de edición que funcionan completamente en tu navegador.
          Sin subir archivos, sin registro, sin límites.
        </p>

        <div class="flex flex-wrap justify-center gap-4">
          <div class="flex items-center gap-2 text-slate-400">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Privacidad total</span>
          </div>
          <div class="flex items-center gap-2 text-slate-400">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Sin instalación</span>
          </div>
          <div class="flex items-center gap-2 text-slate-400">
            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Gratis y open source</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tools Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <h2 class="text-2xl font-semibold text-white mb-8">Herramientas disponibles</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          v-for="tool in tools"
          :key="tool.path"
          :to="tool.status === 'active' ? tool.path : '#'"
          :class="[
            'group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 transition-all duration-300',
            tool.status === 'active'
              ? 'hover:border-violet-500/50 hover:bg-slate-800/80 cursor-pointer hover:-translate-y-1'
              : 'opacity-60 cursor-not-allowed'
          ]"
        >
          <!-- Status Badge -->
          <div v-if="tool.status === 'coming'" class="absolute top-4 right-4">
            <span class="px-2 py-1 bg-slate-700 text-slate-400 text-xs font-medium rounded-full">Próximamente</span>
          </div>

          <!-- Icon -->
          <div :class="['w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl mb-4', tool.gradient]">
            {{ tool.icon }}
          </div>

          <!-- Content -->
          <h3 class="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
            {{ tool.name }}
          </h3>
          <p class="text-slate-400 text-sm leading-relaxed">
            {{ tool.description }}
          </p>

          <!-- Arrow -->
          <div v-if="tool.status === 'active'" class="mt-4 flex items-center text-violet-400 text-sm font-medium">
            <span>Abrir herramienta</span>
            <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>
