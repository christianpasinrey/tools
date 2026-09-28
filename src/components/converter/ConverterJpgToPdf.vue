<script setup>
import { ref, reactive, onMounted } from 'vue'
import Icon from '../icons/Icon.vue'
import TbEmptyState from '../ui/TbEmptyState.vue'
import TbButton from '../ui/TbButton.vue'
import TbIconButton from '../ui/TbIconButton.vue'
import TbSegmented from '../ui/TbSegmented.vue'
import ConverterView from './ConverterView.vue'
import { formatSize } from './converterFiles'

const props = defineProps({
  converter: { type: Object, required: true },
  initialFile: { type: Object, default: null }
})

const imageFiles = ref([])
const imagePreviews = ref([])
const pageSize = ref('fit')
const dragIndex = ref(null)
const pageSizes = [
  { value: 'fit', label: 'Ajustar a la imagen' },
  { value: 'a4', label: 'A4 centrado' }
]

const isImage = (f) => f.type === 'image/jpeg' || f.type === 'image/png'

const handleFiles = (files) => {
  const validFiles = files.filter(isImage)
  if (validFiles.length === 0) {
    props.converter.showToast('Este conversor solo acepta imágenes JPG y PNG', 'error')
    return
  }
  const skipped = files.length - validFiles.length
  if (skipped) {
    props.converter.showToast(`${skipped} ${skipped === 1 ? 'archivo ignorado' : 'archivos ignorados'}: solo JPG y PNG`, 'info')
  }

  for (const file of validFiles) {
    // La miniatura ocupa ya su sitio: el orden es el de los archivos, no el de lectura
    const preview = reactive({ name: file.name, src: '', size: file.size })
    imageFiles.value.push(file)
    imagePreviews.value.push(preview)
    const reader = new FileReader()
    reader.onload = (e) => { preview.src = e.target.result }
    reader.readAsDataURL(file)
  }
}

// Archivo entregado desde la Home
onMounted(() => { if (props.initialFile) handleFiles([props.initialFile]) })

const onPick = (e) => {
  handleFiles(Array.from(e.target.files || []))
  e.target.value = ''
}

const removeImage = (index) => {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

const clearAll = () => {
  imageFiles.value = []
  imagePreviews.value = []
}

const move = (from, to) => {
  if (from === null || from === to || to < 0 || to >= imageFiles.value.length) return
  const movedFile = imageFiles.value.splice(from, 1)[0]
  const movedPreview = imagePreviews.value.splice(from, 1)[0]
  imageFiles.value.splice(to, 0, movedFile)
  imagePreviews.value.splice(to, 0, movedPreview)
}

const onDrop = (targetIndex) => {
  move(dragIndex.value, targetIndex)
  dragIndex.value = null
}

const convert = () => {
  if (imageFiles.value.length === 0) return
  props.converter.jpgToPdf(imageFiles.value, pageSize.value)
}
</script>

<template>
  <ConverterView title="JPG a PDF" description="Une imágenes JPG o PNG en un documento PDF" wide @back="converter.goBack()">
    <TbEmptyState
      v-if="imagePreviews.length === 0"
      icon="image"
      title="Suelta imágenes JPG o PNG"
      button-label="Elegir imágenes"
      accept="image/jpeg,image/png"
      multiple
      :chips="['JPG', 'PNG', 'varias a la vez']"
      formats="Conversión 100 % local: las imágenes no salen de tu equipo"
      @files="handleFiles"
    />

    <template v-else>
      <div class="mb-4 flex flex-wrap items-center gap-3 p-3 rounded-xl border border-tb-line bg-tb-surface">
        <span class="text-sm text-tb-muted">Página</span>
        <TbSegmented v-model="pageSize" :options="pageSizes" label="Tamaño de página" size="sm" />
        <TbButton size="sm" variant="ghost" icon="trash" class="ml-auto" @click="clearAll">Quitar todas</TbButton>
      </div>

      <ol class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        <li
          v-for="(img, index) in imagePreviews"
          :key="img.name + index"
          draggable="true"
          class="relative rounded-xl border border-tb-line overflow-hidden bg-tb-surface cursor-grab active:cursor-grabbing"
          :class="dragIndex === index && 'opacity-50'"
          @dragstart="dragIndex = index"
          @dragend="dragIndex = null"
          @dragover.prevent
          @drop.prevent="onDrop(index)"
        >
          <img v-if="img.src" :src="img.src" :alt="img.name" class="w-full aspect-[3/4] object-cover" />
          <div v-else class="w-full aspect-[3/4] bg-tb-surface-2 animate-pulse"></div>
          <span class="absolute top-2 left-2 grid place-items-center min-w-6 h-6 px-1.5 rounded-full text-xs font-code font-semibold bg-tb-surface text-tb-ink shadow">{{ index + 1 }}</span>
          <div class="flex items-center gap-0.5 pl-2.5 pr-1 py-1.5 border-t border-tb-line">
            <div class="flex-1 min-w-0">
              <p class="text-xs text-tb-ink truncate">{{ img.name }}</p>
              <p class="text-[11px] text-tb-muted font-code">{{ formatSize(img.size) }}</p>
            </div>
            <TbIconButton v-if="index > 0" size="sm" :label="`Mover ${img.name} antes`" @click="move(index, index - 1)">
              <Icon name="arrow-right" :size="14" class="rotate-180" />
            </TbIconButton>
            <TbIconButton size="sm" icon="x" tone="danger" :label="`Quitar ${img.name}`" @click="removeImage(index)" />
          </div>
        </li>

        <li>
          <label class="flex flex-col items-center justify-center gap-2 h-full min-h-40 rounded-xl border-2 border-dashed border-tb-line-strong text-tb-muted hover:border-[var(--cat)] hover:text-[var(--cat)] focus-within:border-[var(--cat)] focus-within:text-[var(--cat)] cursor-pointer transition-colors">
            <input type="file" class="sr-only" accept="image/jpeg,image/png" multiple @change="onPick" />
            <Icon name="upload" :size="20" />
            <span class="text-xs font-medium">Añadir más</span>
          </label>
        </li>
      </ol>

      <p class="text-xs text-tb-muted mb-4">
        {{ imagePreviews.length }} {{ imagePreviews.length === 1 ? 'imagen' : 'imágenes' }} · arrastra o usa la flecha para cambiar el orden
      </p>

      <TbButton variant="primary" icon="download" class="w-full" :loading="converter.isProcessing.value" @click="convert">
        Convertir a PDF
      </TbButton>
    </template>
  </ConverterView>
</template>
