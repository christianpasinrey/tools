<script setup>
import Icon from '../icons/Icon.vue'
import TbButton from '../ui/TbButton.vue'
import { formatSize } from './converterFiles'

defineProps({ file: { type: Object, required: true } })
defineEmits(['change'])
</script>

<template>
  <div class="mb-4 flex items-center gap-3 p-4 rounded-xl border border-tb-line bg-tb-surface">
    <div class="grid place-items-center w-10 h-10 rounded-lg shrink-0 text-[var(--cat)] bg-[color-mix(in_srgb,var(--cat)_12%,transparent)]">
      <Icon name="file" :size="18" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-tb-ink truncate">{{ file.name }}</p>
      <p class="text-xs text-tb-muted font-code">{{ formatSize(file.size) }}</p>
    </div>
    <TbButton size="sm" variant="ghost" @click="$emit('change')">Cambiar</TbButton>
  </div>
</template>
