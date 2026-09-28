<script setup>
defineProps({ items: { type: Array, required: true } })
</script>

<template>
  <aside class="mb-4 p-3.5 rounded-xl border border-amber-300/60 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10">
    <p class="text-xs font-semibold text-amber-800 dark:text-amber-200">Limitaciones</p>
    <ul class="mt-1 space-y-0.5 text-xs text-amber-800/90 dark:text-amber-200/80 list-disc pl-4">
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </aside>
</template>
