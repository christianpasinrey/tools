<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: Boolean,
  title: {
    type: String,
    default: 'Confirmar acción'
  },
  message: {
    type: String,
    default: '¿Estás seguro de que quieres continuar?'
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  type: {
    type: String,
    default: 'warning',
    validator: (v) => ['danger', 'warning', 'info'].includes(v)
  },
  themeColor: {
    type: String,
    default: '#3b82f6'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const cancelButton = ref(null)

const icons = {
  danger: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

const typeColors = {
  danger: { icon: 'text-red-400', button: 'bg-red-500 hover:bg-red-600' },
  warning: { icon: 'text-yellow-400', button: 'bg-yellow-500 hover:bg-yellow-600' },
  info: { icon: 'text-blue-400', button: 'bg-blue-500 hover:bg-blue-600' }
}

const handleKeydown = (e) => {
  if (!props.visible) return
  if (e.key === 'Escape') {
    emit('cancel')
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    setTimeout(() => cancelButton.value?.focus(), 50)
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="emit('cancel')"
        />
        <div class="relative bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl w-full max-w-md overflow-hidden">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                :class="type === 'danger' ? 'bg-red-500/20' : type === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'"
              >
                <svg
                  class="w-5 h-5"
                  :class="typeColors[type].icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icons[type]" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-medium text-white">{{ title }}</h3>
                <p class="mt-2 text-sm text-neutral-400">{{ message }}</p>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 px-6 py-4 bg-neutral-800/50 border-t border-neutral-800">
            <button
              ref="cancelButton"
              @click="emit('cancel')"
              class="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              @click="emit('confirm')"
              class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              :class="typeColors[type].button"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: all 0.2s ease-out;
}
.modal-leave-active {
  transition: all 0.15s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
