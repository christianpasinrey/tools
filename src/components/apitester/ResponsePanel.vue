<script setup>
const props = defineProps({
  response: Object,
  responseTime: Number,
  responseSize: Number,
  responseError: Object,
  activeResponseTab: String,
  isLoading: Boolean,
  formatSize: Function,
  getStatusColor: Function
})

const emit = defineEmits(['update:activeResponseTab', 'copyResponse'])
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Response Header -->
    <div class="flex items-center gap-3 px-3 py-2 border-b border-neutral-800">
      <template v-if="response">
        <span
          class="px-2 py-0.5 text-xs font-bold rounded"
          :style="{ backgroundColor: getStatusColor(response.status) + '20', color: getStatusColor(response.status) }"
        >
          {{ response.status }} {{ response.statusText }}
        </span>
        <span class="text-xs text-neutral-500">{{ responseTime }}ms</span>
        <span class="text-xs text-neutral-500">{{ formatSize(responseSize) }}</span>
        <button
          @click="emit('copyResponse')"
          class="ml-auto text-xs text-neutral-500 hover:text-amber-400 transition-colors"
          title="Copy response"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
      </template>
      <template v-else-if="responseError">
        <span class="px-2 py-0.5 text-xs font-bold rounded bg-red-500/20 text-red-400">
          Error
        </span>
        <span class="text-xs text-neutral-500">{{ responseTime }}ms</span>
      </template>
      <template v-else>
        <span class="text-xs text-neutral-500">Response</span>
      </template>
    </div>

    <!-- Response Tabs -->
    <div v-if="response" class="flex border-b border-neutral-800">
      <button
        @click="emit('update:activeResponseTab', 'body')"
        class="px-4 py-2 text-xs font-medium transition-colors relative"
        :class="activeResponseTab === 'body' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
      >
        Body
        <div v-if="activeResponseTab === 'body'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"/>
      </button>
      <button
        @click="emit('update:activeResponseTab', 'headers')"
        class="px-4 py-2 text-xs font-medium transition-colors relative"
        :class="activeResponseTab === 'headers' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
      >
        Headers
        <span class="ml-1 text-amber-500">({{ Object.keys(response.headers).length }})</span>
        <div v-if="activeResponseTab === 'headers'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"/>
      </button>
    </div>

    <!-- Response Content -->
    <div class="flex-1 overflow-y-auto p-3">
      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3">
          <div class="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"/>
          <span class="text-xs text-neutral-500">Sending request...</span>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="responseError" class="space-y-3">
        <div class="bg-red-500/10 border border-red-500/20 rounded p-3">
          <div class="text-sm text-red-400 font-medium">Request Failed</div>
          <div class="text-xs text-red-400/70 mt-1">{{ responseError.message }}</div>
        </div>
        <div v-if="responseError.isCors" class="bg-amber-500/10 border border-amber-500/20 rounded p-3">
          <div class="text-xs text-amber-400 font-medium">Possible CORS Issue</div>
          <div class="text-xs text-amber-400/70 mt-1">
            The server may not allow requests from this origin. Try adding appropriate CORS headers on the server, or use a CORS proxy.
          </div>
        </div>
      </div>

      <!-- Response Body -->
      <div v-else-if="response && activeResponseTab === 'body'">
        <pre class="text-xs text-neutral-300 font-mono whitespace-pre-wrap break-all leading-relaxed">{{ response.body }}</pre>
      </div>

      <!-- Response Headers -->
      <div v-else-if="response && activeResponseTab === 'headers'">
        <div
          v-for="(value, key) in response.headers"
          :key="key"
          class="flex gap-2 py-1.5 border-b border-neutral-800/50 last:border-0"
        >
          <span class="text-xs text-amber-400 font-medium shrink-0">{{ key }}</span>
          <span class="text-xs text-neutral-400 break-all">{{ value }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="text-neutral-700 mb-2">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="text-xs text-neutral-600">Send a request to see the response</div>
        </div>
      </div>
    </div>
  </div>
</template>
