<script setup>
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useCloudSync } from '../../composables/useCloudSync'

const auth = useAuth()
const sync = useCloudSync()

const mode = ref('login') // 'login' | 'register'
const email = ref('')
const password = ref('')

async function handleSubmit() {
  if (!email.value || !password.value) return
  let ok
  if (mode.value === 'register') {
    ok = await auth.register(email.value, password.value)
  } else {
    ok = await auth.login(email.value, password.value)
  }
  if (ok) {
    email.value = ''
    password.value = ''
    sync.fullSync()
  }
}
</script>

<template>
  <div>
    <h4 class="text-neutral-200 text-xs font-semibold mb-3">
      {{ mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}
    </h4>

    <form @submit.prevent="handleSubmit" class="space-y-2">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
        required
      />
      <input
        v-model="password"
        type="password"
        :placeholder="mode === 'register' ? 'Password (min 8 chars)' : 'Password'"
        :minlength="mode === 'register' ? 8 : undefined"
        class="w-full bg-neutral-900 border border-neutral-600 rounded px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
        required
      />

      <!-- No recovery warning -->
      <div v-if="mode === 'register'" class="flex items-start gap-2 px-2 py-2 rounded bg-amber-500/10 border border-amber-500/20">
        <svg class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-[10px] text-amber-300/90 leading-relaxed">Si pierdes tu password, tus datos no se pueden recuperar. No existe mecanismo de recuperacion en un sistema zero-knowledge.</p>
      </div>

      <p v-if="auth.authError.value" class="text-red-400 text-xs">{{ auth.authError.value }}</p>

      <button
        type="submit"
        :disabled="auth.authLoading.value"
        class="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium"
      >
        {{ auth.authLoading.value ? '...' : (mode === 'login' ? 'Entrar' : 'Registrarse') }}
      </button>
    </form>

    <div class="mt-2 flex items-center justify-between">
      <button
        @click="mode = mode === 'login' ? 'register' : 'login'"
        class="text-xs text-neutral-500 hover:text-neutral-300 underline"
      >
        {{ mode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta' }}
      </button>
      <router-link
        v-if="mode === 'login'"
        to="/forgot-password"
        class="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        Olvidaste tu password?
      </router-link>
    </div>
  </div>
</template>
