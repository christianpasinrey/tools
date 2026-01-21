<script setup>
import { useCyberSecurity } from '../composables/useCyberSecurity'
import CyberSecurityToolbar from '../components/cybersecurity/CyberSecurityToolbar.vue'
import CyberSecurityTabs from '../components/cybersecurity/CyberSecurityTabs.vue'
import JwtDebugger from '../components/cybersecurity/JwtDebugger.vue'
import Base64Encoder from '../components/cybersecurity/Base64Encoder.vue'
import HashGenerator from '../components/cybersecurity/HashGenerator.vue'
import UrlEncoder from '../components/cybersecurity/UrlEncoder.vue'
import PasswordGenerator from '../components/cybersecurity/PasswordGenerator.vue'
import UuidGenerator from '../components/cybersecurity/UuidGenerator.vue'
import TimestampConverter from '../components/cybersecurity/TimestampConverter.vue'
import HexConverter from '../components/cybersecurity/HexConverter.vue'

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

      <UrlEncoder
        v-if="cs.activeTab.value === 'url'"
        v-model:input="cs.urlInput.value"
        v-model:mode="cs.urlMode.value"
        :output="cs.urlOutput.value"
        :error="cs.urlError.value"
        :theme-color="cs.themeColor.value"
        @process="cs.urlProcess"
        @encode-all="cs.urlEncodeAll"
        @swap="cs.swapUrl"
        @clear="cs.clearUrl"
        @copy="cs.copyToClipboard"
      />

      <PasswordGenerator
        v-if="cs.activeTab.value === 'password'"
        v-model:length="cs.passwordLength.value"
        v-model:options="cs.passwordOptions.value"
        :password="cs.generatedPassword.value"
        :strength="cs.passwordStrength.value"
        :history="cs.passwordHistory.value"
        :theme-color="cs.themeColor.value"
        @generate="cs.generatePassword"
        @clear="cs.clearPassword"
        @copy="cs.copyToClipboard"
      />

      <UuidGenerator
        v-if="cs.activeTab.value === 'uuid'"
        v-model:version="cs.uuidVersion.value"
        v-model:count="cs.uuidCount.value"
        :uuids="cs.generatedUuids.value"
        :theme-color="cs.themeColor.value"
        @generate="cs.generateUuid"
        @clear="cs.clearUuids"
        @copy="cs.copyToClipboard"
      />

      <TimestampConverter
        v-if="cs.activeTab.value === 'timestamp'"
        v-model:timestamp-input="cs.timestampInput.value"
        v-model:timestamp-unit="cs.timestampUnit.value"
        v-model:date-input="cs.dateInput.value"
        :result="cs.timestampResult.value"
        :current-timestamp="cs.currentTimestamp.value"
        :theme-color="cs.themeColor.value"
        @timestamp-to-date="cs.timestampToDate"
        @date-to-timestamp="cs.dateToTimestamp"
        @set-current="cs.setCurrentTimestamp"
        @clear="cs.clearTimestamp"
        @copy="cs.copyToClipboard"
        @start-updater="cs.startTimestampUpdater"
        @stop-updater="cs.stopTimestampUpdater"
      />

      <HexConverter
        v-if="cs.activeTab.value === 'hex'"
        v-model:input="cs.hexInput.value"
        v-model:format="cs.hexFormat.value"
        :results="cs.hexResults.value"
        :error="cs.hexError.value"
        :theme-color="cs.themeColor.value"
        @convert="cs.hexConvert"
        @clear="cs.clearHex"
        @copy="cs.copyToClipboard"
      />
    </div>
  </div>
</template>
