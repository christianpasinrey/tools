<script setup>
import { ref, onMounted } from 'vue'
import TbEmptyState from '../ui/TbEmptyState.vue'
import TbButton from '../ui/TbButton.vue'
import ConverterView from './ConverterView.vue'
import ConverterNotice from './ConverterNotice.vue'
import ConverterFileCard from './ConverterFileCard.vue'
import { isPdf } from './converterFiles'

const props = defineProps({
  converter: { type: Object, required: true },
  initialFile: { type: Object, default: null }
})

const limits = [
  'Funciona mejor con PDF que contienen tablas',
  'No detecta celdas combinadas',
  'Los PDF sin tablas se exportan como texto en una columna',
  'Los PDF escaneados (imágenes) no producen contenido'
]

const pdfFile = ref(null)

const handleFiles = (files) => {
  const file = files[0]
  if (!isPdf(file)) {
    props.converter.showToast('Este conversor solo acepta archivos PDF', 'error')
    return
  }
  pdfFile.value = file
}

// Archivo entregado desde la Home
onMounted(() => { if (props.initialFile) handleFiles([props.initialFile]) })

const convert = () => {
  if (!pdfFile.value) return
  props.converter.pdfToExcel(pdfFile.value)
}
</script>

<template>
  <ConverterView title="PDF a Excel" description="Extrae datos tabulares del PDF a un archivo XLSX" @back="converter.goBack()">
    <ConverterNotice :items="limits" />

    <TbEmptyState
      v-if="!pdfFile"
      icon="file"
      title="Suelta un PDF aquí"
      accept="application/pdf,.pdf"
      :chips="['PDF → XLSX']"
      formats="Conversión 100 % local: el archivo no sale de tu equipo"
      @files="handleFiles"
    />

    <template v-else>
      <ConverterFileCard :file="pdfFile" @change="pdfFile = null" />
      <TbButton variant="primary" icon="download" class="w-full" :loading="converter.isProcessing.value" @click="convert">
        Convertir a Excel
      </TbButton>
    </template>
  </ConverterView>
</template>
