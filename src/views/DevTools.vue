<script setup>
import { useDevTools } from '../composables/useDevTools'
import DevToolsToolbar from '../components/devtools/DevToolsToolbar.vue'
import DevToolsTabs from '../components/devtools/DevToolsTabs.vue'
import JsonTools from '../components/devtools/JsonTools.vue'
import HtmlPlayground from '../components/devtools/HtmlPlayground.vue'
import VaultSaveLoad from '../components/common/VaultSaveLoad.vue'

const editor = useDevTools()

const getSnippetData = () => ({
  htmlCode: editor.htmlCode.value,
  cssCode: editor.cssCode.value,
  jsCode: editor.jsCode.value
})

const loadSnippet = (data) => {
  editor.htmlCode.value = data.htmlCode || ''
  editor.cssCode.value = data.cssCode || ''
  editor.jsCode.value = data.jsCode || ''
  editor.activeTab.value = 'playground'
  editor.runCode()
}
</script>

<template>
  <div class="app-container">
    <DevToolsToolbar
      :theme-color="editor.themeColor.value"
      :get-data="getSnippetData"
      @color-change="editor.setThemeColor"
      @load="loadSnippet"
    />

    <DevToolsTabs
      :active-tab="editor.activeTab.value"
      :theme-color="editor.themeColor.value"
      @change="(tab) => editor.activeTab.value = tab"
    />

    <div class="flex-1 overflow-auto">
      <JsonTools
        v-if="editor.activeTab.value === 'json'"
        v-model:input="editor.jsonInput.value"
        :output="editor.jsonOutput.value"
        :error="editor.jsonError.value"
        :theme-color="editor.themeColor.value"
        @format="editor.formatJson"
        @minify="editor.minifyJson"
        @validate="editor.validateJson"
        @to-yaml="editor.jsonToYaml"
        @from-yaml="editor.yamlToJson"
        @copy="editor.copyToClipboard"
        @clear="editor.clearJson"
      />

      <HtmlPlayground
        v-if="editor.activeTab.value === 'playground'"
        v-model:htmlCode="editor.htmlCode.value"
        v-model:cssCode="editor.cssCode.value"
        v-model:jsCode="editor.jsCode.value"
        v-model:autoRun="editor.autoRun.value"
        :console-output="editor.consoleOutput.value"
        :preview-key="editor.previewKey.value"
        :theme-color="editor.themeColor.value"
        @run="editor.runCode"
        @clear="editor.clearPlayground"
        @clear-console="editor.clearConsole"
        @console-message="editor.addConsoleMessage"
        @load-template="editor.loadTemplate"
      />
    </div>
  </div>
</template>
