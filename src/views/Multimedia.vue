<script setup>
import { useMultimedia } from '../composables/useMultimedia'

// Import multimedia editors
import ImageEditor from './ImageEditor.vue'
import AudioEditor from './AudioEditor.vue'
import ThreeDPlayground from './3DPlayground.vue'
import SvgEditor from './SvgEditor.vue'

const media = useMultimedia()
</script>

<template>
  <div class="app-container">

    <div class="flex-1 overflow-hidden">
      <ImageEditor v-if="media.activeTab.value === 'image'" />
      <AudioEditor v-if="media.activeTab.value === 'audio'" />
      <ThreeDPlayground v-if="media.activeTab.value === '3d'" />
      <SvgEditor v-if="media.activeTab.value === 'svg'" />
    </div>
  </div>
</template>
