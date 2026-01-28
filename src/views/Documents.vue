<script setup>
import { useDocuments } from '../composables/useDocuments'
import { useDevice } from '../composables/useDevice'
import DocumentsTabs from '../components/documents/DocumentsTabs.vue'

// Desktop document editors
import PdfEditorContent from './PdfEditor.vue'
import SpreadsheetEditor from '../components/documents/SpreadsheetEditor.vue'
import DocxEditor from '../components/documents/DocxEditor.vue'
import MarkdownEditorContent from '../components/documents/MarkdownEditorContent.vue'

// Mobile document editors
import MobileMarkdownEditor from '../components/documents/MobileMarkdownEditor.vue'
import MobileDocxEditor from '../components/documents/MobileDocxEditor.vue'
import MobileSpreadsheetEditor from '../components/documents/MobileSpreadsheetEditor.vue'

const docs = useDocuments()
const { isMobile } = useDevice()
</script>

<template>
  <div class="h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-300">
    <DocumentsTabs
      :active-tab="docs.activeTab.value"
      :theme-color="docs.themeColor.value"
      @change="(tab) => docs.activeTab.value = tab"
    />

    <div class="flex-1 overflow-auto">
      <!-- PDF (same for mobile/desktop for now) -->
      <PdfEditorContent v-if="docs.activeTab.value === 'pdf'" />

      <!-- Spreadsheet: mobile vs desktop -->
      <template v-if="docs.activeTab.value === 'spreadsheet'">
        <MobileSpreadsheetEditor v-if="isMobile" />
        <SpreadsheetEditor v-else :theme-color="docs.themeColor.value" />
      </template>

      <!-- DOCX: mobile vs desktop -->
      <template v-if="docs.activeTab.value === 'docx'">
        <MobileDocxEditor v-if="isMobile" />
        <DocxEditor v-else :theme-color="docs.themeColor.value" />
      </template>

      <!-- Markdown: mobile vs desktop -->
      <template v-if="docs.activeTab.value === 'markdown'">
        <MobileMarkdownEditor v-if="isMobile" />
        <MarkdownEditorContent v-else :theme-color="docs.themeColor.value" />
      </template>
    </div>
  </div>
</template>
