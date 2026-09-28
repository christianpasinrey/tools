<script setup>
import Icon from '../icons/Icon.vue'
import TbPanel from '../ui/TbPanel.vue'
import TbButton from '../ui/TbButton.vue'
import TbIconButton from '../ui/TbIconButton.vue'

defineProps({
  fileName: String,
  pageCount: Number,
  selectedCount: Number
})

const emit = defineEmits(['close', 'export', 'add-files'])
</script>

<template>
  <aside class="w-64 shrink-0 flex flex-col overflow-y-auto border-l border-tb-line bg-tb-surface" aria-label="Documento">
    <TbPanel title="Documento">
      <template #actions>
        <TbIconButton size="sm" icon="x" label="Cerrar el documento" @click="emit('close')" />
      </template>
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="grid place-items-center w-9 h-9 rounded-lg shrink-0 text-[var(--cat)] bg-[color-mix(in_srgb,var(--cat)_12%,transparent)]">
          <Icon name="file" :size="17" />
        </span>
        <p class="text-sm font-medium text-tb-ink truncate" :title="fileName">{{ fileName }}</p>
      </div>
      <dl class="mt-3 grid grid-cols-2 gap-2">
        <div class="p-2 rounded-lg bg-tb-surface-2">
          <dt class="text-xs text-tb-muted">Páginas</dt>
          <dd class="font-code text-lg text-tb-ink">{{ pageCount }}</dd>
        </div>
        <div class="p-2 rounded-lg bg-tb-surface-2">
          <dt class="text-xs text-tb-muted">Seleccionadas</dt>
          <dd class="font-code text-lg text-tb-ink">{{ selectedCount }}</dd>
        </div>
      </dl>
    </TbPanel>

    <TbPanel title="Acciones">
      <div class="flex flex-col gap-1.5">
        <TbButton variant="secondary" icon="file-plus" class="w-full justify-start!" @click="emit('add-files')">Combinar con otro PDF</TbButton>
        <TbButton variant="primary" icon="download" class="w-full" @click="emit('export')">Exportar PDF</TbButton>
      </div>
    </TbPanel>

    <TbPanel title="Consejos" collapsible>
      <ul class="space-y-1.5 text-xs text-tb-muted">
        <li>Pulsa una miniatura para verla; marca su casilla para seleccionarla.</li>
        <li>Arrastra las miniaturas para cambiar el orden.</li>
        <li>Suelta más PDF sobre la vista para combinarlos.</li>
      </ul>
    </TbPanel>
  </aside>
</template>
