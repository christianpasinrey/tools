<script setup>
import { ref, computed } from 'vue'
import { usePhoneTester } from '../composables/usePhoneTester'
import { Phone } from '@tbisoftware/phone/vue'

const tester = usePhoneTester()

// Track if preview should be shown
const showPreview = computed(() => tester.isConfigValid.value)

// Config fields organized by category
const configFields = {
  connection: [
    { key: 'websocketUrl', label: 'WebSocket URL', placeholder: 'wss://sip-server.com:8089/ws', type: 'text' },
    { key: 'registrarServer', label: 'Registrar Server', placeholder: 'sip:sip-server.com', type: 'text' },
  ],
  credentials: [
    { key: 'sipUri', label: 'SIP URI', placeholder: 'sip:1000@sip-server.com', type: 'text' },
    { key: 'authorizationUser', label: 'Authorization User', placeholder: '1000', type: 'text' },
    { key: 'password', label: 'Password', placeholder: 'Tu contrasena SIP', type: 'password' },
  ],
  display: [
    { key: 'displayName', label: 'Display Name', placeholder: 'Nombre de usuario', type: 'text' },
  ]
}

// Handle call events for logging
const callLogs = ref([])

const handleCallStart = (number) => {
  callLogs.value.unshift({
    type: 'start',
    message: `Llamando a ${number}`,
    time: new Date().toLocaleTimeString()
  })
}

const handleCallEnd = (number, duration, status) => {
  callLogs.value.unshift({
    type: status === 'completed' ? 'success' : 'error',
    message: `Llamada a ${number} ${status}. Duracion: ${duration}s`,
    time: new Date().toLocaleTimeString()
  })
}

const handleStatusChange = (status) => {
  callLogs.value.unshift({
    type: 'info',
    message: `Estado: ${status}`,
    time: new Date().toLocaleTimeString()
  })
}

const clearLogs = () => {
  callLogs.value = []
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] bg-neutral-950 p-6">
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">Phone Tester</h1>
        <p class="text-neutral-400">Configura y prueba el componente de telefono SIP en tiempo real</p>
      </div>

      <!-- Row 1: Instructions + Config Form -->
      <div class="grid lg:grid-cols-[280px,1fr] gap-6">
        <!-- Instructions -->
        <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4 h-fit">
          <h3 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Como empezar</h3>
          <div class="space-y-3">
            <div class="flex gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">1</span>
              <p class="text-sm text-neutral-400">Rellena los datos de conexion de tu servidor SIP</p>
            </div>
            <div class="flex gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">2</span>
              <p class="text-sm text-neutral-400">Prueba el componente en el preview en vivo</p>
            </div>
            <div class="flex gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">3</span>
              <p class="text-sm text-neutral-400">Elige el framework y copia el codigo generado</p>
            </div>
          </div>

          <!-- Info box -->
          <div class="mt-4 pt-4 border-t border-neutral-800">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span class="text-white text-sm font-medium">SIP WebRTC</span>
            </div>
            <p class="text-neutral-500 text-xs">
              El componente utiliza JsSIP para conexiones WebRTC sobre SIP. Necesitas un servidor compatible con WebSocket.
            </p>
          </div>
        </div>

        <!-- Config Form -->
        <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Configuracion SIP</h3>
            <div class="flex gap-2">
              <button
                @click="tester.loadExample"
                class="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
              >
                Cargar ejemplo
              </button>
              <button
                @click="tester.resetConfig"
                class="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          <!-- Connection settings -->
          <div class="mb-4">
            <p class="text-xs text-neutral-500 mb-3">Conexion</p>
            <div class="grid sm:grid-cols-2 gap-3">
              <div v-for="field in configFields.connection" :key="field.key">
                <label class="block text-xs text-neutral-500 mb-1">{{ field.label }}</label>
                <input
                  v-model="tester.config.value[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>
          </div>

          <!-- Credentials -->
          <div class="mb-4">
            <p class="text-xs text-neutral-500 mb-3">Credenciales</p>
            <div class="grid sm:grid-cols-3 gap-3">
              <div v-for="field in configFields.credentials" :key="field.key">
                <label class="block text-xs text-neutral-500 mb-1">{{ field.label }}</label>
                <input
                  v-model="tester.config.value[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>
          </div>

          <!-- Display -->
          <div class="mb-4">
            <p class="text-xs text-neutral-500 mb-3">Visualizacion</p>
            <div class="max-w-xs">
              <div v-for="field in configFields.display" :key="field.key">
                <label class="block text-xs text-neutral-500 mb-1">{{ field.label }}</label>
                <input
                  v-model="tester.config.value[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>
          </div>

          <!-- Validation indicator -->
          <div class="flex items-center gap-2 pt-3 border-t border-neutral-800">
            <div
              class="w-2 h-2 rounded-full transition-colors"
              :class="tester.isConfigValid.value ? 'bg-emerald-500' : 'bg-neutral-600'"
            ></div>
            <span class="text-sm" :class="tester.isConfigValid.value ? 'text-emerald-400' : 'text-neutral-500'">
              {{ tester.isConfigValid.value ? 'Configuracion completa' : 'Completa todos los campos' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Row 2: Preview + Events -->
      <div class="grid lg:grid-cols-[1fr,320px] gap-6">
        <!-- Phone Preview -->
        <div
          class="rounded-xl flex items-center justify-center p-8 min-h-[420px]"
          :class="showPreview ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-900/50 border border-dashed border-neutral-800'"
        >
          <div v-if="showPreview">
            <Phone
              :config="tester.config.value"
              @call-start="handleCallStart"
              @call-end="handleCallEnd"
              @status-change="handleStatusChange"
            />
          </div>
          <div v-else class="text-center">
            <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
              <svg class="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p class="text-neutral-400 font-medium">Preview del componente</p>
            <p class="text-neutral-600 text-sm mt-1">Completa la configuracion para ver el telefono</p>
          </div>
        </div>

        <!-- Event Logs -->
        <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4 h-fit">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Eventos</h3>
            <button
              v-if="callLogs.length > 0"
              @click="clearLogs"
              class="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          </div>

          <div class="space-y-1.5 max-h-80 overflow-y-auto">
            <div
              v-for="(log, index) in callLogs"
              :key="index"
              class="flex items-start gap-2 p-2 rounded-lg bg-neutral-800/50 text-xs"
            >
              <div
                class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                :class="{
                  'bg-emerald-500': log.type === 'success',
                  'bg-red-500': log.type === 'error',
                  'bg-blue-500': log.type === 'info',
                  'bg-yellow-500': log.type === 'start'
                }"
              ></div>
              <div class="flex-1 min-w-0">
                <p class="text-neutral-300">{{ log.message }}</p>
                <p class="text-neutral-600">{{ log.time }}</p>
              </div>
            </div>

            <div v-if="callLogs.length === 0" class="text-center py-12 text-neutral-600 text-xs">
              <svg class="w-8 h-8 mx-auto mb-2 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Los eventos de llamada apareceran aqui
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: Framework Selector + Generated Code -->
      <div class="grid lg:grid-cols-[280px,1fr] gap-6">
        <!-- Framework Selector -->
        <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4 h-fit">
          <h3 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Framework</h3>
          <div class="space-y-2">
            <label
              class="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all"
              :class="tester.selectedFramework.value === 'react'
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'"
            >
              <input
                type="radio"
                v-model="tester.selectedFramework.value"
                value="react"
                class="sr-only"
              />
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9.861A2.139 2.139 0 1012 14.139 2.139 2.139 0 0012 9.861zM6.008 16.255l-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 001.363 3.578l.101.213-.101.213a23.307 23.307 0 00-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.046 0 1.145 1.641 2.294 4.315 3.046a24.95 24.95 0 011.182-3.046A24.752 24.752 0 015.317 8.95zM17.992 16.255l-.133-.469a23.357 23.357 0 00-1.364-3.577l-.101-.213.101-.213a23.42 23.42 0 001.364-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.14s-2.018 3.25-5.535 4.139l-.473.12zm-.491-4.259c.48 1.039.877 2.06 1.182 3.046 2.675-.752 4.315-1.901 4.315-3.046 0-1.146-1.641-2.294-4.315-3.046a24.788 24.788 0 01-1.182 3.046zM5.31 8.945l-.133-.467C4.188 4.992 4.488 2.494 6 1.622c1.483-.856 3.864.155 6.359 2.716l.34.349-.34.349a23.552 23.552 0 00-2.422 2.967l-.135.193-.235.02a23.657 23.657 0 00-3.785.61l-.472.119zm1.896-6.63c-.268 0-.505.058-.705.173-.994.573-1.17 2.565-.485 5.253a25.122 25.122 0 013.233-.501 24.847 24.847 0 012.052-2.544c-1.56-1.519-3.037-2.381-4.095-2.381zM18.69 8.945l-.472-.119a23.479 23.479 0 00-3.787-.61l-.234-.02-.135-.193a23.414 23.414 0 00-2.421-2.967l-.34-.349.34-.349C14.135 1.778 16.515.767 18 1.622c1.512.872 1.812 3.37.824 6.855l-.134.468zM14.75 7.24c1.142.104 2.227.273 3.234.501.685-2.688.509-4.68-.485-5.253-.988-.571-2.845.304-4.8 2.208A24.849 24.849 0 0114.75 7.24zM12 22.408c-1.476 0-3.869-.973-6.36-3.548l-.34-.349.34-.349a23.389 23.389 0 002.42-2.967l.136-.194.234-.02a23.507 23.507 0 003.787-.61l.472-.119.134.468c.987 3.484.687 5.983-.825 6.855a1.852 1.852 0 01-.998.283zm-4.096-4.187c1.56 1.519 3.037 2.381 4.095 2.381.269 0 .506-.058.706-.173.994-.573 1.17-2.565.485-5.252a25.02 25.02 0 01-3.234.5 24.674 24.674 0 01-2.052 2.544zM18.69 15.091l-.134-.469c-.987-3.484-.687-5.982.825-6.854 1.512-.872 3.891.157 6.36 2.716l.34.349-.34.349a23.478 23.478 0 00-2.421 2.968l-.135.193-.234.02a23.548 23.548 0 00-3.787.61l-.474.118zm.706-6.63c-1.058 0-2.535.862-4.095 2.38a24.674 24.674 0 012.052 2.544 25.046 25.046 0 013.233.501c.686-2.688.51-4.68-.485-5.252a1.065 1.065 0 00-.705-.173zM12 15.313c-.687 0-1.392-.029-2.096-.088l-.234-.02-.134-.193a22.48 22.48 0 01-1.643-2.622 22.39 22.39 0 011.643-2.622l.134-.193.234-.02c1.408-.115 2.83-.115 4.238 0l.234.02.134.193a22.39 22.39 0 011.643 2.622 22.358 22.358 0 01-1.643 2.622l-.134.193-.234.02c-.704.06-1.41.088-2.096.088zm-1.653-.851c1.098.088 2.21.088 3.306 0a21.402 21.402 0 001.434-2.466 21.38 21.38 0 00-1.434-2.466c-1.097-.088-2.21-.088-3.306 0a21.402 21.402 0 00-1.434 2.466 21.38 21.38 0 001.434 2.466z"/>
              </svg>
              <div>
                <span class="font-medium block">React</span>
                <span class="text-xs opacity-60">JSX / TSX</span>
              </div>
            </label>
            <label
              class="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all"
              :class="tester.selectedFramework.value === 'vue'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'"
            >
              <input
                type="radio"
                v-model="tester.selectedFramework.value"
                value="vue"
                class="sr-only"
              />
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 1.61h-9.94L12 5.16 9.94 1.61H0l12 20.78L24 1.61zM12 14.08 5.16 2.23h4.43L12 6.41l2.41-4.18h4.43L12 14.08z"/>
              </svg>
              <div>
                <span class="font-medium block">Vue</span>
                <span class="text-xs opacity-60">Composition API</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Generated Code -->
        <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Codigo generado</h3>
            <button
              @click="tester.copyCode"
              class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all"
              :class="tester.copied.value
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'"
            >
              <svg v-if="!tester.copied.value" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ tester.copied.value ? 'Copiado!' : 'Copiar codigo' }}
            </button>
          </div>
          <pre class="p-4 bg-neutral-800 rounded-lg text-sm text-neutral-300 font-mono overflow-x-auto max-h-72"><code>{{ tester.generatedCode.value }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>
