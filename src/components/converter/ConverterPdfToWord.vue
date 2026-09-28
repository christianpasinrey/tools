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
  'Solo se extrae texto, no imágenes ni formato complejo',
  'Los PDF escaneados (imágenes) no producen contenido',
  'Los diseños a varias columnas se fusionan en una sola'
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
  props.converter.pdfToWord(pdfFile.value)
}
</script>

<template>
  <ConverterView title="PDF a Word" description="Extrae el texto del PDF a un documento DOCX" @back="converter.goBack()">
    <ConverterNotice :items="limits" />

    <TbEmptyState
      v-if="!pdfFile"
      icon="file"
      title="Suelta un PDF aquí"
      accept="application/pdf,.pdf"
      :chips="['PDF → DOCX']"
      formats="Conversión 100 % local: el archivo no sale de tu equipo"
      @files="handleFiles"
    />

    <template v-else>
      <ConverterFileCard :file="pdfFile" @change="pdfFile = null" />
      <TbButton variant="primary" icon="download" class="w-full" :loading="converter.isProcessing.value" @click="convert">
        Convertir a Word
      </TbButton>
    </template>
  </ConverterView>
</template>
