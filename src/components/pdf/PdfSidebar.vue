<script setup>
const props = defineProps({
  fileName: String,
  pageCount: Number,
  selectedCount: Number,
  themeColor: String
})

const emit = defineEmits(['close', 'export', 'add-files'])
</script>

<template>
  <div class="w-56 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
    <!-- Header -->
    <div class="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
      <div class="flex items-center gap-2 min-w-0">
        <div class="w-8 h-8 rounded bg-neutral-800 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4" :style="{ color: themeColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <span class="text-neutral-300 text-xs font-medium truncate">{{ fileName }}</span>
      </div>
      <button
        @click="emit('close')"
        class="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
        title="Cerrar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- Info -->
    <div class="p-3 border-b border-neutral-800">
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span class="text-neutral-600">Páginas</span>
          <p class="text-neutral-300 font-mono text-lg">{{ pageCount }}</p>
        </div>
        <div>
          <span class="text-neutral-600">Seleccionadas</span>
          <p class="text-neutral-300 font-mono text-lg">{{ selectedCount }}</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="p-3 space-y-2">
      <p class="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">Acciones rápidas</p>

      <button
        @click="emit('add-files')"
        class="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-neutral-300 hover:bg-neutral-800 transition-colors text-left"
      >
        <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>
        </svg>
        Combinar PDFs
      </button>

      <button
        class="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-neutral-300 hover:bg-neutral-800 transition-colors text-left"
        @click="emit('export')"
      >
        <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Descargar PDF
      </button>
    </div>

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Tips -->
    <div class="p-3 border-t border-neutral-800">
      <p class="text-[10px] text-neutral-600 uppercase tracking-wider font-medium mb-2">Tips</p>
      <ul class="text-[11px] text-neutral-500 space-y-1">
        <li>• Click para seleccionar páginas</li>
        <li>• Arrastra para reordenar</li>
        <li>• Añade más PDFs para combinar</li>
      </ul>
    </div>

    <!-- Export Button -->
    <div class="p-3 border-t border-neutral-800">
      <button
        @click="emit('export')"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors"
        :style="{ backgroundColor: themeColor, color: 'white' }"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Exportar PDF
      </button>
    </div>
  </div>
</template>
