<script setup>
import { computed } from 'vue'

const props = defineProps({
  input: String,
  decoded: Object,
  error: String,
  secret: String,
  isExpired: Boolean,
  expirationDate: String,
  issuedAtDate: String,
  signatureValid: Boolean,
  themeColor: String
})

const emit = defineEmits(['update:input', 'update:secret', 'decode', 'clear', 'copy'])

const formatJson = (obj) => {
  return JSON.stringify(obj, null, 2)
}

const headerFormatted = computed(() => props.decoded?.header ? formatJson(props.decoded.header) : '')
const payloadFormatted = computed(() => props.decoded?.payload ? formatJson(props.decoded.payload) : '')
</script>

<template>
  <div class="h-full flex">
    <!-- Input Panel -->
    <div class="w-1/2 flex flex-col border-r border-neutral-800">
      <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Token JWT</span>
        <div class="flex gap-2">
          <button
            @click="emit('decode')"
            class="px-3 py-1 text-xs rounded transition-colors"
            :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          >
            Decodificar
          </button>
          <button
            @click="emit('clear')"
            class="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      <textarea
        :value="input"
        @input="emit('update:input', $event.target.value)"
        placeholder="Pega aquí tu token JWT..."
        class="flex-1 p-4 bg-transparent text-neutral-300 text-sm font-mono resize-none focus:outline-none placeholder:text-neutral-600"
      />

      <!-- Secret input -->
      <div class="px-4 py-3 border-t border-neutral-800">
        <label class="block text-xs text-neutral-500 mb-2">Secret (opcional, para verificar firma HMAC-SHA256)</label>
        <input
          :value="secret"
          @input="emit('update:secret', $event.target.value)"
          type="password"
          placeholder="Tu secret key..."
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm text-white focus:outline-none focus:border-neutral-600"
        />
      </div>
    </div>

    <!-- Output Panel -->
    <div class="w-1/2 flex flex-col overflow-hidden">
      <!-- Error -->
      <div v-if="error" class="p-4 bg-red-500/10 border-b border-red-500/30">
        <p class="text-red-400 text-sm">{{ error }}</p>
      </div>

      <!-- Decoded content -->
      <div v-else-if="decoded" class="flex-1 overflow-y-auto">
        <!-- Status badges -->
        <div class="flex flex-wrap gap-2 px-4 py-3 border-b border-neutral-800">
          <!-- Expiration badge -->
          <span
            v-if="isExpired !== null"
            class="px-2 py-1 text-xs rounded-full"
            :class="isExpired ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'"
          >
            {{ isExpired ? 'Expirado' : 'Válido' }}
          </span>

          <!-- Signature badge -->
          <span
            v-if="signatureValid !== null"
            class="px-2 py-1 text-xs rounded-full"
            :class="signatureValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'"
          >
            {{ signatureValid ? 'Firma válida' : 'Firma inválida' }}
          </span>

          <!-- Dates -->
          <span v-if="expirationDate" class="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded-full">
            Exp: {{ expirationDate }}
          </span>
          <span v-if="issuedAtDate" class="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded-full">
            Iat: {{ issuedAtDate }}
          </span>
        </div>

        <!-- Header -->
        <div class="border-b border-neutral-800">
          <div class="flex items-center justify-between px-4 py-2 bg-neutral-900/50">
            <span class="text-xs font-medium text-red-400 uppercase tracking-wider">Header</span>
            <button
              @click="emit('copy', headerFormatted)"
              class="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Copiar
            </button>
          </div>
          <pre class="p-4 text-sm text-neutral-300 font-mono overflow-x-auto">{{ headerFormatted }}</pre>
        </div>

        <!-- Payload -->
        <div class="border-b border-neutral-800">
          <div class="flex items-center justify-between px-4 py-2 bg-neutral-900/50">
            <span class="text-xs font-medium text-purple-400 uppercase tracking-wider">Payload</span>
            <button
              @click="emit('copy', payloadFormatted)"
              class="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Copiar
            </button>
          </div>
          <pre class="p-4 text-sm text-neutral-300 font-mono overflow-x-auto">{{ payloadFormatted }}</pre>
        </div>

        <!-- Signature -->
        <div>
          <div class="flex items-center justify-between px-4 py-2 bg-neutral-900/50">
            <span class="text-xs font-medium text-blue-400 uppercase tracking-wider">Signature</span>
            <button
              @click="emit('copy', decoded.signature)"
              class="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Copiar
            </button>
          </div>
          <pre class="p-4 text-sm text-neutral-300 font-mono break-all">{{ decoded.signature }}</pre>
        </div>
      </div>

      <!-- Placeholder -->
      <div v-else class="flex-1 flex items-center justify-center text-neutral-600">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p class="text-sm">Pega un JWT y pulsa Decodificar</p>
        </div>
      </div>
    </div>
  </div>
</template>
