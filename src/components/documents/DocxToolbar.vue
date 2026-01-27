<script setup>
import VaultSaveLoad from '../common/VaultSaveLoad.vue'

const props = defineProps({
  fileName: { type: String, default: 'documento.docx' },
  isReady: { type: Boolean, default: false },
  documentMode: { type: String, default: 'editing' },
  zoom: { type: Number, default: 100 },
  getData: { type: Function, required: true }
})

const emit = defineEmits([
  'new',
  'open',
  'download',
  'print',
  'mode-change',
  'zoom-change',
  'load'
])
</script>

<template>
  <div class="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-3 shrink-0">
    <!-- File actions -->
    <div class="flex items-center gap-1">
      <button
        @click="emit('new')"
        class="docx-btn"
        title="Nuevo documento"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>

      <button
        @click="emit('open')"
        class="docx-btn"
        title="Abrir archivo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      </button>

      <button
        @click="emit('download')"
        :disabled="!isReady"
        class="docx-btn"
        :class="{ 'text-blue-400 hover:text-blue-300': isReady, 'opacity-40 cursor-not-allowed': !isReady }"
        title="Descargar DOCX"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      <button
        @click="emit('print')"
        :disabled="!isReady"
        class="docx-btn"
        :class="{ 'opacity-40 cursor-not-allowed': !isReady }"
        title="Imprimir"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      </button>
    </div>

    <div class="w-px h-5 bg-neutral-700"></div>

    <!-- Document name -->
    <div class="flex items-center gap-2 min-w-0">
      <svg class="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span class="text-sm text-neutral-300 truncate max-w-[200px]" :title="fileName">
        {{ fileName }}
      </span>
      <span v-if="isReady" class="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
        Listo
      </span>
    </div>

    <div class="flex-1"></div>

    <!-- Zoom controls -->
    <div class="flex items-center gap-1 bg-neutral-800 rounded-lg px-1">
      <button @click="emit('zoom-change', -10)" class="docx-btn-sm" title="Reducir zoom">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>
      <span class="text-xs text-neutral-400 w-10 text-center">{{ zoom }}%</span>
      <button @click="emit('zoom-change', 10)" class="docx-btn-sm" title="Aumentar zoom">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <div class="w-px h-5 bg-neutral-700"></div>

    <!-- Mode toggle -->
    <div class="flex items-center bg-neutral-800 rounded-lg p-0.5">
      <button
        @click="emit('mode-change', 'editing')"
        class="px-2.5 py-1 text-xs rounded-md transition-colors"
        :class="documentMode === 'editing' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'"
        title="Modo edición"
      >
        Editar
      </button>
      <button
        @click="emit('mode-change', 'viewing')"
        class="px-2.5 py-1 text-xs rounded-md transition-colors"
        :class="documentMode === 'viewing' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'"
        title="Modo vista"
      >
        Ver
      </button>
    </div>

    <div class="w-px h-5 bg-neutral-700"></div>

    <!-- Vault -->
    <VaultSaveLoad
      storeName="docx-documents"
      :getData="getData"
      label="documento DOCX"
      @load="(data) => emit('load', data)"
    />
  </div>
</template>
