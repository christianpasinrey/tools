<script setup>
import { ref, onMounted } from 'vue'
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

// Copy result to clipboard with visual feedback
const copiedKey = ref(null)
let copiedTimeout = null

const copyResult = async (conversion) => {
  try {
    await navigator.clipboard.writeText(converter.formatNumber(conversion.value))
    copiedKey.value = conversion.key
    clearTimeout(copiedTimeout)
    copiedTimeout = setTimeout(() => { copiedKey.value = null }, 1500)
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
        <h1 class="text-3xl font-bold text-primary mb-2">Unit Converter</h1>
        <p class="text-muted">Convierte entre diferentes unidades de medida y monedas</p>
      </div>

      <!-- Categories Grid -->
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 mb-8" role="tablist" aria-label="Categorías de conversión">
        <button
          v-for="(category, key) in converter.categories.value"
          :key="key"
          type="button"
          role="tab"
          :aria-selected="converter.selectedCategory.value === key"
          @click="handleCategoryChange(key)"
          class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          :class="[
            converter.selectedCategory.value === key
              ? 'bg-emerald-500/15 border-emerald-600 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500 dark:text-emerald-400'
              : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-300'
          ]"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="category.icon" />
          </svg>
          <span class="text-xs font-medium">{{ category.name }}</span>
        </button>
      </div>

      <!-- Currency loading/error state -->
      <div v-if="converter.selectedCategory.value === 'currency'" class="mb-4" aria-live="polite">
        <div v-if="converter.currencyLoading.value" class="flex items-center gap-2 text-muted text-sm">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando tasas de cambio...
        </div>
        <div v-else-if="converter.currencyError.value" class="text-red-600 dark:text-red-400 text-sm">
          {{ converter.currencyError.value }}
        </div>
        <div v-else-if="converter.currencyLastUpdate.value" class="text-muted text-xs">
          Tasas actualizadas: {{ converter.currencyLastUpdate.value }}
        </div>
      </div>

      <!-- Converter Card -->
      <div class="tool-card p-6 mb-6">
        <div class="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <!-- From -->
          <div>
            <label for="converter-from" class="block text-sm text-secondary mb-2">
              De <span class="text-primary font-medium">{{ converter.availableUnits.value[converter.fromUnit.value]?.name }}</span>
            </label>
            <div class="flex gap-2">
              <input
                id="converter-from"
                v-model.number="converter.inputValue.value"
                type="number"
                class="themed-input flex-1 text-lg"
                placeholder="0"
              />
              <select
                v-model="converter.fromUnit.value"
                aria-label="Unidad de origen"
                class="themed-select min-w-[120px]"
              >
                <option v-for="(unit, key) in converter.availableUnits.value" :key="key" :value="key">
                  {{ unit.symbol }}
                </option>
              </select>
            </div>
          </div>

          <!-- Swap Button -->
          <button
            type="button"
            @click="converter.swapUnits"
            class="themed-btn self-center mb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            title="Intercambiar unidades"
            aria-label="Intercambiar unidades"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          <!-- To -->
          <div>
            <label for="converter-to" class="block text-sm text-secondary mb-2">
              A <span class="text-emerald-700 dark:text-emerald-400 font-medium">{{ converter.availableUnits.value[converter.toUnit.value]?.name }}</span>
            </label>
            <div class="flex gap-2">
              <input
                id="converter-to"
                :value="converter.formatNumber(converter.result.value)"
                type="text"
                readonly
                class="flex-1 px-4 py-3 bg-emerald-500/10 border border-emerald-600/30 dark:border-emerald-500/30 rounded-lg text-emerald-700 dark:text-emerald-400 text-lg font-medium focus:outline-none"
              />
              <select
                v-model="converter.toUnit.value"
                aria-label="Unidad de destino"
                class="themed-select min-w-[120px]"
              >
                <option v-for="(unit, key) in converter.availableUnits.value" :key="key" :value="key">
                  {{ unit.symbol }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Full conversion text -->
        <div class="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg">
          <p class="text-secondary text-center">
            <span class="text-primary font-medium">{{ converter.inputValue.value }}</span>&nbsp;<span class="text-muted">{{ converter.availableUnits.value[converter.fromUnit.value]?.name }}</span>
            <span class="text-muted"> = </span>
            <span class="text-emerald-700 dark:text-emerald-400 font-medium">{{ converter.formatNumber(converter.result.value) }}</span>&nbsp;<span class="text-muted">{{ converter.availableUnits.value[converter.toUnit.value]?.name }}</span>
          </p>
        </div>
      </div>

      <!-- All conversions -->
      <div class="tool-card p-6">
        <h2 class="text-lg font-semibold text-primary mb-4">Todas las conversiones</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            v-for="conversion in converter.allConversions.value"
            :key="conversion.key"
            type="button"
            @click="copyResult(conversion)"
            :aria-label="`Copiar ${converter.formatNumber(conversion.value)} ${conversion.name}`"
            class="flex items-center justify-between text-left p-3 bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 rounded-lg cursor-pointer transition-colors group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            :class="{ 'ring-1 ring-emerald-600/50 dark:ring-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/10': conversion.key === converter.toUnit.value }"
          >
            <div>
              <p class="text-sm text-secondary">{{ conversion.name }}</p>
              <p class="text-xs text-muted">{{ conversion.symbol }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium" :class="conversion.key === converter.toUnit.value ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary'">
                {{ converter.formatNumber(conversion.value) }}
              </p>
              <p
                class="text-xs transition-opacity"
                :class="copiedKey === conversion.key
                  ? 'text-emerald-700 dark:text-emerald-400 opacity-100'
                  : 'text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'"
              >
                {{ copiedKey === conversion.key ? '¡Copiado!' : 'Click para copiar' }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Quick reference -->
      <div class="mt-6 text-center text-muted text-sm">
        <p>Haz clic en cualquier resultado para copiarlo al portapapeles</p>
      </div>
    </div>
  </div>
</template>
