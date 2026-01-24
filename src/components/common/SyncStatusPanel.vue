<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useAppCrypto } from '../../composables/useAppCrypto'
import { useCloudSync } from '../../composables/useCloudSync'

const auth = useAuth()
const crypto = useAppCrypto()
const sync = useCloudSync()

const unlockPassword = ref('')
const unlockError = ref('')

const lastSyncFormatted = computed(() => {
  if (!sync.lastSyncTime.value) return 'Nunca'
  const diff = Date.now() - sync.lastSyncTime.value
  if (diff < 60000) return 'Hace unos segundos'
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
  return new Date(sync.lastSyncTime.value).toLocaleTimeString()
})

function handleUnlock() {
  if (!unlockPassword.value) return
  // Set the password and try to unlock
  crypto.setPassword(unlockPassword.value)
  sessionStorage.setItem('tools-sync-pwd', unlockPassword.value)
  unlockPassword.value = ''
  unlockError.value = ''
  sync.fullSync()
}

function handleSync() {
  sync.fullSync()
}

function handleLogout() {
  auth.logout()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <span class="text-neutral-400 text-xs">{{ auth.user.value?.email }}</span>
    </div>

    <!-- Password re-entry needed (after browser restart) -->
    <div v-if="crypto.isLocked.value" class="space-y-2 mb-3">
      <p class="text-amber-400 text-xs">Introduce tu password para desbloquear el vault</p>
      <div class="flex gap-2">
        <input
          v-model="unlockPassword"
          type="password"
          placeholder="Password"
          class="flex-1 bg-neutral-900 border border-neutral-600 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
          @keyup.enter="handleUnlock"
        />
        <button @click="handleUnlock" class="px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs">OK</button>
      </div>
      <p v-if="unlockError" class="text-red-400 text-xs">{{ unlockError }}</p>
    </div>

    <!-- Normal sync status (vault unlocked) -->
    <div v-else class="space-y-1.5 mb-3">
      <div class="flex items-center justify-between">
        <span class="text-neutral-500 text-xs">Estado:</span>
        <span class="text-xs" :class="{
          'text-emerald-400': sync.syncStatus.value === 'idle',
          'text-blue-400': sync.syncStatus.value === 'syncing',
          'text-red-400': sync.syncStatus.value === 'error',
          'text-neutral-500': sync.syncStatus.value === 'offline'
        }">
          {{ sync.syncStatus.value === 'idle' ? 'Sincronizado' :
             sync.syncStatus.value === 'syncing' ? 'Sincronizando...' :
             sync.syncStatus.value === 'error' ? 'Error' : 'Offline' }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-neutral-500 text-xs">Ultimo sync:</span>
        <span class="text-neutral-300 text-xs">{{ lastSyncFormatted }}</span>
      </div>
      <div v-if="sync.pendingChanges.value.length > 0" class="flex items-center justify-between">
        <span class="text-neutral-500 text-xs">Pendientes:</span>
        <span class="text-amber-400 text-xs">{{ sync.pendingChanges.value.length }}</span>
      </div>
    </div>

    <!-- Sync progress -->
    <div v-if="sync.syncStatus.value === 'syncing' && sync.syncProgress.value.total > 0" class="mb-2">
      <div class="w-full h-1 bg-neutral-700 rounded overflow-hidden">
        <div
          class="h-full bg-blue-500 transition-all"
          :style="{ width: (sync.syncProgress.value.current / sync.syncProgress.value.total * 100) + '%' }"
        ></div>
      </div>
      <span class="text-neutral-500 text-xs">{{ sync.syncProgress.value.current }}/{{ sync.syncProgress.value.total }}</span>
    </div>

    <!-- Errors -->
    <div v-if="sync.syncErrors.value.length > 0" class="mb-2 max-h-20 overflow-y-auto">
      <p v-for="(err, i) in sync.syncErrors.value" :key="i" class="text-red-400 text-xs truncate">
        {{ err.type }}: {{ err.error }}
      </p>
    </div>

    <div class="flex gap-2">
      <button
        v-if="!crypto.isLocked.value"
        @click="handleSync"
        :disabled="sync.syncStatus.value === 'syncing'"
        class="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs"
      >
        Sync Now
      </button>
      <button
        @click="handleLogout"
        class="px-2 py-1.5 text-neutral-400 hover:text-neutral-200 border border-neutral-600 rounded text-xs"
      >
        Salir
      </button>
    </div>
  </div>
</template>
