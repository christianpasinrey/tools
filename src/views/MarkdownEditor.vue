<script setup>
import { useDevice } from '../composables/useDevice'
import MarkdownEditorContent from '../components/documents/MarkdownEditorContent.vue'
import MobileMarkdownEditor from '../components/documents/MobileMarkdownEditor.vue'

const { isMobile } = useDevice()
</script>

<template>
  <div class="min-h-screen app-bg">
    <!-- Mobile version -->
    <MobileMarkdownEditor v-if="isMobile" class="h-screen" />

    <!-- Desktop version -->
    <div v-else class="h-screen flex flex-col">
      <MarkdownEditorContent class="flex-1" />
    </div>
  </div>
</template>
