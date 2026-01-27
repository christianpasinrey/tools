<script setup>
import { useDocuments } from '../composables/useDocuments'
import { useDevice } from '../composables/useDevice'
import DocumentsTabs from '../components/documents/DocumentsTabs.vue'

// Lazy load document editors
import PdfEditorContent from './PdfEditor.vue'
import SpreadsheetEditor from '../components/documents/SpreadsheetEditor.vue'
import DocxEditor from '../components/documents/DocxEditor.vue'
import MarkdownEditorContent from '../components/documents/MarkdownEditorContent.vue'
import MobileMarkdownEditor from '../components/documents/MobileMarkdownEditor.vue'

const docs = useDocuments()
const { isMobile } = useDevice()
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-950 text-neutral-300">
    <DocumentsTabs
      :active-tab="docs.activeTab.value"
      :theme-color="docs.themeColor.value"
      @change="(tab) => docs.activeTab.value = tab"
    />

    <div class="flex-1 overflow-auto">
      <PdfEditorContent v-if="docs.activeTab.value === 'pdf'" />
      <SpreadsheetEditor v-if="docs.activeTab.value === 'spreadsheet'" :theme-color="docs.themeColor.value" />
      <DocxEditor v-if="docs.activeTab.value === 'docx'" :theme-color="docs.themeColor.value" />
      <!-- Markdown: mobile vs desktop -->
      <template v-if="docs.activeTab.value === 'markdown'">
        <MobileMarkdownEditor v-if="isMobile" />
        <MarkdownEditorContent v-else :theme-color="docs.themeColor.value" />
      </template>
    </div>
  </div>
</template>
