<script setup>
import { ref, onMounted } from 'vue'
import TbEmptyState from '../ui/TbEmptyState.vue'
import TbButton from '../ui/TbButton.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import ConverterView from './ConverterView.vue'
import { isPdf } from './converterFiles'

const props = defineProps({
  converter: { type: Object, required: true },
  initialFile: { type: Object, default: null }
})

const images = ref([])
const pdfName = ref('')
const scale = ref(2)
const quality = ref(0.92)
const hasFile = ref(false)

const handleFiles = async (files) => {
  const file = files[0]
  if (!isPdf(file)) {
    props.converter.showToast('Este conversor solo acepta archivos PDF', 'error')
    return
  }
  pdfName.value = file.name.replace(/\.pdf$/i, '')
  hasFile.value = true
  images.value = (await props.converter.pdfToJpg(file, scale.value, quality.value)) || []
}

// Archivo entregado desde la Home
onMounted(() => { if (props.initialFile) handleFiles([props.initialFile]) })

const downloadImage = (img) => {
  props.converter.downloadJpgImage(img.dataUrl, img.pageNum, pdfName.value)
}

const downloadAll = () => {
  for (const img of images.value) {
    props.converter.downloadJpgImage(img.dataUrl, img.pageNum, pdfName.value)
  }
}

const reset = () => {
  images.value = []
  pdfName.value = ''
  hasFile.value = false
}
</script>

<template>
  <ConverterView title="PDF a JPG" description="Extrae cada página del PDF como imagen JPG" wide @back="converter.goBack()">
    <template #actions>
      <TbButton v-if="hasFile" size="sm" variant="ghost" @click="reset">Nuevo archivo</TbButton>
    </template>

    <template v-if="!hasFile">
      <div class="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 p-3.5 rounded-xl border border-tb-line bg-tb-surface text-sm">
        <label class="flex items-center gap-2 text-tb-muted">
          Escala
          <select v-model.number="scale" class="h-8 px-2 rounded-lg border border-tb-line-strong bg-tb-surface text-tb-ink">
            <option :value="1">1× (baja)</option>
            <option :value="2">2× (media)</option>
            <option :value="3">3× (alta)</option>
            <option :value="4">4× (máxima)</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-tb-muted">
          Calidad
          <input v-model.number="quality" type="range" min="0.5" max="1" step="0.01" class="w-28 accent-[var(--cat)]" />
          <span class="w-10 font-code text-xs text-tb-ink">{{ Math.round(quality * 100) }} %</span>
        </label>
      </div>
      <TbEmptyState
        icon="file"
        title="Suelta un PDF aquí"
        accept="application/pdf,.pdf"
        :chips="['PDF → JPG por página']"
        formats="Conversión 100 % local: el archivo no sale de tu equipo"
        @files="handleFiles"
      />
    </template>

    <template v-if="images.length > 0">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p class="text-sm text-tb-muted">
          {{ images.length }} {{ images.length === 1 ? 'página extraída' : 'páginas extraídas' }} de
          <span class="font-medium text-tb-ink">{{ pdfName }}.pdf</span>
        </p>
        <TbButton variant="primary" size="sm" icon="download" @click="downloadAll">Descargar todo</TbButton>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <figure v-for="img in images" :key="img.pageNum" class="rounded-xl border border-tb-line overflow-hidden bg-tb-surface">
          <img :src="img.dataUrl" :alt="'Página ' + img.pageNum" class="w-full aspect-[3/4] object-cover bg-white" />
          <figcaption class="flex items-center gap-2 px-2.5 py-2 border-t border-tb-line">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-tb-ink">Página {{ img.pageNum }}</p>
              <p class="text-[11px] text-tb-muted font-code">{{ img.width }} × {{ img.height }} px</p>
            </div>
            <TbIconButton size="sm" icon="download" :label="`Descargar página ${img.pageNum}`" @click="downloadImage(img)" />
          </figcaption>
        </figure>
      </div>
    </template>
  </ConverterView>
</template>
