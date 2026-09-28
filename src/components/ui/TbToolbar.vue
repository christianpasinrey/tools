<script setup>
defineProps({ label: { type: String, required: true } })
</script>

<template>
  <div role="toolbar" :aria-label="label" class="tb-toolbar tb-ui"><slot /></div>
</template>
