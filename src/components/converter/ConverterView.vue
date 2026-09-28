<script setup>
import TbIconButton from '../ui/TbIconButton.vue'
import Icon from '../icons/Icon.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  wide: Boolean
})
defineEmits(['back'])
</script>

<template>
  <div class="flex-1 overflow-auto p-4 sm:p-8">
    <div class="mx-auto" :class="wide ? 'max-w-3xl' : 'max-w-2xl'">
      <header class="flex items-center gap-3 mb-6">
        <TbIconButton label="Volver a las conversiones" @click="$emit('back')">
          <Icon name="arrow-right" :size="16" class="rotate-180" />
        </TbIconButton>
        <div class="min-w-0">
          <h2 class="font-display text-xl font-bold text-tb-ink leading-tight">{{ title }}</h2>
          <p class="text-sm text-tb-muted">{{ description }}</p>
        </div>
        <div class="ml-auto flex items-center gap-2"><slot name="actions" /></div>
      </header>
      <slot />
    </div>
  </div>
</template>
