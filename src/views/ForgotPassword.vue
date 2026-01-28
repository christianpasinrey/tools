<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="text-lg font-semibold text-neutral-100 mb-4">Recuperar Cuenta</h2>

      <div class="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/25">
        <div class="flex items-start gap-2.5">
          <svg class="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p class="text-xs text-red-300/90 leading-relaxed">
            Restablecer tu cuenta eliminara <strong>permanentemente</strong> todos tus datos cifrados. En un sistema zero-knowledge, los datos cifrados con tu password anterior son irrecuperables.
          </p>
        </div>
      </div>

      <div v-if="auth.resetSuccess.value" class="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/25">
        <p class="text-xs text-green-300">{{ auth.resetSuccess.value }}</p>
      </div>

      <p v-if="auth.resetError.value" class="mb-4 text-xs text-red-400">{{ auth.resetError.value }}</p>

      <form v-if="!auth.resetSuccess.value" @submit.prevent="handleSubmit" class="space-y-3">
        <input
          v-model="email"
          type="email"
          placeholder="Tu email"
          class="w-full bg-neutral-800/80 border border-neutral-600/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition-colors"
          required
        />
        <button
          type="submit"
          :disabled="auth.resetLoading.value"
          class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {{ auth.resetLoading.value ? 'Enviando...' : 'Enviar enlace de recuperacion' }}
        </button>
      </form>

      <router-link to="/" class="block mt-4 text-xs text-neutral-500 hover:text-neutral-300 text-center transition-colors">
        Volver al inicio
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const auth = useAuth()
const email = ref('')

async function handleSubmit() {
  if (!email.value) return
  await auth.requestPasswordReset(email.value)
}
</script>
