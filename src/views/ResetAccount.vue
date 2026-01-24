<template>
  <div class="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-neutral-900/80 border border-neutral-700/50 rounded-xl p-6 backdrop-blur-sm">
      <h2 class="text-lg font-semibold text-neutral-100 mb-4">Restablecer Cuenta</h2>

      <!-- Loading -->
      <div v-if="verifying" class="text-center py-8">
        <p class="text-sm text-neutral-400">Verificando enlace...</p>
      </div>

      <!-- Invalid token -->
      <div v-else-if="!tokenValid" class="space-y-4">
        <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/25">
          <p class="text-sm text-red-300">
            Este enlace es invalido o ha expirado. Los enlaces de recuperacion solo son validos por 1 hora.
          </p>
        </div>
        <router-link to="/forgot-password" class="block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors">
          Solicitar nuevo enlace
        </router-link>
      </div>

      <!-- Valid token - reset form -->
      <div v-else class="space-y-4">
        <div class="p-3.5 rounded-lg bg-red-500/10 border-2 border-red-500/30">
          <div class="flex items-start gap-2.5">
            <svg class="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div class="text-xs text-red-300/90 leading-relaxed">
              <p class="font-bold text-red-300 mb-1">PERDIDA PERMANENTE DE DATOS</p>
              <p>Al establecer un nuevo password, TODOS tus datos cifrados seran eliminados permanentemente. Esta accion NO se puede deshacer.</p>
            </div>
          </div>
        </div>

        <!-- Success -->
        <div v-if="auth.resetSuccess.value" class="p-3 rounded-lg bg-green-500/10 border border-green-500/25">
          <p class="text-sm text-green-300 mb-2">{{ auth.resetSuccess.value }}</p>
          <router-link to="/" class="text-sm text-green-400 hover:text-green-300 transition-colors">
            Ir al inicio de sesion
          </router-link>
        </div>

        <p v-if="auth.resetError.value" class="text-xs text-red-400">{{ auth.resetError.value }}</p>

        <!-- Form -->
        <form v-if="!auth.resetSuccess.value" @submit.prevent="handleSubmit" class="space-y-3">
          <div>
            <label class="block text-xs text-neutral-400 mb-1">Nuevo Password</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="Minimo 8 caracteres"
              minlength="8"
              class="w-full bg-neutral-800/80 border border-neutral-600/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
              required
            />
          </div>
          <div>
            <label class="block text-xs text-neutral-400 mb-1">Confirmar Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Repite el password"
              class="w-full bg-neutral-800/80 border border-neutral-600/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
              required
            />
          </div>
          <p v-if="passwordMismatch" class="text-xs text-red-400">Los passwords no coinciden</p>
          <button
            type="submit"
            :disabled="auth.resetLoading.value || passwordMismatch || newPassword.length < 8"
            class="w-full px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {{ auth.resetLoading.value ? 'Procesando...' : 'Restablecer cuenta y eliminar datos' }}
          </button>
        </form>
      </div>

      <router-link
        v-if="!auth.resetSuccess.value && !verifying"
        to="/"
        class="block mt-5 text-xs text-neutral-500 hover:text-neutral-300 text-center transition-colors"
      >
        Cancelar
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const auth = useAuth()

const verifying = ref(true)
const tokenValid = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

const passwordMismatch = computed(() =>
  confirmPassword.value.length > 0 && newPassword.value !== confirmPassword.value
)

onMounted(async () => {
  const email = route.query.email || ''
  const token = route.query.token || ''

  if (!email || !token) {
    tokenValid.value = false
    verifying.value = false
    return
  }

  const result = await auth.verifyResetToken(email, token)
  tokenValid.value = result.valid
  verifying.value = false
})

async function handleSubmit() {
  if (passwordMismatch.value || newPassword.value.length < 8) return

  const email = route.query.email || ''
  const token = route.query.token || ''

  await auth.resetAccountWithNewPassword(email, token, newPassword.value)
}
</script>
