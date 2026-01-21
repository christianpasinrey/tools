<script setup>
import { ref } from 'vue'

const props = defineProps({
  input: String,
  output: String,
  mode: String,
  error: String,
  themeColor: String
})

const emit = defineEmits(['update:input', 'update:mode', 'process', 'swap', 'clear', 'copy', 'file-upload'])

const fileInput = ref(null)

const handleFile = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('file-upload', file)
  }
  event.target.value = ''
}
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Mode toggle -->
    <div class="flex items-center justify-center gap-2">
      <button
        @click="emit('update:mode', 'encode')"
        class="px-4 py-2 text-sm rounded-lg transition-colors"
        :class="mode === 'encode' ? 'text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'"
        :style="mode === 'encode' ? { backgroundColor: themeColor } : {}"
      >
        Encode
      </button>
      <button
        @click="emit('update:mode', 'decode')"
        class="px-4 py-2 text-sm rounded-lg transition-colors"
        :class="mode === 'decode' ? 'text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'"
        :style="mode === 'decode' ? { backgroundColor: themeColor } : {}"
      >
        Decode
      </button>
    </div>

    <!-- Main content -->
    <div class="flex-1 flex gap-4">
      <!-- Input -->
      <div class="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            {{ mode === 'encode' ? 'Texto' : 'Base64' }}
          </span>
          <div class="flex gap-2">
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleFile"
            />
            <button
              v-if="mode === 'encode'"
              @click="fileInput?.click()"
              class="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Archivo
            </button>
            <button
              @click="emit('clear')"
              class="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
        <textarea
          :value="input"
          @input="emit('update:input', $event.target.value)"
          :placeholder="mode === 'encode' ? 'Texto a codificar...' : 'Base64 a decodificar...'"
          class="flex-1 p-4 bg-transparent text-neutral-300 text-sm font-mono resize-none focus:outline-none placeholder:text-neutral-600"
        />
      </div>

      <!-- Actions -->
      <div class="flex flex-col justify-center gap-2">
        <button
          @click="emit('process')"
          class="p-3 rounded-lg transition-colors"
          :style="{ backgroundColor: themeColor + '20', color: themeColor }"
          :title="mode === 'encode' ? 'Codificar' : 'Decodificar'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
        <button
          @click="emit('swap')"
          class="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400"
          title="Intercambiar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      </div>

      <!-- Output -->
      <div class="flex-1 flex flex-col bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            {{ mode === 'encode' ? 'Base64' : 'Texto' }}
          </span>
          <button
            v-if="output"
            @click="emit('copy', output)"
            class="text-xs text-neutral-500 hover:text-white transition-colors"
          >
            Copiar
          </button>
        </div>

        <!-- Error -->
        <div v-if="error" class="flex-1 p-4 bg-red-500/10">
          <p class="text-red-400 text-sm">{{ error }}</p>
        </div>

        <!-- Output content -->
        <textarea
          v-else
          :value="output"
          readonly
          placeholder="El resultado aparecerá aquí..."
          class="flex-1 p-4 bg-transparent text-neutral-300 text-sm font-mono resize-none focus:outline-none placeholder:text-neutral-600"
        />
      </div>
    </div>
  </div>
</template>
