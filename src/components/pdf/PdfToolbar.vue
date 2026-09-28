<script setup>
import TbToolbar from '../ui/TbToolbar.vue'
import TbToolbarGroup from '../ui/TbToolbarGroup.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbButton from '../ui/TbButton.vue'

defineProps({
  hasFile: Boolean,
  hasSelection: Boolean,
  allSelected: Boolean,
  selectedCount: Number,
  pageCount: Number,
  canUndo: Boolean,
  canRedo: Boolean,
  undoActionName: String,
  redoActionName: String,
  showAnnotations: Boolean,
  annotationCount: Number,
  zoom: Number
})

const emit = defineEmits([
  'open', 'add-files', 'export',
  'select-all', 'deselect-all',
  'rotate-left', 'rotate-right',
  'delete', 'extract', 'split-all',
  'undo', 'redo',
  'toggle-annotations',
  'zoom-in', 'zoom-out', 'zoom-reset'
])
</script>

<template>
  <TbToolbar label="Editor de PDF" class="flex-1">
    <TbToolbarGroup label="Archivo">
      <TbIconButton label="Abrir PDF" icon="folder" @click="emit('open')" />
      <template v-if="hasFile">
        <TbIconButton label="Combinar: añadir más PDF" icon="file-plus" @click="emit('add-files')" />
        <TbButton size="sm" variant="primary" icon="download" class="ml-1" @click="emit('export')">Exportar</TbButton>
      </template>
    </TbToolbarGroup>

    <template v-if="hasFile">
      <TbToolbarGroup label="Historial">
        <TbIconButton icon="undo" :label="canUndo ? `Deshacer: ${undoActionName}` : 'Nada que deshacer'" :disabled="!canUndo" @click="emit('undo')" />
        <TbIconButton icon="redo" :label="canRedo ? `Rehacer: ${redoActionName}` : 'Nada que rehacer'" :disabled="!canRedo" @click="emit('redo')" />
      </TbToolbarGroup>

      <TbToolbarGroup label="Páginas">
        <TbIconButton icon="select-all" :label="allSelected ? 'Quitar la selección' : 'Seleccionar todas'" :active="allSelected" @click="allSelected ? emit('deselect-all') : emit('select-all')" />
        <span v-if="hasSelection" class="px-1.5 text-xs font-code text-tb-muted whitespace-nowrap">{{ selectedCount }}/{{ pageCount }}</span>
        <TbIconButton icon="rotate-left" label="Girar a la izquierda" :disabled="!hasSelection" @click="emit('rotate-left')" />
        <TbIconButton icon="rotate-right" label="Girar a la derecha" :disabled="!hasSelection" @click="emit('rotate-right')" />
        <TbIconButton icon="extract" label="Extraer las seleccionadas a un PDF" :disabled="!hasSelection" @click="emit('extract')" />
        <TbIconButton icon="trash" tone="danger" label="Eliminar las seleccionadas" :disabled="!hasSelection" @click="emit('delete')" />
        <TbIconButton icon="scissors" label="Dividir en un PDF por página" :disabled="pageCount < 2" @click="emit('split-all')" />
      </TbToolbarGroup>

      <TbToolbarGroup label="Vista">
        <TbIconButton icon="zoom-out" label="Reducir" :disabled="zoom <= 0.1" @click="emit('zoom-out')" />
        <button type="button" class="h-8 min-w-14 px-1.5 rounded-lg text-xs font-code text-tb-ink hover:bg-tb-surface-2" title="Volver al 40 %" @click="emit('zoom-reset')">
          {{ Math.round(zoom * 100) }} %
        </button>
        <TbIconButton icon="zoom-in" label="Ampliar" :disabled="zoom >= 3" @click="emit('zoom-in')" />
      </TbToolbarGroup>

      <TbToolbarGroup label="Anotar">
        <TbButton size="sm" :variant="showAnnotations ? 'primary' : 'ghost'" icon="pen" :aria-pressed="String(showAnnotations)" @click="emit('toggle-annotations')">
          Anotar<span v-if="annotationCount" class="font-code opacity-80">· {{ annotationCount }}</span>
        </TbButton>
      </TbToolbarGroup>
    </template>
  </TbToolbar>
</template>
