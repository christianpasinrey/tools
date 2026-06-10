<script setup>
defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  hint: { type: String, default: 'o haz clic para buscar' },
  accent: { type: String, default: '#3b82f6' },
  chips: { type: Array, default: () => [] },
  formats: { type: String, default: '' },
  buttonLabel: { type: String, default: 'Seleccionar archivo' }
})
</script>

<template>
  <div class="flex flex-col items-center text-center px-6 select-none">
    <!-- Icono con halo de color -->
    <div class="relative mb-6">
      <div
        class="absolute -inset-4 rounded-full opacity-15 dark:opacity-20 blur-2xl pointer-events-none"
        :style="{ background: accent }"
      ></div>
      <div
        class="relative w-20 h-20 rounded-2xl flex items-center justify-center border backdrop-blur-sm"
        :style="{
          background: `color-mix(in srgb, ${accent} 10%, transparent)`,
          borderColor: `color-mix(in srgb, ${accent} 25%, transparent)`
        }"
      >
        <svg class="w-9 h-9" :style="{ color: accent }" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="icon" />
        </svg>
      </div>
    </div>

    <p class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-1">{{ title }}</p>
    <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{{ hint }}</p>

    <span
      class="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-transform group-hover:scale-[1.03]"
      :style="{ background: accent }"
    >
      {{ buttonLabel }}
    </span>

    <div v-if="chips.length" class="flex flex-wrap justify-center gap-1.5 mt-7">
      <span
        v-for="chip in chips"
        :key="chip"
        class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-200/70 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300/50 dark:border-neutral-700/50"
      >
        {{ chip }}
      </span>
    </div>

    <p v-if="formats" class="flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 mt-5">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
      </svg>
      {{ formats }}
    </p>
  </div>
</template>
