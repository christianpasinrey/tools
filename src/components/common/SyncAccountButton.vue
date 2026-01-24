<script setup>
import { ref, nextTick } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useAppCrypto } from '../../composables/useAppCrypto'
import { useCloudSync } from '../../composables/useCloudSync'
import AuthForm from './AuthForm.vue'
import SyncStatusPanel from './SyncStatusPanel.vue'

const auth = useAuth()
const crypto = useAppCrypto()
const sync = useCloudSync()

const showPopover = ref(false)
const buttonRef = ref(null)
const popoverPos = ref({ top: 0, left: 0 })

function updatePopoverPos() {
  if (!buttonRef.value) return
  const rect = buttonRef.value.getBoundingClientRect()
  popoverPos.value = {
    top: rect.bottom + 4,
    left: Math.max(4, rect.right - 260)
  }
}

function handleClick() {
  showPopover.value = !showPopover.value
  if (showPopover.value) {
    nextTick(() => updatePopoverPos())
  }
}

function closePopover() {
  showPopover.value = false
}
</script>

<template>
  <div class="inline-flex items-center">
    <button
      ref="buttonRef"
      @click="handleClick"
      class="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
      :class="!auth.isAuthenticated.value ? 'text-neutral-500 hover:text-neutral-300' :
              crypto.isLocked.value ? 'text-amber-400 hover:text-amber-300' :
              sync.syncStatus.value === 'syncing' ? 'text-blue-400' :
              sync.syncStatus.value === 'error' ? 'text-red-400' :
              sync.pendingChanges.value.length > 0 ? 'text-amber-400' :
              'text-emerald-400 hover:text-emerald-300'"
      :title="!auth.isAuthenticated.value ? 'Cloud Sync' :
              crypto.isLocked.value ? 'Vault bloqueado' :
              sync.syncStatus.value === 'syncing' ? 'Sincronizando...' :
              sync.syncStatus.value === 'error' ? 'Error de sync' :
              'Sincronizado'"
    >
      <!-- Cloud icon -->
      <svg class="w-3.5 h-3.5" :class="{ 'animate-pulse': sync.syncStatus.value === 'syncing' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
      <span v-if="!auth.isAuthenticated.value">Sync</span>
    </button>

    <Teleport to="body">
      <!-- Backdrop -->
      <div v-if="showPopover" class="fixed inset-0 z-[9998]" @click="closePopover"></div>

      <!-- Popover -->
      <div
        v-if="showPopover"
        class="fixed z-[9999] bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-xl min-w-[260px]"
        :style="{ top: popoverPos.top + 'px', left: popoverPos.left + 'px' }"
      >
        <AuthForm v-if="!auth.isAuthenticated.value" />
        <SyncStatusPanel v-else />
      </div>
    </Teleport>
  </div>
</template>
