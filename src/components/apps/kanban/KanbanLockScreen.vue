<script setup>
import { ref } from 'vue'

const props = defineProps({
  isSetup: { type: Boolean, default: false },
  generatedKey: { type: String, default: '' }
})

const emit = defineEmits(['unlock', 'setup-confirm', 'verify'])

const passphrase = ref('')
const error = ref('')
const loading = ref(false)
const confirmed = ref(false)
const copied = ref(false)

async function copyKey() {
  try {
    await navigator.clipboard.writeText(props.generatedKey)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = props.generatedKey
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function onSetupConfirm() {
  if (!confirmed.value) return
  emit('setup-confirm')
}

async function onVerify() {
  if (!passphrase.value.trim()) return
  error.value = ''
  loading.value = true
  emit('verify', passphrase.value.trim())
}

function onError() {
  error.value = 'Clave incorrecta'
  loading.value = false
}

defineExpose({ onError })
</script>

<template>
  <div class="h-full flex items-center justify-center bg-neutral-950/80">
    <div class="w-80 bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl">
      <!-- Setup mode -->
      <template v-if="isSetup">
        <div class="text-center mb-4">
          <svg class="w-10 h-10 text-indigo-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <h3 class="text-sm font-medium text-white">Tu clave de acceso</h3>
          <p class="text-[10px] text-neutral-500 mt-1">Generada de forma segura. No se almacena en ningún sitio.</p>
        </div>

        <!-- Generated key display -->
        <div class="bg-neutral-800 border border-neutral-600 rounded-lg p-3 mb-3 text-center">
          <code class="text-sm font-mono text-indigo-300 tracking-wider select-all">{{ generatedKey }}</code>
        </div>

        <button
          @click="copyKey"
          class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 rounded-lg transition-colors mb-3"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
          </svg>
          {{ copied ? 'Copiada!' : 'Copiar clave' }}
        </button>

        <label class="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            v-model="confirmed"
            class="w-3.5 h-3.5 rounded border-neutral-600 bg-neutral-800 text-indigo-500 focus:ring-0"
          />
          <span class="text-[11px] text-neutral-300">He guardado mi clave en un lugar seguro</span>
        </label>

        <button
          @click="onSetupConfirm"
          :disabled="!confirmed"
          class="w-full px-4 py-2 text-xs bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
        >
          Continuar
        </button>

        <p class="text-[9px] text-red-400/70 text-center mt-3">
          Si pierdes esta clave, tus datos NO son recuperables.
        </p>
      </template>

      <!-- Unlock mode -->
      <template v-else>
        <div class="text-center mb-4">
          <svg class="w-10 h-10 text-neutral-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <h3 class="text-sm font-medium text-white">Tablero protegido</h3>
          <p class="text-[10px] text-neutral-500 mt-1">Introduce tu clave para desbloquear</p>
        </div>

        <input
          v-model="passphrase"
          type="password"
          placeholder="Tu clave de acceso"
          class="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-indigo-500/50 mb-2"
          @keydown.enter="onVerify"
          autofocus
        />

        <p v-if="error" class="text-[10px] text-red-400 mb-2">{{ error }}</p>

        <button
          @click="onVerify"
          :disabled="!passphrase.trim() || loading"
          class="w-full px-4 py-2 text-xs bg-indigo-500 hover:bg-indigo-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
        >
          {{ loading ? 'Verificando...' : 'Desbloquear' }}
        </button>

        <p class="text-[9px] text-neutral-600 text-center mt-3">
          Si perdiste tu clave, los datos no son recuperables.
        </p>
      </template>
    </div>
  </div>
</template>
