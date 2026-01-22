<script setup>
import { ref } from 'vue'
import { useApiTester } from '../composables/useApiTester'
import CollectionsSidebar from '../components/apitester/CollectionsSidebar.vue'
import RequestPanel from '../components/apitester/RequestPanel.vue'
import ResponsePanel from '../components/apitester/ResponsePanel.vue'

const api = useApiTester()
const saveModalOpen = ref(false)
const saveRequestName = ref('')
const showStorageWarning = ref(!localStorage.getItem('api-tester-warning-dismissed'))

function dismissWarning() {
  showStorageWarning.value = false
  localStorage.setItem('api-tester-warning-dismissed', '1')
}

function handleSaveToCollection(collectionId) {
  api.saveToCollection(collectionId, saveRequestName.value || undefined)
  saveModalOpen.value = false
  saveRequestName.value = ''
}

function openSaveModal() {
  if (!api.url.value) return
  saveRequestName.value = `${api.method.value} ${api.url.value.split('?')[0].split('/').pop() || api.url.value}`
  saveModalOpen.value = true
}
</script>

<template>
  <div class="h-full flex">
    <!-- Sidebar -->
    <div v-if="api.showSidebar.value" class="w-64 shrink-0">
      <CollectionsSidebar
        :collections="api.collections.value"
        :history="api.history.value"
        :sidebar-tab="api.sidebarTab.value"
        :get-method-color="api.getMethodColor"
        @update:sidebar-tab="(v) => api.sidebarTab.value = v"
        @create-collection="() => api.createCollection()"
        @rename-collection="(id, name) => api.renameCollection(id, name)"
        @delete-collection="(id) => api.deleteCollection(id)"
        @toggle-collection="(id) => api.toggleCollection(id)"
        @load-request="(req) => api.loadCollectionRequest(req)"
        @delete-request="(colId, reqId) => api.deleteCollectionRequest(colId, reqId)"
        @load-history="(entry) => api.loadHistoryEntry(entry)"
        @clear-history="() => api.clearHistory()"
        @export-postman="() => api.exportPostman()"
        @export-hoppscotch="() => api.exportHoppscotch()"
      />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- URL Bar -->
      <div class="flex items-center gap-2 p-3 border-b border-neutral-800">
        <!-- Toggle Sidebar -->
        <button
          @click="api.showSidebar.value = !api.showSidebar.value"
          class="text-neutral-500 hover:text-neutral-300 transition-colors shrink-0"
          title="Toggle sidebar"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Method Selector -->
        <select
          :value="api.method.value"
          @change="api.method.value = $event.target.value"
          class="bg-neutral-800 border border-neutral-700 rounded px-2 py-2 text-sm font-bold outline-none focus:border-amber-500/50 shrink-0 cursor-pointer"
          :style="{ color: api.getMethodColor(api.method.value) }"
        >
          <option
            v-for="m in api.HTTP_METHODS"
            :key="m"
            :value="m"
            :style="{ color: api.getMethodColor(m) }"
          >
            {{ m }}
          </option>
        </select>

        <!-- URL Input -->
        <input
          v-model="api.url.value"
          placeholder="https://api.example.com/endpoint"
          @keydown.enter="api.sendRequest()"
          class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50 font-mono"
        />

        <!-- Save Button -->
        <button
          @click="openSaveModal"
          class="px-3 py-2 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded border border-neutral-700 transition-colors shrink-0"
          title="Save to collection"
          :disabled="!api.url.value"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
        </button>

        <!-- Example Button -->
        <button
          v-if="!api.url.value"
          @click="api.loadExample()"
          class="px-3 py-2 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded transition-colors shrink-0"
        >
          Example
        </button>

        <!-- Send Button -->
        <button
          @click="api.sendRequest()"
          :disabled="!api.url.value || api.isLoading.value"
          class="px-5 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-neutral-900 rounded transition-colors shrink-0"
        >
          {{ api.isLoading.value ? 'Sending...' : 'Send' }}
        </button>
      </div>

      <!-- Storage Warning -->
      <div v-if="showStorageWarning" class="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/20">
        <svg class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p class="text-xs text-amber-400/90 flex-1">
          El historial y las colecciones se almacenan en <span class="font-mono text-amber-300">localStorage</span>. Recomendamos eliminar las keys <span class="font-mono text-amber-300">api-tester-history</span> y <span class="font-mono text-amber-300">api-tester-collections</span> desde la sección <span class="font-medium text-amber-300">Browser Storage</span> cuando ya no las necesites, para evitar exponer tokens u otros datos sensibles.
        </p>
        <button @click="dismissWarning" class="text-neutral-500 hover:text-neutral-300 shrink-0 mt-0.5" title="Dismiss">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Request/Response Split -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Request Panel -->
        <div class="h-[45%] border-b border-neutral-800 overflow-hidden">
          <RequestPanel
            :active-config-tab="api.activeConfigTab.value"
            :params="api.params.value"
            :headers="api.headers.value"
            :body-type="api.bodyType.value"
            :body-content="api.bodyContent.value"
            :auth-type="api.authType.value"
            :auth-config="api.authConfig.value"
            @update:active-config-tab="(v) => api.activeConfigTab.value = v"
            @update:body-type="(v) => api.bodyType.value = v"
            @update:body-content="(v) => api.bodyContent.value = v"
            @update:auth-type="(v) => api.authType.value = v"
            @update:auth-config="(v) => api.authConfig.value = v"
            @add-param="api.addParam"
            @remove-param="api.removeParam"
            @add-header="api.addHeader"
            @remove-header="api.removeHeader"
          />
        </div>

        <!-- Response Panel -->
        <div class="flex-1 min-h-0 overflow-hidden">
          <ResponsePanel
            :response="api.response.value"
            :response-time="api.responseTime.value"
            :response-size="api.responseSize.value"
            :response-error="api.responseError.value"
            :active-response-tab="api.activeResponseTab.value"
            :is-loading="api.isLoading.value"
            :format-size="api.formatSize"
            :get-status-color="api.getStatusColor"
            @update:active-response-tab="(v) => api.activeResponseTab.value = v"
            @copy-response="api.copyResponse"
          />
        </div>
      </div>
    </div>

    <!-- Save to Collection Modal -->
    <div v-if="saveModalOpen" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="saveModalOpen = false">
      <div class="bg-neutral-900 border border-neutral-700 rounded-lg p-4 w-80 shadow-xl">
        <h3 class="text-sm font-medium text-white mb-3">Save to Collection</h3>
        <input
          v-model="saveRequestName"
          placeholder="Request name"
          class="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50 mb-3"
          @keydown.enter="api.collections.value.length && handleSaveToCollection(api.collections.value[0].id)"
        />
        <div class="space-y-1 max-h-40 overflow-y-auto mb-3">
          <div v-if="api.collections.value.length === 0" class="text-xs text-neutral-500 text-center py-2">
            No collections. Create one first.
          </div>
          <button
            v-for="col in api.collections.value"
            :key="col.id"
            @click="handleSaveToCollection(col.id)"
            class="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
          >
            {{ col.name }}
          </button>
        </div>
        <div class="flex justify-end gap-2">
          <button
            @click="saveModalOpen = false"
            class="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
