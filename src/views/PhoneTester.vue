<script setup>
import { ref, computed } from 'vue'
import { usePhoneTester } from '../composables/usePhoneTester'
import { Phone } from '@tbisoftware/phone/vue'

const tester = usePhoneTester()

const showPreview = computed(() => tester.isConfigValid.value)

const configFields = {
  connection: [
    { key: 'websocketUrl', label: 'WebSocket URL', placeholder: 'wss://sip-server.com:8089/ws', type: 'text' },
    { key: 'registrarServer', label: 'Registrar Server', placeholder: 'sip:sip-server.com', type: 'text' },
  ],
  credentials: [
    { key: 'sipUri', label: 'SIP URI', placeholder: 'sip:1000@sip-server.com', type: 'text' },
    { key: 'authorizationUser', label: 'Auth User', placeholder: '1000', type: 'text' },
    { key: 'password', label: 'Password', placeholder: 'password', type: 'password' },
    { key: 'displayName', label: 'Display Name', placeholder: 'Usuario', type: 'text' },
  ]
}

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
    message: `Llamada ${status} - ${duration}s`,
    time: new Date().toLocaleTimeString()
  })
}

const handleStatusChange = (status) => {
  callLogs.value.unshift({
    type: 'info',
    message: status,
    time: new Date().toLocaleTimeString()
  })
}

const clearLogs = () => {
  callLogs.value = []
}

const activeSection = ref('config')
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 pb-20">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 h-12 border-b border-neutral-800 bg-neutral-900/50">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <h1 class="text-sm font-semibold text-white leading-tight">Phone Tester</h1>
            <p class="text-xs text-neutral-500">SIP WebRTC Component</p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" :class="tester.isConfigValid.value ? 'bg-emerald-500/20' : 'bg-neutral-800'">
          <div class="w-2 h-2 rounded-full" :class="tester.isConfigValid.value ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'"></div>
          <span class="text-xs" :class="tester.isConfigValid.value ? 'text-emerald-400' : 'text-neutral-500'">
            {{ tester.isConfigValid.value ? 'Ready' : 'Configure' }}
          </span>
        </div>
        <button
          @click="tester.loadExample"
          class="px-3 py-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
        >
          Demo
        </button>
        <button
          @click="tester.resetConfig"
          class="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Panel: Config -->
      <div class="w-80 border-r border-neutral-800 flex flex-col bg-neutral-900/30">
        <!-- Section Tabs -->
        <div class="flex border-b border-neutral-800">
          <button
            @click="activeSection = 'config'"
            class="flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative"
            :class="activeSection === 'config' ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'"
          >
            Configuración
            <div v-if="activeSection === 'config'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
          </button>
          <button
            @click="activeSection = 'events'"
            class="flex-1 px-4 py-2.5 text-xs font-medium transition-colors relative"
            :class="activeSection === 'events' ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'"
          >
            Eventos
            <span v-if="callLogs.length > 0" class="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full">
              {{ callLogs.length }}
            </span>
            <div v-if="activeSection === 'events'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
          </button>
        </div>

        <!-- Config Section -->
        <div v-show="activeSection === 'config'" class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- Connection -->
          <div>
            <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Conexión</p>
            <div class="space-y-2">
              <div v-for="field in configFields.connection" :key="field.key">
                <input
                  v-model="tester.config.value[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  class="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>
          </div>

          <!-- Credentials -->
          <div>
            <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Credenciales</p>
            <div class="space-y-2">
              <div v-for="field in configFields.credentials" :key="field.key">
                <input
                  v-model="tester.config.value[field.key]"
                  :type="field.type"
                  :placeholder="field.placeholder"
                  class="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-neutral-600"
                />
              </div>
            </div>
          </div>

          <!-- Quick Help -->
          <div class="p-3 bg-neutral-800/30 rounded-lg border border-neutral-800/50">
            <p class="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">Guía rápida</p>
            <ul class="space-y-1.5 text-xs text-neutral-500">
              <li class="flex items-start gap-2">
                <span class="text-emerald-500 mt-0.5">1.</span>
                <span>Configura tu servidor SIP</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-emerald-500 mt-0.5">2.</span>
                <span>Prueba en el preview</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-emerald-500 mt-0.5">3.</span>
                <span>Copia el código generado</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Events Section -->
        <div v-show="activeSection === 'events'" class="flex-1 overflow-y-auto">
          <div v-if="callLogs.length > 0" class="p-2">
            <div class="flex justify-end mb-2">
              <button @click="clearLogs" class="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">
                Limpiar
              </button>
            </div>
            <div class="space-y-1">
              <div
                v-for="(log, index) in callLogs"
                :key="index"
                class="flex items-start gap-2 p-2 rounded-lg bg-neutral-800/30 text-xs"
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
                  <p class="text-neutral-300 truncate">{{ log.message }}</p>
                  <p class="text-neutral-600 text-[10px]">{{ log.time }}</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center h-full text-neutral-600 p-4">
            <svg class="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-xs text-center">Los eventos aparecerán aquí</p>
          </div>
        </div>
      </div>

      <!-- Center: Phone Preview -->
      <div class="flex-1 flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 relative overflow-hidden">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-5">
          <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 40px 40px;"></div>
        </div>

        <!-- Glow Effect -->
        <div v-if="showPreview" class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>

        <!-- Phone Component -->
        <div class="relative z-10">
          <div v-if="showPreview" class="transform hover:scale-105 transition-transform duration-300">
            <Phone
              :config="tester.config.value"
              @call-start="handleCallStart"
              @call-end="handleCallEnd"
              @status-change="handleStatusChange"
            />
          </div>
          <div v-else class="text-center p-8">
            <div class="w-32 h-32 mx-auto mb-6 rounded-2xl bg-neutral-800/50 border border-neutral-700/50 flex items-center justify-center">
              <svg class="w-16 h-16 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p class="text-neutral-400 font-medium mb-2">Phone Preview</p>
            <p class="text-neutral-600 text-sm max-w-xs">Completa la configuración SIP para ver el componente</p>
            <button
              @click="tester.loadExample"
              class="mt-4 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
            >
              Cargar ejemplo
            </button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Code -->
      <div class="w-96 border-l border-neutral-800 flex flex-col bg-neutral-900/30">
        <!-- Framework Selector -->
        <div class="flex items-center gap-2 p-3 border-b border-neutral-800">
          <button
            @click="tester.selectedFramework.value = 'vue'"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            :class="tester.selectedFramework.value === 'vue'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              : 'bg-neutral-800/50 text-neutral-400 border border-transparent hover:border-neutral-700'"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 1.61h-9.94L12 5.16 9.94 1.61H0l12 20.78L24 1.61zM12 14.08 5.16 2.23h4.43L12 6.41l2.41-4.18h4.43L12 14.08z"/>
            </svg>
            Vue
          </button>
          <button
            @click="tester.selectedFramework.value = 'react'"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            :class="tester.selectedFramework.value === 'react'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
              : 'bg-neutral-800/50 text-neutral-400 border border-transparent hover:border-neutral-700'"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9.861A2.139 2.139 0 1012 14.139 2.139 2.139 0 0012 9.861zM6.008 16.255l-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 001.363 3.578l.101.213-.101.213a23.307 23.307 0 00-1.363 3.578l-.133.467zm11.984 0l-.133-.469a23.357 23.357 0 00-1.364-3.577l-.101-.213.101-.213a23.42 23.42 0 001.364-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.14s-2.018 3.25-5.535 4.139l-.473.12zM12 22.408c-1.476 0-3.869-.973-6.36-3.548l-.34-.349.34-.349a23.389 23.389 0 002.42-2.967l.136-.194.234-.02a23.507 23.507 0 003.787-.61l.472-.119.134.468c.987 3.484.687 5.983-.825 6.855a1.852 1.852 0 01-.998.283z"/>
            </svg>
            React
          </button>
        </div>

        <!-- Code Preview -->
        <div class="flex-1 overflow-hidden flex flex-col">
          <div class="flex-1 overflow-auto p-3">
            <pre class="text-[11px] text-neutral-400 font-mono leading-relaxed whitespace-pre-wrap break-all"><code>{{ tester.generatedCode.value }}</code></pre>
          </div>
        </div>

        <!-- Copy Button -->
        <div class="p-3 border-t border-neutral-800">
          <button
            @click="tester.copyCode"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            :class="tester.copied.value
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'"
          >
            <svg v-if="!tester.copied.value" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ tester.copied.value ? '¡Copiado!' : 'Copiar código' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
