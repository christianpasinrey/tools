<script setup>
defineProps({ label: { type: String, required: true } })
</script>

<template>
  <div role="group" :aria-label="label" class="tb-toolbar-group"><slot /></div>
</template>
