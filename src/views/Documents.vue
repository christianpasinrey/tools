<script setup>
import { useDocuments } from '../composables/useDocuments'
import DocumentsTabs from '../components/documents/DocumentsTabs.vue'

// Lazy load document editors
import PdfEditorContent from './PdfEditor.vue'
import SpreadsheetEditor from '../components/documents/SpreadsheetEditor.vue'
import MarkdownEditorContent from '../components/documents/MarkdownEditorContent.vue'

const docs = useDocuments()
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 text-neutral-300">
    <DocumentsTabs
      :active-tab="docs.activeTab.value"
      :theme-color="docs.themeColor.value"
      @change="(tab) => docs.activeTab.value = tab"
    />

    <div class="flex-1 overflow-hidden">
      <PdfEditorContent v-if="docs.activeTab.value === 'pdf'" />
      <SpreadsheetEditor v-if="docs.activeTab.value === 'spreadsheet'" :theme-color="docs.themeColor.value" />
      <MarkdownEditorContent v-if="docs.activeTab.value === 'markdown'" :theme-color="docs.themeColor.value" />
    </div>
  </div>
</template>
