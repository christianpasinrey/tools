<script setup>
import Icon from '../icons/Icon.vue'
import { useToasts } from '@/composables/useToast'

const { toasts, dismiss } = useToasts()
const ICON = { info: 'sparkle', success: 'check', error: 'x' }
</script>

<template>
  <Teleport to="body">
    <div class="tb-toaster font-ui" role="status" aria-live="polite">
      <TransitionGroup name="tb-toast">
        <div v-for="t in toasts" :key="t.id" class="tb-toast" :class="`tb-toast-${t.tone}`">
          <Icon :name="ICON[t.tone] || 'sparkle'" :size="15" />
          <span>{{ t.message }}</span>
          <button type="button" class="tb-toast-close" aria-label="Cerrar aviso" @click="dismiss(t.id)">
            <Icon name="x" :size="13" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
