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

      <p v-if="auth.authError.value" class="text-red-400 text-xs">{{ auth.authError.value }}</p>

      <button
        type="submit"
        :disabled="auth.authLoading.value"
        class="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium"
      >
        {{ auth.authLoading.value ? '...' : (mode === 'login' ? 'Entrar' : 'Registrarse') }}
      </button>
    </form>

    <button
      @click="mode = mode === 'login' ? 'register' : 'login'"
      class="mt-2 text-xs text-neutral-500 hover:text-neutral-300 underline"
    >
      {{ mode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta' }}
    </button>
  </div>
</template>
