export const TOOLS = {
  // === Apps ===
  map: {
    id: 'map',
    name: 'Map Editor',
    section: 'apps',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    color: '#2563eb',
    hashAliases: ['maps', 'editor'],
    usesEncryptedStorage: true
  },
  todo: {
    id: 'todo',
    name: 'TODO Kanban',
    section: 'apps',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    color: '#6366f1',
    hashAliases: ['kanban', 'tasks'],
    usesEncryptedStorage: true
  },
  invoice: {
    id: 'invoice',
    name: 'Facturas',
    section: 'apps',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: '#10b981',
    hashAliases: ['invoice-generator', 'facturas'],
    usesEncryptedStorage: true
  },
  // === Technology ===
  dev: {
    id: 'dev',
    name: 'Dev Tools',
    section: 'technology',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: '#06b6d4',
    hashAliases: ['devtools', 'developer'],
    usesEncryptedStorage: true
  },
  security: {
    id: 'security',
    name: 'Cyber Security',
    section: 'technology',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    color: '#ef4444',
    hashAliases: ['cyber'],
    usesEncryptedStorage: false
  },
  phone: {
    id: 'phone',
    name: 'Phone Tester',
    section: 'technology',
    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    color: '#10b981',
    hashAliases: ['tester', 'mobile'],
    usesEncryptedStorage: true
  },
  api: {
    id: 'api',
    name: 'API Tester',
    section: 'technology',
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#f59e0b',
    hashAliases: ['postman', 'apitester'],
    usesEncryptedStorage: true
  },
  storage: {
    id: 'storage',
    name: 'Browser Storage',
    section: 'technology',
    icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    color: '#8b5cf6',
    hashAliases: ['browser-storage', 'localstorage', 'indexeddb'],
    hashName: 'browser-storage',
    usesEncryptedStorage: true
  }
}

export function getToolsBySection(section) {
  return Object.values(TOOLS).filter(t => t.section === section)
}

export function getDefaultTab(section) {
  const tools = getToolsBySection(section)
  return tools.length > 0 ? tools[0].id : null
}

export function buildHashMap(section) {
  const map = {}
  for (const tool of getToolsBySection(section)) {
    map[tool.id] = tool.id
    for (const alias of (tool.hashAliases || [])) {
      map[alias] = tool.id
    }
  }
  return map
}

export function buildTabToHash(section) {
  const map = {}
  for (const tool of getToolsBySection(section)) {
    map[tool.id] = tool.hashName || tool.id
  }
  return map
}

export function getToolColors(section) {
  const colors = {}
  for (const tool of getToolsBySection(section)) {
    colors[tool.id] = tool.color
  }
  return colors
}
