<script setup>
import { ref, watch } from 'vue'
import { useConverter } from '../../composables/useConverter'
import { usePendingLaunch } from '../../composables/usePendingLaunch'
import Icon from '../icons/Icon.vue'
import TbProgress from '../ui/TbProgress.vue'
import ConverterJpgToPdf from './ConverterJpgToPdf.vue'
import ConverterPdfToJpg from './ConverterPdfToJpg.vue'
import ConverterPdfToWord from './ConverterPdfToWord.vue'
import ConverterPdfToExcel from './ConverterPdfToExcel.vue'

const converter = useConverter()

// Conversión (y archivo) elegidos desde la Home o la paleta
const launchFile = ref(null)
usePendingLaunch('converter:', ({ target, file }) => {
  launchFile.value = file
  converter.selectConversion(target.slice('converter:'.length))
})
// El archivo entregado solo vale para esa conversión: al salir de ella se olvida
watch(() => converter.activeConversion.value, (_, previous) => {
  if (previous) launchFile.value = null
})

const conversions = [
  { id: 'jpg-to-pdf', title: 'JPG a PDF', description: 'Une imágenes en un documento PDF, en el orden que elijas.', icon: 'image', route: 'JPG · PNG → PDF' },
  { id: 'pdf-to-jpg', title: 'PDF a JPG', description: 'Extrae cada página del PDF como una imagen JPG.', icon: 'file', route: 'PDF → JPG' },
  { id: 'pdf-to-word', title: 'PDF a Word', description: 'Saca el texto del PDF a un documento editable.', icon: 'documents', route: 'PDF → DOCX' },
  { id: 'pdf-to-excel', title: 'PDF a Excel', description: 'Pasa las tablas del PDF a una hoja de cálculo.', icon: 'table', route: 'PDF → XLSX' }
]
</script>

<template>
  <div class="relative h-full flex flex-col">
    <!-- Progreso de la conversión en curso -->
    <div v-if="converter.isProcessing.value" class="absolute inset-0 z-40 grid place-items-center p-4 bg-tb-bg/70 backdrop-blur-sm">
      <div class="w-full max-w-sm p-6 rounded-2xl border border-tb-line bg-tb-surface shadow-xl">
        <TbProgress :value="converter.progress.value" :label="converter.progressMessage.value || 'Convirtiendo…'" />
      </div>
    </div>

    <!-- Portada: elige la conversión -->
    <div v-if="!converter.activeConversion.value" class="flex-1 overflow-auto p-4 sm:p-8">
      <div class="max-w-3xl mx-auto">
        <h2 class="font-display text-2xl sm:text-3xl font-bold text-tb-ink">Conversor de documentos</h2>
        <p class="mt-1 text-sm text-tb-muted">Elige qué quieres convertir. Todo ocurre en tu navegador: los archivos no se suben a ningún sitio.</p>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="conv in conversions"
            :key="conv.id"
            type="button"
            data-test="conversion-card"
            class="conv-card group flex flex-col text-left p-5 rounded-2xl border border-tb-line bg-tb-surface"
            @click="converter.selectConversion(conv.id)"
          >
            <div class="flex items-start justify-between">
              <span class="grid place-items-center w-11 h-11 rounded-xl text-[var(--cat)] bg-[color-mix(in_srgb,var(--cat)_12%,transparent)]">
                <Icon :name="conv.icon" :size="20" />
              </span>
              <Icon name="arrow-right" :size="16" class="text-tb-muted transition-transform group-hover:translate-x-1 group-hover:text-[var(--cat)]" />
            </div>
            <h3 class="mt-4 font-display text-lg font-bold text-tb-ink">{{ conv.title }}</h3>
            <p class="mt-1 text-sm text-tb-muted">{{ conv.description }}</p>
            <p class="mt-auto pt-4 text-xs font-code text-[var(--cat)]">{{ conv.route }}</p>
          </button>
        </div>
      </div>
    </div>

    <ConverterJpgToPdf v-if="converter.activeConversion.value === 'jpg-to-pdf'" :converter="converter" :initial-file="launchFile" />
    <ConverterPdfToJpg v-if="converter.activeConversion.value === 'pdf-to-jpg'" :converter="converter" :initial-file="launchFile" />
    <ConverterPdfToWord v-if="converter.activeConversion.value === 'pdf-to-word'" :converter="converter" :initial-file="launchFile" />
    <ConverterPdfToExcel v-if="converter.activeConversion.value === 'pdf-to-excel'" :converter="converter" :initial-file="launchFile" />
  </div>
</template>

<style scoped>
.conv-card {
  transition: transform .35s var(--tb-spring), border-color .2s, box-shadow .35s;
}
.conv-card:hover,
.conv-card:focus-visible {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--cat) 45%, var(--tb-line));
  box-shadow: 0 14px 30px -18px color-mix(in srgb, var(--cat) 60%, transparent);
}
.conv-card:focus-visible { outline: 2px solid var(--cat); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .conv-card, .conv-card:hover { transform: none; }
}
</style>
