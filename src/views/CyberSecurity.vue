<script setup>
import { useCyberSecurity } from '../composables/useCyberSecurity'
import CyberSecurityToolbar from '../components/cybersecurity/CyberSecurityToolbar.vue'
import CyberSecurityTabs from '../components/cybersecurity/CyberSecurityTabs.vue'
import JwtDebugger from '../components/cybersecurity/JwtDebugger.vue'
import Base64Encoder from '../components/cybersecurity/Base64Encoder.vue'
import HashGenerator from '../components/cybersecurity/HashGenerator.vue'

const cs = useCyberSecurity()
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-neutral-950 text-neutral-300">
    <CyberSecurityToolbar
      :theme-color="cs.themeColor.value"
      @color-change="cs.setThemeColor"
    />

    <CyberSecurityTabs
      :active-tab="cs.activeTab.value"
      :theme-color="cs.themeColor.value"
      @change="(tab) => cs.activeTab.value = tab"
    />

    <div class="flex-1 overflow-hidden">
      <JwtDebugger
        v-if="cs.activeTab.value === 'jwt'"
        v-model:input="cs.jwtInput.value"
        v-model:secret="cs.jwtSecret.value"
        :decoded="cs.jwtDecoded.value"
        :error="cs.jwtError.value"
        :is-expired="cs.isExpired.value"
        :expiration-date="cs.expirationDate.value"
        :issued-at-date="cs.issuedAtDate.value"
        :signature-valid="cs.signatureValid.value"
        :theme-color="cs.themeColor.value"
        @decode="cs.decodeJwt"
        @clear="cs.clearJwt"
        @copy="cs.copyToClipboard"
      />

      <Base64Encoder
        v-if="cs.activeTab.value === 'base64'"
        v-model:input="cs.base64Input.value"
        v-model:mode="cs.base64Mode.value"
        :output="cs.base64Output.value"
        :error="cs.base64Error.value"
        :theme-color="cs.themeColor.value"
        @process="cs.base64Process"
        @swap="cs.swapBase64"
        @clear="cs.clearBase64"
        @copy="cs.copyToClipboard"
        @file-upload="cs.handleFileUpload"
      />

      <HashGenerator
        v-if="cs.activeTab.value === 'hash'"
        v-model:input="cs.hashInput.value"
        v-model:algorithm="cs.hashAlgorithm.value"
        :results="cs.hashResults.value"
        :loading="cs.hashLoading.value"
        :algorithms="cs.algorithms"
        :theme-color="cs.themeColor.value"
        @generate="cs.generateSingleHash"
        @generate-all="cs.generateAllHashes"
        @clear="cs.clearHash"
        @copy="cs.copyToClipboard"
      />
    </div>
  </div>
</template>
