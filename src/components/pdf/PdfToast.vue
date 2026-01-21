<script setup>
import { computed } from 'vue'

const props = defineProps({
  toasts: {
    type: Array,
    default: () => []
  },
  themeColor: {
    type: String,
    default: '#3b82f6'
  }
})

const emit = defineEmits(['dismiss'])

const icons = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

const colors = {
  success: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  error: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  warning: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
  info: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' }
}

const getToastClasses = (type) => {
  const c = colors[type] || colors.info
  return `${c.bg} ${c.border} ${c.text}`
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg max-w-sm"
          :class="getToastClasses(toast.type)"
        >
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icons[toast.type] || icons.info" />
          </svg>
          <span class="text-sm text-neutral-200 flex-1">{{ toast.message }}</span>
          <button
            v-if="toast.dismissable !== false"
            @click="emit('dismiss', toast.id)"
            class="p-1 hover:bg-white/10 rounded transition-colors shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
