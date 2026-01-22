<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeConfigTab: String,
  params: Array,
  headers: Array,
  bodyType: String,
  bodyContent: String,
  authType: String,
  authConfig: Object
})

const emit = defineEmits([
  'update:activeConfigTab', 'update:bodyType', 'update:bodyContent',
  'update:authType', 'update:authConfig',
  'addParam', 'removeParam', 'addHeader', 'removeHeader'
])

const configTabs = [
  { id: 'params', name: 'Params' },
  { id: 'headers', name: 'Headers' },
  { id: 'body', name: 'Body' },
  { id: 'auth', name: 'Auth' }
]

const bodyPlaceholder = computed(() => {
  if (props.bodyType === 'json') return '{\n  "key": "value"\n}'
  if (props.bodyType === 'form') return 'key: value\nname: John'
  return 'Raw body content...'
})

function updateAuthField(type, field, value) {
  const updated = { ...props.authConfig }
  updated[type] = { ...updated[type], [field]: value }
  emit('update:authConfig', updated)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Config Tabs -->
    <div class="flex border-b border-neutral-800">
      <button
        v-for="tab in configTabs"
        :key="tab.id"
        @click="emit('update:activeConfigTab', tab.id)"
        class="px-4 py-2 text-xs font-medium transition-colors relative"
        :class="activeConfigTab === tab.id ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'"
      >
        {{ tab.name }}
        <span v-if="tab.id === 'params' && params.filter(p => p.key).length" class="ml-1 text-amber-500">({{ params.filter(p => p.key).length }})</span>
        <span v-if="tab.id === 'headers' && headers.filter(h => h.key).length" class="ml-1 text-amber-500">({{ headers.filter(h => h.key).length }})</span>
        <div v-if="activeConfigTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"/>
      </button>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto p-3">
      <!-- Params -->
      <div v-if="activeConfigTab === 'params'">
        <div v-for="(param, idx) in params" :key="idx" class="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            :checked="param.enabled"
            @change="param.enabled = $event.target.checked"
            class="accent-amber-500"
          />
          <input
            v-model="param.key"
            placeholder="Key"
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
          />
          <input
            v-model="param.value"
            placeholder="Value"
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
          />
          <button @click="emit('removeParam', idx)" class="text-neutral-500 hover:text-red-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <button @click="emit('addParam')" class="text-xs text-amber-500 hover:text-amber-400">+ Add Param</button>
      </div>

      <!-- Headers -->
      <div v-if="activeConfigTab === 'headers'">
        <div v-for="(header, idx) in headers" :key="idx" class="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            :checked="header.enabled"
            @change="header.enabled = $event.target.checked"
            class="accent-amber-500"
          />
          <input
            v-model="header.key"
            placeholder="Header"
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
          />
          <input
            v-model="header.value"
            placeholder="Value"
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2.5 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
          />
          <button @click="emit('removeHeader', idx)" class="text-neutral-500 hover:text-red-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <button @click="emit('addHeader')" class="text-xs text-amber-500 hover:text-amber-400">+ Add Header</button>
      </div>

      <!-- Body -->
      <div v-if="activeConfigTab === 'body'">
        <div class="flex gap-2 mb-3">
          <button
            v-for="type in ['none', 'json', 'form', 'raw']"
            :key="type"
            @click="emit('update:bodyType', type)"
            class="px-3 py-1 text-xs rounded transition-colors capitalize"
            :class="bodyType === type ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600'"
          >
            {{ type }}
          </button>
        </div>
        <div v-if="bodyType !== 'none'">
          <textarea
            :value="bodyContent"
            @input="emit('update:bodyContent', $event.target.value)"
            :placeholder="bodyPlaceholder"
            class="w-full h-48 bg-neutral-800 border border-neutral-700 rounded p-3 text-sm text-white font-mono placeholder-neutral-600 outline-none focus:border-amber-500/50 resize-none"
          />
        </div>
        <div v-else class="text-neutral-600 text-sm text-center py-8">
          No body for this request
        </div>
      </div>

      <!-- Auth -->
      <div v-if="activeConfigTab === 'auth'">
        <div class="flex gap-2 mb-4">
          <button
            v-for="type in ['none', 'bearer', 'basic', 'apikey']"
            :key="type"
            @click="emit('update:authType', type)"
            class="px-3 py-1 text-xs rounded transition-colors capitalize"
            :class="authType === type ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:border-neutral-600'"
          >
            {{ type === 'apikey' ? 'API Key' : type }}
          </button>
        </div>

        <!-- Bearer -->
        <div v-if="authType === 'bearer'" class="space-y-2">
          <label class="text-xs text-neutral-400">Token</label>
          <input
            :value="authConfig.bearer.token"
            @input="updateAuthField('bearer', 'token', $event.target.value)"
            placeholder="Enter token..."
            class="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
          />
        </div>

        <!-- Basic -->
        <div v-if="authType === 'basic'" class="space-y-3">
          <div>
            <label class="text-xs text-neutral-400">Username</label>
            <input
              :value="authConfig.basic.username"
              @input="updateAuthField('basic', 'username', $event.target.value)"
              placeholder="Username"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50 mt-1"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-400">Password</label>
            <input
              :value="authConfig.basic.password"
              @input="updateAuthField('basic', 'password', $event.target.value)"
              type="password"
              placeholder="Password"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50 mt-1"
            />
          </div>
        </div>

        <!-- API Key -->
        <div v-if="authType === 'apikey'" class="space-y-3">
          <div>
            <label class="text-xs text-neutral-400">Key</label>
            <input
              :value="authConfig.apikey.key"
              @input="updateAuthField('apikey', 'key', $event.target.value)"
              placeholder="X-API-Key"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50 mt-1"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-400">Value</label>
            <input
              :value="authConfig.apikey.value"
              @input="updateAuthField('apikey', 'value', $event.target.value)"
              placeholder="your-api-key"
              class="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500/50 mt-1"
            />
          </div>
          <div>
            <label class="text-xs text-neutral-400">Add to</label>
            <div class="flex gap-2 mt-1">
              <button
                @click="updateAuthField('apikey', 'addTo', 'header')"
                class="px-3 py-1 text-xs rounded"
                :class="authConfig.apikey.addTo === 'header' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'"
              >
                Header
              </button>
              <button
                @click="updateAuthField('apikey', 'addTo', 'query')"
                class="px-3 py-1 text-xs rounded"
                :class="authConfig.apikey.addTo === 'query' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'"
              >
                Query Param
              </button>
            </div>
          </div>
        </div>

        <div v-if="authType === 'none'" class="text-neutral-600 text-sm text-center py-8">
          No authentication
        </div>
      </div>
    </div>
  </div>
</template>
