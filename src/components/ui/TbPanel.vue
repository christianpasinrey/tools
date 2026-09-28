<script setup>
import Icon from '../icons/Icon.vue'
const open = defineModel('open', { type: Boolean, default: true })
defineProps({ title: { type: String, required: true }, collapsible: Boolean })
</script>

<template>
  <section class="tb-panel tb-ui">
    <header class="tb-panel-head">
      <button v-if="collapsible" type="button" class="tb-panel-title" :aria-expanded="open" @click="open = !open">
        <Icon name="chevron-down" :size="13" class="transition-transform" :class="!open && '-rotate-90'" />{{ title }}
      </button>
      <h3 v-else class="tb-panel-title">{{ title }}</h3>
      <div class="ml-auto flex items-center gap-1"><slot name="actions" /></div>
    </header>
    <div v-if="open" class="tb-panel-body"><slot /></div>
  </section>
</template>
