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

// Change password state
const showChangePassword = ref(false)
const currentPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const changePwdError = ref('')
const changePwdLoading = ref(false)
const changePwdSuccess = ref(false)

async function handleChangePassword() {
  changePwdError.value = ''
  changePwdSuccess.value = false

  if (newPwd.value.length < 8) {
    changePwdError.value = 'Nuevo password: minimo 8 caracteres'
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    changePwdError.value = 'Los passwords no coinciden'
    return
  }

  changePwdLoading.value = true
  try {
    // Re-encrypt all items with new password
    await sync.reEncryptAll(currentPwd.value, newPwd.value)
    // Change auth on server + update local
    await auth.changePassword(currentPwd.value, newPwd.value)
    changePwdSuccess.value = true
    currentPwd.value = ''
    newPwd.value = ''
    confirmPwd.value = ''
    setTimeout(() => {
      showChangePassword.value = false
      changePwdSuccess.value = false
    }, 2000)
  } catch (err) {
    changePwdError.value = err.message
  } finally {
    changePwdLoading.value = false
  }
}

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

    <!-- Change password section -->
    <div v-if="showChangePassword && !crypto.isLocked.value" class="mb-3 space-y-2 border-t border-neutral-700 pt-3">
      <p class="text-neutral-300 text-xs font-medium">Cambiar password</p>
      <input
        v-model="currentPwd"
        type="password"
        placeholder="Password actual"
        class="w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
      />
      <input
        v-model="newPwd"
        type="password"
        placeholder="Nuevo password (min 8)"
        class="w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
      />
      <input
        v-model="confirmPwd"
        type="password"
        placeholder="Confirmar nuevo password"
        class="w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
        @keyup.enter="handleChangePassword"
      />
      <div class="flex items-start gap-2 px-2 py-1.5 rounded bg-amber-500/10 border border-amber-500/20">
        <svg class="w-3 h-3 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-[10px] text-amber-300/90 leading-relaxed">Todos tus datos se re-cifrarán con el nuevo password.</p>
      </div>
      <p v-if="changePwdError" class="text-red-400 text-xs">{{ changePwdError }}</p>
      <p v-if="changePwdSuccess" class="text-emerald-400 text-xs">Password cambiado correctamente</p>
      <div class="flex gap-2">
        <button
          @click="handleChangePassword"
          :disabled="changePwdLoading"
          class="flex-1 px-2 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs"
        >
          {{ changePwdLoading ? 'Re-cifrando...' : 'Cambiar' }}
        </button>
        <button
          @click="showChangePassword = false; changePwdError = ''"
          class="px-2 py-1.5 text-neutral-400 hover:text-neutral-200 border border-neutral-600 rounded text-xs"
        >
          Cancelar
        </button>
      </div>
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
        v-if="!crypto.isLocked.value && !showChangePassword"
        @click="showChangePassword = true"
        class="px-2 py-1.5 text-neutral-400 hover:text-neutral-200 border border-neutral-600 rounded text-xs"
        title="Cambiar password"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
        </svg>
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
