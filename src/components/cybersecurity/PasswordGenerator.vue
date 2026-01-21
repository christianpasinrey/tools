<script setup>
defineProps({
  length: Number,
  options: Object,
  password: String,
  strength: Number,
  history: Array,
  themeColor: String
})

const emit = defineEmits(['update:length', 'update:options', 'generate', 'clear', 'copy'])

const strengthLabel = (strength) => {
  if (strength < 30) return 'Débil'
  if (strength < 60) return 'Media'
  if (strength < 80) return 'Fuerte'
  return 'Muy fuerte'
}

const strengthColor = (strength) => {
  if (strength < 30) return '#ef4444'
  if (strength < 60) return '#f59e0b'
  if (strength < 80) return '#22c55e'
  return '#10b981'
}
</script>

<template>
  <div class="h-full flex flex-col p-4 gap-4">
    <!-- Generated password display -->
    <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
      <div class="flex items-center gap-4 mb-4">
        <div class="flex-1 flex items-center gap-2 bg-neutral-800 rounded-lg px-4 py-3 font-mono">
          <code v-if="password" class="flex-1 text-lg text-neutral-200 select-all break-all">{{ password }}</code>
          <span v-else class="flex-1 text-lg text-neutral-600">Genera una contraseña...</span>
          <button
            v-if="password"
            @click="emit('copy', password)"
            class="p-2 text-neutral-400 hover:text-white transition-colors"
            title="Copiar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <button
          @click="emit('generate')"
          class="px-6 py-3 text-sm font-medium rounded-lg transition-colors"
          :style="{ backgroundColor: themeColor, color: 'white' }"
        >
          Generar
        </button>
      </div>

      <!-- Strength indicator -->
      <div v-if="password" class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-neutral-400">Fortaleza</span>
          <span :style="{ color: strengthColor(strength) }">{{ strengthLabel(strength) }} ({{ strength }}%)</span>
        </div>
        <div class="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :style="{ width: strength + '%', backgroundColor: strengthColor(strength) }"
          />
        </div>
      </div>
    </div>

    <!-- Options grid -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Left: Length slider -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-neutral-400">Longitud</span>
          <span class="text-lg font-mono font-bold" :style="{ color: themeColor }">{{ length }}</span>
        </div>
        <input
          type="range"
          :value="length"
          @input="emit('update:length', parseInt($event.target.value))"
          min="4"
          max="64"
          class="w-full accent-red-500"
          :style="{ accentColor: themeColor }"
        />
        <div class="flex justify-between text-xs text-neutral-600 mt-1">
          <span>4</span>
          <span>64</span>
        </div>
      </div>

      <!-- Right: Character options -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <span class="text-sm text-neutral-400 block mb-3">Caracteres</span>
        <div class="grid grid-cols-2 gap-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="options.uppercase"
              @change="emit('update:options', { ...options, uppercase: $event.target.checked })"
              class="rounded border-neutral-600 bg-neutral-800 text-red-500 focus:ring-red-500"
              :style="{ accentColor: themeColor }"
            />
            <span class="text-sm text-neutral-300">A-Z</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="options.lowercase"
              @change="emit('update:options', { ...options, lowercase: $event.target.checked })"
              class="rounded border-neutral-600 bg-neutral-800"
              :style="{ accentColor: themeColor }"
            />
            <span class="text-sm text-neutral-300">a-z</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="options.numbers"
              @change="emit('update:options', { ...options, numbers: $event.target.checked })"
              class="rounded border-neutral-600 bg-neutral-800"
              :style="{ accentColor: themeColor }"
            />
            <span class="text-sm text-neutral-300">0-9</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              :checked="options.symbols"
              @change="emit('update:options', { ...options, symbols: $event.target.checked })"
              class="rounded border-neutral-600 bg-neutral-800"
              :style="{ accentColor: themeColor }"
            />
            <span class="text-sm text-neutral-300">!@#$%</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Advanced options -->
    <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
      <span class="text-sm text-neutral-400 block mb-3">Opciones avanzadas</span>
      <div class="flex gap-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="options.excludeSimilar"
            @change="emit('update:options', { ...options, excludeSimilar: $event.target.checked })"
            class="rounded border-neutral-600 bg-neutral-800"
            :style="{ accentColor: themeColor }"
          />
          <span class="text-sm text-neutral-300">Excluir similares (i, l, 1, L, o, 0, O)</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :checked="options.excludeAmbiguous"
            @change="emit('update:options', { ...options, excludeAmbiguous: $event.target.checked })"
            class="rounded border-neutral-600 bg-neutral-800"
            :style="{ accentColor: themeColor }"
          />
          <span class="text-sm text-neutral-300">Excluir ambiguos ({ } [ ] ( ) / \ ' " ` ~ , ; : . &lt; &gt;)</span>
        </label>
      </div>
    </div>

    <!-- History -->
    <div v-if="history.length > 0" class="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden min-h-0">
      <div class="px-4 py-2 border-b border-neutral-800">
        <span class="text-xs font-medium text-neutral-400 uppercase tracking-wider">Historial</span>
      </div>
      <div class="overflow-auto max-h-32">
        <div
          v-for="(pwd, idx) in history"
          :key="idx"
          class="flex items-center gap-2 px-4 py-2 hover:bg-neutral-800/50 transition-colors"
        >
          <code class="flex-1 text-sm text-neutral-400 font-mono truncate">{{ pwd }}</code>
          <button
            @click="emit('copy', pwd)"
            class="p-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
