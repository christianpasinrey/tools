<script setup>
import { onMounted, watch } from 'vue'
import { useUnitConverter } from '../composables/useUnitConverter'

const converter = useUnitConverter()

// Fetch currency rates on mount
onMounted(() => {
  converter.fetchCurrencyRates()
})

// Handle category change
const handleCategoryChange = (category) => {
  converter.setCategory(category)
}

// Copy result to clipboard
const copyResult = async (value) => {
  try {
    await navigator.clipboard.writeText(converter.formatNumber(value))
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="min-h-screen app-bg p-6 overflow-auto">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Unit Converter</h1>
        <p class="text-neutral-400">Convierte entre diferentes unidades de medida y monedas</p>
      </div>

      <!-- Categories Grid -->
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 mb-8">
        <button
          v-for="(category, key) in converter.categories.value"
          :key="key"
          @click="handleCategoryChange(key)"
          class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all"
          :class="[
            converter.selectedCategory.value === key
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="category.icon" />
          </svg>
          <span class="text-xs font-medium">{{ category.name }}</span>
        </button>
      </div>

      <!-- Currency loading/error state -->
      <div v-if="converter.selectedCategory.value === 'currency'" class="mb-4">
        <div v-if="converter.currencyLoading.value" class="flex items-center gap-2 text-neutral-400 text-sm">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando tasas de cambio...
        </div>
        <div v-else-if="converter.currencyError.value" class="text-red-400 text-sm">
          {{ converter.currencyError.value }}
        </div>
        <div v-else-if="converter.currencyLastUpdate.value" class="text-neutral-500 text-xs">
          Tasas actualizadas: {{ converter.currencyLastUpdate.value }}
        </div>
      </div>

      <!-- Converter Card -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-6 mb-6">
        <div class="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <!-- From -->
          <div>
            <label class="block text-sm text-neutral-400 mb-2">
              De <span class="text-white">{{ converter.availableUnits.value[converter.fromUnit.value]?.name }}</span>
            </label>
            <div class="flex gap-2">
              <input
                v-model.number="converter.inputValue.value"
                type="number"
                class="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0"
              />
              <select
                v-model="converter.fromUnit.value"
                class="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors min-w-[120px]"
              >
                <option v-for="(unit, key) in converter.availableUnits.value" :key="key" :value="key">
                  {{ unit.symbol }}
                </option>
              </select>
            </div>
          </div>

          <!-- Swap Button -->
          <button
            @click="converter.swapUnits"
            class="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors self-center mb-1"
            title="Intercambiar"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          <!-- To -->
          <div>
            <label class="block text-sm text-neutral-400 mb-2">
              A <span class="text-emerald-400">{{ converter.availableUnits.value[converter.toUnit.value]?.name }}</span>
            </label>
            <div class="flex gap-2">
              <input
                :value="converter.formatNumber(converter.result.value)"
                type="text"
                readonly
                class="flex-1 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-lg font-medium focus:outline-none"
              />
              <select
                v-model="converter.toUnit.value"
                class="px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors min-w-[120px]"
              >
                <option v-for="(unit, key) in converter.availableUnits.value" :key="key" :value="key">
                  {{ unit.symbol }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Full conversion text -->
        <div class="mt-4 p-4 bg-neutral-800/50 rounded-lg">
          <p class="text-neutral-300 text-center">
            <span class="text-white font-medium">{{ converter.inputValue.value }}</span>&nbsp;<span class="text-neutral-400">{{ converter.availableUnits.value[converter.fromUnit.value]?.name }}</span>
            <span class="text-neutral-500"> = </span>
            <span class="text-emerald-400 font-medium">{{ converter.formatNumber(converter.result.value) }}</span>&nbsp;<span class="text-neutral-400">{{ converter.availableUnits.value[converter.toUnit.value]?.name }}</span>
          </p>
        </div>
      </div>

      <!-- All conversions -->
      <div class="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Todas las conversiones</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="conversion in converter.allConversions.value"
            :key="conversion.key"
            @click="copyResult(conversion.value)"
            class="flex items-center justify-between p-3 bg-neutral-800/50 hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors group"
            :class="{ 'ring-1 ring-emerald-500/50 bg-emerald-500/10': conversion.key === converter.toUnit.value }"
          >
            <div>
              <p class="text-sm text-neutral-400">{{ conversion.name }}</p>
              <p class="text-xs text-neutral-500">{{ conversion.symbol }}</p>
            </div>
            <div class="text-right">
              <p class="text-white font-medium" :class="{ 'text-emerald-400': conversion.key === converter.toUnit.value }">
                {{ converter.formatNumber(conversion.value) }}
              </p>
              <p class="text-xs text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Click para copiar
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick reference -->
      <div class="mt-6 text-center text-neutral-500 text-sm">
        <p>Haz clic en cualquier resultado para copiarlo al portapapeles</p>
      </div>
    </div>
  </div>
</template>
