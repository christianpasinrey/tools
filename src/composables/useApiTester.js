import { ref, computed, watch } from 'vue'
import { useVault } from './useVault'

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const METHOD_COLORS = {
  GET: '#10b981',
  POST: '#f59e0b',
  PUT: '#3b82f6',
  PATCH: '#f97316',
  DELETE: '#ef4444',
  HEAD: '#8b5cf6',
  OPTIONS: '#6b7280'
}

const STATUS_COLORS = {
  1: '#6b7280', // 1xx Informational
  2: '#10b981', // 2xx Success
  3: '#3b82f6', // 3xx Redirection
  4: '#f59e0b', // 4xx Client Error
  5: '#ef4444'  // 5xx Server Error
}


export function useApiTester() {
  // ==========================================
  // Request State
  // ==========================================
  const method = ref('GET')
  const url = ref('')
  const activeConfigTab = ref('params') // params, headers, body, auth

  // Params
  const params = ref([{ key: '', value: '', enabled: true }])

  // Headers
  const headers = ref([
    { key: 'Content-Type', value: 'application/json', enabled: true },
    { key: '', value: '', enabled: true }
  ])

  // Body
  const bodyType = ref('json') // json, form, raw, none
  const bodyContent = ref('')

  // Auth
  const authType = ref('none') // none, bearer, basic, apikey
  const authConfig = ref({
    bearer: { token: '' },
    basic: { username: '', password: '' },
    apikey: { key: '', value: '', addTo: 'header' } // header or query
  })

  // ==========================================
  // Response State
  // ==========================================
  const response = ref(null)
  const isLoading = ref(false)
  const responseTime = ref(0)
  const responseSize = ref(0)
  const activeResponseTab = ref('body') // body, headers
  const responseError = ref(null)

  // ==========================================
  // Collections & History (in-memory, persisted via vault)
  // ==========================================
  const vault = useVault()
  const VAULT_STORE = 'api-collections'

  const collections = ref([])
  const history = ref([])
  const sidebarTab = ref('collections') // collections, history
  const showSidebar = ref(true)

  async function loadFromVault() {
    if (vault.isLocked.value) return
    try {
      const vCollections = await vault.load(VAULT_STORE, 'collections')
      if (vCollections) collections.value = vCollections
      const vHistory = await vault.load(VAULT_STORE, 'history')
      if (vHistory) history.value = vHistory
    } catch { /* keep current values */ }
  }

  watch(() => vault.isLocked.value, (locked) => {
    if (!locked) loadFromVault()
  }, { immediate: true })

  // ==========================================
  // Request Methods
  // ==========================================

  function buildUrl() {
    let finalUrl = url.value.trim()
    if (!finalUrl) return ''

    // Add protocol if missing
    if (!finalUrl.match(/^https?:\/\//)) {
      finalUrl = 'https://' + finalUrl
    }

    // Add query params
    const enabledParams = params.value.filter(p => p.enabled && p.key.trim())
    if (enabledParams.length > 0) {
      const urlObj = new URL(finalUrl)
      enabledParams.forEach(p => {
        urlObj.searchParams.set(p.key.trim(), p.value)
      })
      finalUrl = urlObj.toString()
    }

    return finalUrl
  }

  function buildHeaders() {
    const h = {}

    // Add enabled custom headers
    headers.value.forEach(header => {
      if (header.enabled && header.key.trim()) {
        h[header.key.trim()] = header.value
      }
    })

    // Add auth headers
    if (authType.value === 'bearer' && authConfig.value.bearer.token) {
      h['Authorization'] = `Bearer ${authConfig.value.bearer.token}`
    } else if (authType.value === 'basic') {
      const { username, password } = authConfig.value.basic
      if (username) {
        h['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`
      }
    } else if (authType.value === 'apikey' && authConfig.value.apikey.addTo === 'header') {
      const { key, value } = authConfig.value.apikey
      if (key) h[key] = value
    }

    return h
  }

  function buildBody() {
    if (['GET', 'HEAD', 'OPTIONS'].includes(method.value)) return undefined
    if (bodyType.value === 'none') return undefined

    if (bodyType.value === 'json' || bodyType.value === 'raw') {
      return bodyContent.value || undefined
    }

    if (bodyType.value === 'form') {
      // Parse form data from key-value pairs in bodyContent
      try {
        const formData = new FormData()
        const lines = bodyContent.value.split('\n')
        lines.forEach(line => {
          const [key, ...rest] = line.split(':')
          if (key && key.trim()) {
            formData.append(key.trim(), rest.join(':').trim())
          }
        })
        return formData
      } catch {
        return bodyContent.value
      }
    }

    return undefined
  }

  async function sendRequest() {
    const finalUrl = buildUrl()
    if (!finalUrl) return

    isLoading.value = true
    response.value = null
    responseError.value = null
    responseTime.value = 0
    responseSize.value = 0

    const startTime = performance.now()

    try {
      const fetchOptions = {
        method: method.value,
        headers: buildHeaders()
      }

      const body = buildBody()
      if (body) {
        fetchOptions.body = body
        // Remove Content-Type for FormData (browser sets it with boundary)
        if (bodyType.value === 'form') {
          delete fetchOptions.headers['Content-Type']
        }
      }

      const res = await fetch(finalUrl, fetchOptions)
      const endTime = performance.now()
      responseTime.value = Math.round(endTime - startTime)

      // Read response
      const responseHeaders = {}
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let responseBody = ''
      const contentType = res.headers.get('content-type') || ''

      try {
        responseBody = await res.text()
        responseSize.value = new Blob([responseBody]).size
      } catch {
        responseBody = '[Unable to read response body]'
      }

      // Try to parse as JSON for pretty display
      let parsedBody = responseBody
      let isJson = false
      if (contentType.includes('json') || responseBody.trim().startsWith('{') || responseBody.trim().startsWith('[')) {
        try {
          parsedBody = JSON.stringify(JSON.parse(responseBody), null, 2)
          isJson = true
        } catch {
          // Keep as raw text
        }
      }

      response.value = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: parsedBody,
        rawBody: responseBody,
        isJson,
        contentType
      }

      // Add to history
      addToHistory(finalUrl, res.status, res.statusText)

    } catch (err) {
      const endTime = performance.now()
      responseTime.value = Math.round(endTime - startTime)

      responseError.value = {
        message: err.message,
        isCors: err.message.includes('Failed to fetch') || err.name === 'TypeError'
      }
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // History Methods
  // ==========================================

  function addToHistory(requestUrl, status, statusText) {
    const entry = {
      id: Date.now(),
      method: method.value,
      url: requestUrl,
      status,
      statusText,
      timestamp: new Date().toISOString(),
      request: getCurrentRequest(),
      response: response.value ? {
        status: response.value.status,
        statusText: response.value.statusText,
        headers: response.value.headers,
        body: response.value.body,
        isJson: response.value.isJson,
        contentType: response.value.contentType
      } : null,
      time: responseTime.value,
      size: responseSize.value
    }

    history.value.unshift(entry)
    // Keep only last 50
    if (history.value.length > 50) {
      history.value = history.value.slice(0, 50)
    }
    saveToVault('history', history.value)
  }

  function loadHistoryEntry(entry) {
    if (!entry.request) return
    const req = entry.request
    method.value = req.method || 'GET'
    url.value = req.url || ''
    params.value = req.params?.length ? req.params : [{ key: '', value: '', enabled: true }]
    headers.value = req.headers?.length ? req.headers : [{ key: '', value: '', enabled: true }]
    bodyType.value = req.bodyType || 'none'
    bodyContent.value = req.bodyContent || ''
    authType.value = req.authType || 'none'
    authConfig.value = req.authConfig || authConfig.value

    // Restore response
    if (entry.response) {
      response.value = entry.response
      responseTime.value = entry.time || 0
      responseSize.value = entry.size || 0
      responseError.value = null
    } else {
      response.value = null
      responseTime.value = 0
      responseSize.value = 0
    }
  }

  function clearHistory() {
    history.value = []
    saveToVault('history', [])
  }

  // ==========================================
  // Collections Methods
  // ==========================================

  function createCollection(name) {
    collections.value.push({
      id: Date.now(),
      name: name || 'New Collection',
      requests: [],
      expanded: true
    })
    saveCollections()
  }

  function renameCollection(id, name) {
    const col = collections.value.find(c => c.id === id)
    if (col) {
      col.name = name
      saveCollections()
    }
  }

  function deleteCollection(id) {
    collections.value = collections.value.filter(c => c.id !== id)
    saveCollections()
  }

  function toggleCollection(id) {
    const col = collections.value.find(c => c.id === id)
    if (col) col.expanded = !col.expanded
  }

  function saveToCollection(collectionId, name) {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return

    col.requests.push({
      id: Date.now(),
      name: name || `${method.value} ${url.value.split('?')[0].split('/').pop() || url.value}`,
      ...getCurrentRequest()
    })
    saveCollections()
  }

  function loadCollectionRequest(request) {
    method.value = request.method || 'GET'
    url.value = request.url || ''
    params.value = request.params?.length ? [...request.params] : [{ key: '', value: '', enabled: true }]
    headers.value = request.headers?.length ? [...request.headers] : [{ key: '', value: '', enabled: true }]
    bodyType.value = request.bodyType || 'none'
    bodyContent.value = request.bodyContent || ''
    authType.value = request.authType || 'none'
    authConfig.value = request.authConfig ? { ...request.authConfig } : authConfig.value
  }

  function deleteCollectionRequest(collectionId, requestId) {
    const col = collections.value.find(c => c.id === collectionId)
    if (col) {
      col.requests = col.requests.filter(r => r.id !== requestId)
      saveCollections()
    }
  }

  function saveCollections() {
    saveToVault('collections', collections.value)
  }

  // ==========================================
  // Export/Import Methods
  // ==========================================

  function exportPostman() {
    const postmanCollection = {
      info: {
        name: 'API Tester Export',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: collections.value.map(col => ({
        name: col.name,
        item: col.requests.map(req => ({
          name: req.name || `${req.method} ${req.url}`,
          request: {
            method: req.method,
            header: (req.headers || []).filter(h => h.enabled && h.key).map(h => ({
              key: h.key,
              value: h.value,
              type: 'text'
            })),
            url: {
              raw: req.url,
              protocol: req.url?.startsWith('https') ? 'https' : 'http',
              host: [req.url?.replace(/^https?:\/\//, '').split('/')[0] || ''],
              path: req.url?.replace(/^https?:\/\/[^/]+/, '').split('/').filter(Boolean) || []
            },
            body: req.bodyType !== 'none' ? {
              mode: req.bodyType === 'json' ? 'raw' : req.bodyType,
              raw: req.bodyContent || '',
              options: req.bodyType === 'json' ? { raw: { language: 'json' } } : undefined
            } : undefined,
            auth: req.authType !== 'none' ? convertAuthToPostman(req) : undefined
          }
        }))
      }))
    }

    downloadFile(JSON.stringify(postmanCollection, null, 2), 'api-tester-postman.json')
  }

  function exportHoppscotch() {
    const hoppscotchExport = collections.value.map(col => ({
      v: 2,
      name: col.name,
      folders: [],
      requests: col.requests.map(req => ({
        v: '3',
        name: req.name || `${req.method} ${req.url}`,
        method: req.method,
        endpoint: req.url || '',
        headers: (req.headers || []).filter(h => h.enabled && h.key).map(h => ({
          key: h.key,
          value: h.value,
          active: true
        })),
        params: (req.params || []).filter(p => p.enabled && p.key).map(p => ({
          key: p.key,
          value: p.value,
          active: true
        })),
        body: {
          contentType: req.bodyType === 'json' ? 'application/json' : 'text/plain',
          body: req.bodyContent || null
        },
        auth: { authType: req.authType || 'none', authActive: true }
      }))
    }))

    downloadFile(JSON.stringify(hoppscotchExport, null, 2), 'api-tester-hoppscotch.json')
  }

  function importCollection(fileContent) {
    try {
      const data = JSON.parse(fileContent)

      // Detect Postman format
      if (data.info && data.info.schema && data.item) {
        importPostmanCollection(data)
        return true
      }

      // Detect Hoppscotch format (array of collections)
      if (Array.isArray(data) && data[0]?.requests) {
        importHoppscotchCollection(data)
        return true
      }

      return false
    } catch {
      return false
    }
  }

  function importPostmanCollection(data) {
    const importItems = (items) => {
      return items.map(item => {
        if (item.item) {
          // It's a folder
          return {
            id: Date.now() + Math.random(),
            name: item.name,
            requests: importItems(item.item).flatMap(i => i.requests || [i]),
            expanded: true
          }
        }
        // It's a request
        return {
          id: Date.now() + Math.random(),
          name: item.name,
          method: item.request?.method || 'GET',
          url: item.request?.url?.raw || item.request?.url || '',
          headers: (item.request?.header || []).map(h => ({
            key: h.key, value: h.value, enabled: !h.disabled
          })),
          params: [],
          bodyType: item.request?.body?.mode === 'raw' ? 'json' : 'none',
          bodyContent: item.request?.body?.raw || '',
          authType: 'none',
          authConfig: authConfig.value
        }
      })
    }

    const imported = importItems(data.item)
    imported.forEach(col => {
      if (col.requests) {
        collections.value.push(col)
      } else {
        // Single request, add to default collection
        let defaultCol = collections.value.find(c => c.name === 'Imported')
        if (!defaultCol) {
          defaultCol = { id: Date.now(), name: 'Imported', requests: [], expanded: true }
          collections.value.push(defaultCol)
        }
        defaultCol.requests.push(col)
      }
    })
    saveCollections()
  }

  function importHoppscotchCollection(data) {
    data.forEach(col => {
      collections.value.push({
        id: Date.now() + Math.random(),
        name: col.name || 'Imported',
        expanded: true,
        requests: (col.requests || []).map(req => ({
          id: Date.now() + Math.random(),
          name: req.name || `${req.method} ${req.endpoint}`,
          method: req.method || 'GET',
          url: req.endpoint || '',
          headers: (req.headers || []).map(h => ({
            key: h.key, value: h.value, enabled: h.active !== false
          })),
          params: (req.params || []).map(p => ({
            key: p.key, value: p.value, enabled: p.active !== false
          })),
          bodyType: req.body?.body ? 'json' : 'none',
          bodyContent: req.body?.body || '',
          authType: 'none',
          authConfig: authConfig.value
        }))
      })
    })
    saveCollections()
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  function getCurrentRequest() {
    return {
      method: method.value,
      url: url.value,
      params: [...params.value],
      headers: [...headers.value],
      bodyType: bodyType.value,
      bodyContent: bodyContent.value,
      authType: authType.value,
      authConfig: { ...authConfig.value }
    }
  }

  function loadExample() {
    method.value = 'GET'
    url.value = 'https://jsonplaceholder.typicode.com/posts'
    params.value = [
      { key: '_limit', value: '5', enabled: true },
      { key: '', value: '', enabled: true }
    ]
    headers.value = [
      { key: 'Accept', value: 'application/json', enabled: true },
      { key: '', value: '', enabled: true }
    ]
    bodyType.value = 'none'
    bodyContent.value = ''
    authType.value = 'none'
  }

  function addParam() {
    params.value.push({ key: '', value: '', enabled: true })
  }

  function removeParam(index) {
    params.value.splice(index, 1)
    if (params.value.length === 0) addParam()
  }

  function addHeader() {
    headers.value.push({ key: '', value: '', enabled: true })
  }

  function removeHeader(index) {
    headers.value.splice(index, 1)
    if (headers.value.length === 0) addHeader()
  }

  function copyResponse() {
    if (response.value?.body) {
      navigator.clipboard.writeText(response.value.body)
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getStatusColor(status) {
    const category = Math.floor(status / 100)
    return STATUS_COLORS[category] || '#6b7280'
  }

  function getMethodColor(m) {
    return METHOD_COLORS[m] || '#6b7280'
  }

  function convertAuthToPostman(req) {
    if (req.authType === 'bearer') {
      return { type: 'bearer', bearer: [{ key: 'token', value: req.authConfig?.bearer?.token || '' }] }
    }
    if (req.authType === 'basic') {
      return {
        type: 'basic',
        basic: [
          { key: 'username', value: req.authConfig?.basic?.username || '' },
          { key: 'password', value: req.authConfig?.basic?.password || '' }
        ]
      }
    }
    return undefined
  }

  function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function saveToVault(vaultKey, value) {
    if (vault.isLocked.value) return
    vault.save(VAULT_STORE, vaultKey, vaultKey, value).catch(() => {})
  }

  // ==========================================
  // Return
  // ==========================================
  return {
    // Constants
    HTTP_METHODS,
    METHOD_COLORS,

    // Request
    method,
    url,
    activeConfigTab,
    params,
    headers,
    bodyType,
    bodyContent,
    authType,
    authConfig,
    sendRequest,
    isLoading,

    // Example
    loadExample,

    // Params/Headers management
    addParam,
    removeParam,
    addHeader,
    removeHeader,

    // Response
    response,
    responseTime,
    responseSize,
    responseError,
    activeResponseTab,
    copyResponse,

    // Collections
    collections,
    createCollection,
    renameCollection,
    deleteCollection,
    toggleCollection,
    saveToCollection,
    loadCollectionRequest,
    deleteCollectionRequest,

    // History
    history,
    loadHistoryEntry,
    clearHistory,

    // Sidebar
    sidebarTab,
    showSidebar,

    // Export/Import
    exportPostman,
    exportHoppscotch,
    importCollection,

    // Helpers
    formatSize,
    getStatusColor,
    getMethodColor
  }
}
