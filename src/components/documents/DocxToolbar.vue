<script setup>
import { computed } from 'vue'
import VaultSaveLoad from '../common/VaultSaveLoad.vue'
import TbToolbar from '../ui/TbToolbar.vue'
import TbToolbarGroup from '../ui/TbToolbarGroup.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbSegmented from '../ui/TbSegmented.vue'

const props = defineProps({
  fileName: { type: String, default: 'documento.docx' },
  isReady: { type: Boolean, default: false },
  documentMode: { type: String, default: 'editing' },
  zoom: { type: Number, default: 100 },
  getData: { type: Function, required: true }
})

const emit = defineEmits(['new', 'open', 'download', 'print', 'mode-change', 'zoom-change', 'load'])

const modes = [
  { value: 'editing', label: 'Editar', icon: 'edit' },
  { value: 'viewing', label: 'Ver', icon: 'eye' }
]
const mode = computed({
  get: () => props.documentMode,
  set: (value) => emit('mode-change', value)
})
</script>

<template>
  <header class="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-tb-line bg-tb-surface">
    <TbToolbar label="Documento Word" class="min-w-0">
      <TbToolbarGroup label="Archivo">
        <TbIconButton icon="file-plus" label="Nuevo documento" @click="emit('new')" />
        <TbIconButton icon="folder" label="Abrir .docx" @click="emit('open')" />
        <TbIconButton icon="download" label="Descargar .docx" :disabled="!isReady" @click="emit('download')" />
        <TbIconButton icon="printer" label="Imprimir" :disabled="!isReady" @click="emit('print')" />
      </TbToolbarGroup>
    </TbToolbar>

    <p class="min-w-0 flex items-center gap-2 text-sm text-tb-ink">
      <span class="truncate max-w-56" :title="fileName">{{ fileName }}</span>
      <span v-if="!isReady" class="text-xs text-tb-muted">cargando…</span>
    </p>

    <div class="ml-auto flex items-center gap-2 shrink-0">
      <div class="flex items-center" role="group" aria-label="Zoom">
        <TbIconButton size="sm" icon="zoom-out" label="Reducir" @click="emit('zoom-change', -10)" />
        <span class="w-12 text-center text-xs font-code text-tb-ink">{{ zoom }} %</span>
        <TbIconButton size="sm" icon="zoom-in" label="Ampliar" @click="emit('zoom-change', 10)" />
      </div>
      <TbSegmented v-model="mode" :options="modes" label="Modo" size="sm" />
      <VaultSaveLoad storeName="docx-documents" :getData="getData" label="documento DOCX" @load="(data) => emit('load', data)" />
    </div>
  </header>
</template>
