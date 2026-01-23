<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useAppCrypto } from '../../composables/useAppCrypto'

const crypto = useAppCrypto()

const showUnlockInput = ref(false)
const showSetupFlow = ref(false)
const showResetConfirm = ref(false)
const unlockPassword = ref('')
const unlockError = ref('')
const setupStep = ref('') // 'generate' | 'confirm'
const keyCopied = ref(false)
const buttonRef = ref(null)
const popoverPos = ref({ top: 0, left: 0 })

onMounted(() => {
  crypto.checkHasSetup()
})

function updatePopoverPos() {
  if (!buttonRef.value) return
  const rect = buttonRef.value.getBoundingClientRect()
  popoverPos.value = {
    top: rect.bottom + 4,
    left: Math.max(4, rect.right - 240) // Align right edge, min 4px from left
  }
}

function handleClick() {
  if (!crypto.hasSetup.value) {
    startSetup()
  } else if (crypto.isLocked.value) {
    showUnlockInput.value = true
    nextTick(() => updatePopoverPos())
  } else {
    crypto.lock()
  }
}

function startSetup() {
  crypto.generateNewKey()
  setupStep.value = 'generate'
  showSetupFlow.value = true
  keyCopied.value = false
}

async function copyKey() {
  try {
    await navigator.clipboard.writeText(crypto.generatedKey.value)
    keyCopied.value = true
  } catch { /* fallback: user can manually copy */ }
}

async function confirmSetup() {
  const ok = await crypto.setup(crypto.generatedKey.value)
  if (ok) {
    showSetupFlow.value = false
    setupStep.value = ''
  }
}

async function handleUnlock() {
  if (!unlockPassword.value) return
  const ok = await crypto.unlock(unlockPassword.value)
  if (ok) {
    showUnlockInput.value = false
    unlockPassword.value = ''
    unlockError.value = ''
  } else {
    unlockError.value = 'Clave incorrecta'
    setTimeout(() => unlockError.value = '', 3000)
  }
}

function cancelUnlock() {
  showUnlockInput.value = false
  unlockPassword.value = ''
  unlockError.value = ''
}

function showReset() {
  showResetConfirm.value = true
}

async function confirmReset() {
  await crypto.resetCrypto()
  showResetConfirm.value = false
  showUnlockInput.value = false
  unlockPassword.value = ''
  unlockError.value = ''
  startSetup()
}

function cancelReset() {
  showResetConfirm.value = false
}
</script>

<template>
  <div class="inline-flex items-center">
    <!-- Lock/Unlock Button -->
    <button
      ref="buttonRef"
      @click="handleClick"
      class="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors"
      :class="!crypto.hasSetup.value ? 'text-neutral-500 hover:text-neutral-300' :
              crypto.isLocked.value ? 'text-amber-400 hover:text-amber-300' :
              'text-emerald-400 hover:text-emerald-300'"
      :title="!crypto.hasSetup.value ? 'Configurar cifrado' :
              crypto.isLocked.value ? 'Desbloquear' : 'Bloquear'"
    >
      <!-- Lock icon (locked) -->
      <svg v-if="crypto.isLocked.value || !crypto.hasSetup.value" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <!-- Unlock icon -->
      <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
      <span v-if="!crypto.hasSetup.value">Configurar</span>
    </button>

    <Teleport to="body">
      <!-- Unlock Input Popover -->
      <div
        v-if="showUnlockInput"
        class="fixed z-[9999] bg-neutral-800 border border-neutral-700 rounded-lg p-3 shadow-xl min-w-[240px]"
        :style="{ top: popoverPos.top + 'px', left: popoverPos.left + 'px' }"
      >
        <div class="flex items-center gap-2 mb-2">
          <input
            v-model="unlockPassword"
            type="password"
            placeholder="Clave de cifrado"
            class="flex-1 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
            @keyup.enter="handleUnlock"
            @keyup.escape="cancelUnlock"
            autofocus
          />
          <button @click="handleUnlock" class="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs">OK</button>
          <button @click="cancelUnlock" class="px-1.5 py-1 text-neutral-400 hover:text-neutral-200 text-xs">&times;</button>
        </div>
        <p v-if="unlockError" class="text-red-400 text-xs mb-1">{{ unlockError }}</p>
        <button @click="showReset" class="text-xs text-neutral-500 hover:text-neutral-300 underline">He perdido mi clave</button>
      </div>

      <!-- Setup Flow Modal -->
      <div v-if="showSetupFlow" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
        <div class="bg-neutral-800 border border-neutral-700 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
          <h3 class="text-neutral-200 font-semibold text-sm mb-3">Configurar cifrado</h3>
          <p class="text-neutral-400 text-xs mb-4">Se ha generado una clave aleatoria. Copia y guarda esta clave en un lugar seguro. No se puede recuperar.</p>

          <div class="bg-neutral-900 border border-neutral-600 rounded p-3 mb-4 flex items-center gap-2">
            <code class="text-emerald-400 text-sm font-mono flex-1 break-all select-all">{{ crypto.generatedKey.value }}</code>
            <button @click="copyKey" class="shrink-0 px-2 py-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded text-xs">
              {{ keyCopied ? 'Copiada' : 'Copiar' }}
            </button>
          </div>

          <div class="flex gap-2 justify-end">
            <button @click="showSetupFlow = false" class="px-3 py-1.5 text-neutral-400 hover:text-neutral-200 text-xs">Cancelar</button>
            <button @click="confirmSetup" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs">Ya la he guardado</button>
          </div>
        </div>
      </div>

      <!-- Reset Confirm Modal -->
      <div v-if="showResetConfirm" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
        <div class="bg-neutral-800 border border-red-900/50 rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
          <h3 class="text-red-400 font-semibold text-sm mb-3">Restaurar cifrado</h3>
          <p class="text-neutral-400 text-xs mb-2">Esta accion genera una nueva clave de cifrado.</p>
          <p class="text-red-400 text-xs font-semibold mb-4">Los datos cifrados anteriores NO seran recuperables.</p>

          <div class="flex gap-2 justify-end">
            <button @click="cancelReset" class="px-3 py-1.5 text-neutral-400 hover:text-neutral-200 text-xs">Cancelar</button>
            <button @click="confirmReset" class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs">Confirmar reset</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
