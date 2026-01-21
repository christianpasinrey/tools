<script setup>
import { computed } from 'vue'

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  message: {
    type: String,
    default: 'Cargando...'
  },
  indeterminate: {
    type: Boolean,
    default: false
  },
  themeColor: {
    type: String,
    default: '#3b82f6'
  }
})

const progressWidth = computed(() => {
  if (props.indeterminate) return '100%'
  return `${Math.min(Math.max(props.progress, 0), 100)}%`
})

const progressText = computed(() => {
  if (props.indeterminate) return ''
  return `${Math.round(props.progress)}%`
})
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm text-neutral-400">{{ message }}</span>
      <span v-if="!indeterminate" class="text-sm font-mono" :style="{ color: themeColor }">
        {{ progressText }}
      </span>
    </div>
    <div class="h-2 bg-neutral-800 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300"
        :class="{ 'animate-indeterminate': indeterminate }"
        :style="{
          width: progressWidth,
          backgroundColor: themeColor
        }"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.animate-indeterminate {
  width: 40% !important;
  animation: indeterminate 1.5s ease-in-out infinite;
}
</style>
