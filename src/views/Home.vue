<script setup>
const tools = [
  {
    path: '/audio-editor',
    name: 'Audio Editor',
    description: 'Corta, une y aplica efectos a archivos de audio. Visualización de ondas en tiempo real.',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    status: 'active'
  },
  {
    path: '/image-editor',
    name: 'Image Editor',
    description: 'Edita imágenes con filtros, recortes, ajustes de color y más herramientas profesionales.',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    status: 'coming'
  },
  {
    path: '/pdf-editor',
    name: 'PDF Editor',
    description: 'Combina, divide, rota y anota documentos PDF directamente en el navegador.',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    status: 'coming'
  },
  {
    path: '/gif-maker',
    name: 'GIF Maker',
    description: 'Crea GIFs desde videos o imágenes. Control de FPS y optimización de tamaño.',
    icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    status: 'coming'
  }
]
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-green-600/5 to-transparent"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded text-xs mb-8">
          <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-green-400 font-medium">100% en el navegador, sin servidores</span>
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          Web <span class="text-green-500">Tools</span>
        </h1>

        <p class="text-neutral-400 max-w-xl mx-auto mb-10">
          Herramientas profesionales de edición que funcionan completamente en tu navegador.
          Sin subir archivos, sin registro, sin límites.
        </p>

        <div class="flex flex-wrap justify-center gap-6 text-sm">
          <div class="flex items-center gap-2 text-neutral-500">
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Privacidad total</span>
          </div>
          <div class="flex items-center gap-2 text-neutral-500">
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Sin instalación</span>
          </div>
          <div class="flex items-center gap-2 text-neutral-500">
            <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Gratis y open source</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tools Grid -->
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <h2 class="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-6">Herramientas</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <router-link
          v-for="tool in tools"
          :key="tool.path"
          :to="tool.status === 'active' ? tool.path : '#'"
          :class="[
            'group relative bg-neutral-900 border border-neutral-800 rounded-lg p-5 transition-all',
            tool.status === 'active'
              ? 'hover:border-green-500/50 hover:bg-neutral-900/80 cursor-pointer'
              : 'opacity-50 cursor-not-allowed'
          ]"
        >
          <!-- Status Badge -->
          <div v-if="tool.status === 'coming'" class="absolute top-4 right-4">
            <span class="px-2 py-0.5 bg-neutral-800 text-neutral-500 text-[10px] font-medium rounded">Próximamente</span>
          </div>

          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="w-10 h-10 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-neutral-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-medium mb-1 group-hover:text-green-400 transition-colors">
                {{ tool.name }}
              </h3>
              <p class="text-neutral-500 text-sm leading-relaxed">
                {{ tool.description }}
              </p>
            </div>

            <!-- Arrow -->
            <svg v-if="tool.status === 'active'" class="w-5 h-5 text-neutral-600 group-hover:text-green-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>
