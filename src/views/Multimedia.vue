<script setup>
import { useMultimedia } from '../composables/useMultimedia'
import MultimediaTabs from '../components/multimedia/MultimediaTabs.vue'

// Import multimedia editors
import ImageEditor from './ImageEditor.vue'
import AudioEditor from './AudioEditor.vue'
import ThreeDPlayground from './3DPlayground.vue'
import SvgEditor from './SvgEditor.vue'

const media = useMultimedia()
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-neutral-950 text-neutral-300">
    <MultimediaTabs
      :active-tab="media.activeTab.value"
      :theme-color="media.themeColor.value"
      @change="(tab) => media.activeTab.value = tab"
    />

    <div class="flex-1 overflow-hidden">
      <ImageEditor v-if="media.activeTab.value === 'image'" />
      <AudioEditor v-if="media.activeTab.value === 'audio'" />
      <ThreeDPlayground v-if="media.activeTab.value === '3d'" />
      <SvgEditor v-if="media.activeTab.value === 'svg'" />
    </div>
  </div>
</template>
