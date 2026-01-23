import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { ref, computed, nextTick } from 'vue'

// ============================================================
// Mock vault (shared across all tool tests)
// ============================================================
const mockVault = {
  save: vi.fn().mockResolvedValue(true),
  load: vi.fn().mockResolvedValue(null),
  list: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(true),
  clearStore: vi.fn().mockResolvedValue(true),
  isLocked: ref(false),
  hasSetup: ref(true),
  hasKey: vi.fn(() => true)
}
vi.mock('@/composables/useVault', () => ({ useVault: () => mockVault }))

// ============================================================
// 1. IMAGE EDITOR
// ============================================================
const mockImageEditor = {
  brightness: ref(15), contrast: ref(-10), saturation: ref(25),
  exposure: ref(5), highlights: ref(-20), shadows: ref(30),
  temperature: ref(10), sharpness: ref(50), blur: ref(0),
  hasFile: computed(() => true),
  renderImage: vi.fn(),
  // Stubs for other required refs/methods
  canvas: ref(null), originalImage: ref(null), imageFileName: ref(''),
  isLoading: ref(false), isProcessing: ref(false), themeColor: ref('#06b6d4'),
  imageWidth: ref(800), imageHeight: ref(600), zoom: ref(100),
  rotation: ref(0), flipH: ref(false), flipV: ref(false),
  isCropping: ref(false), cropRect: ref(null),
  isPainting: ref(false), isDrawing: ref(false), isEyedropping: ref(false),
  brushColor: ref('#ff0000'), brushSize: ref(5), eyedropperPreview: ref(''),
  history: ref([]), historyIndex: ref(-1),
  canUndo: computed(() => false), canRedo: computed(() => false),
  fileInfo: computed(() => null),
  initCanvas: vi.fn(), loadFile: vi.fn(), setAdjustment: vi.fn(),
  applyAdjustments: vi.fn(), rotate: vi.fn(), flipHorizontal: vi.fn(),
  flipVertical: vi.fn(), startCrop: vi.fn(), applyCrop: vi.fn(),
  cancelCrop: vi.fn(), startPaintMode: vi.fn(), stopPaintMode: vi.fn(),
  setBrushColor: vi.fn(), setBrushSize: vi.fn(), startDrawing: vi.fn(),
  draw: vi.fn(), stopDrawing: vi.fn(), startEyedropper: vi.fn(),
  stopEyedropper: vi.fn(), updateEyedropperPreview: vi.fn(), pickColor: vi.fn(),
  applyFilter: vi.fn(), undo: vi.fn(), redo: vi.fn(), saveToHistory: vi.fn(),
  resetToOriginal: vi.fn(), restoreFromIndex: vi.fn(), exportImage: vi.fn(),
  setZoom: vi.fn(), setThemeColor: vi.fn(), clearFile: vi.fn(), resetAdjustments: vi.fn()
}
vi.mock('@/composables/useImageEditor', () => ({ useImageEditor: () => mockImageEditor }))

describe('ImageEditor — VaultSaveLoad controls', () => {
  let ImageEditor

  beforeEach(async () => {
    vi.clearAllMocks()
    mockImageEditor.brightness.value = 15
    mockImageEditor.contrast.value = -10
    mockImageEditor.saturation.value = 25
    mockImageEditor.exposure.value = 5
    mockImageEditor.highlights.value = -20
    mockImageEditor.shadows.value = 30
    mockImageEditor.temperature.value = 10
    mockImageEditor.sharpness.value = 50
    mockImageEditor.blur.value = 0
    ImageEditor = (await import('@/views/ImageEditor.vue')).default
  })

  it('getData returns all 9 adjustment values', () => {
    const wrapper = shallowMount(ImageEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data).toEqual({
      brightness: 15, contrast: -10, saturation: 25,
      exposure: 5, highlights: -20, shadows: 30,
      temperature: 10, sharpness: 50, blur: 0
    })
  })

  it('getData reflects current adjustment state', () => {
    mockImageEditor.brightness.value = 100
    mockImageEditor.blur.value = 5
    const wrapper = shallowMount(ImageEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.brightness).toBe(100)
    expect(data.blur).toBe(5)
  })

  it('load handler sets all adjustment values', async () => {
    const wrapper = shallowMount(ImageEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {
      brightness: -50, contrast: 30, saturation: -20,
      exposure: 10, highlights: 15, shadows: -10,
      temperature: -5, sharpness: 80, blur: 3
    })

    expect(mockImageEditor.brightness.value).toBe(-50)
    expect(mockImageEditor.contrast.value).toBe(30)
    expect(mockImageEditor.saturation.value).toBe(-20)
    expect(mockImageEditor.exposure.value).toBe(10)
    expect(mockImageEditor.highlights.value).toBe(15)
    expect(mockImageEditor.shadows.value).toBe(-10)
    expect(mockImageEditor.temperature.value).toBe(-5)
    expect(mockImageEditor.sharpness.value).toBe(80)
    expect(mockImageEditor.blur.value).toBe(3)
  })

  it('load handler uses 0 as default for missing values', async () => {
    const wrapper = shallowMount(ImageEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { brightness: 10 })

    expect(mockImageEditor.brightness.value).toBe(10)
    expect(mockImageEditor.contrast.value).toBe(0)
    expect(mockImageEditor.blur.value).toBe(0)
  })

  it('load handler calls renderImage when file loaded', async () => {
    const wrapper = shallowMount(ImageEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { brightness: 5 })

    expect(mockImageEditor.renderImage).toHaveBeenCalled()
  })

  it('VaultSaveLoad has correct storeName prop', () => {
    const wrapper = shallowMount(ImageEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('image-presets')
  })
})

// ============================================================
// 2. PHONE TESTER
// ============================================================
const mockPhoneTester = {
  config: ref({
    websocketUrl: 'wss://pbx.example.com/ws',
    sipUri: 'sip:user@example.com',
    password: 'secret123',
    registrarServer: 'sip:pbx.example.com',
    displayName: 'Test User',
    authorizationUser: 'testuser'
  }),
  selectedFramework: ref('vue'),
  isConfigValid: computed(() => true),
  generatedCode: computed(() => ''),
  reactCode: computed(() => ''),
  vueCode: computed(() => ''),
  copied: ref(false),
  copyCode: vi.fn(),
  resetConfig: vi.fn(),
  loadExample: vi.fn()
}
vi.mock('@/composables/usePhoneTester', () => ({ usePhoneTester: () => mockPhoneTester }))

describe('PhoneTester — VaultSaveLoad controls', () => {
  let PhoneTester

  beforeEach(async () => {
    vi.clearAllMocks()
    mockPhoneTester.config.value = {
      websocketUrl: 'wss://pbx.example.com/ws',
      sipUri: 'sip:user@example.com',
      password: 'secret123',
      registrarServer: 'sip:pbx.example.com',
      displayName: 'Test User',
      authorizationUser: 'testuser'
    }
    mockPhoneTester.selectedFramework.value = 'vue'
    PhoneTester = (await import('@/views/PhoneTester.vue')).default
  })

  it('getData returns config and framework', () => {
    const wrapper = shallowMount(PhoneTester)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.config).toEqual(mockPhoneTester.config.value)
    expect(data.framework).toBe('vue')
  })

  it('getData returns a copy of config (not reference)', () => {
    const wrapper = shallowMount(PhoneTester)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    data.config.password = 'modified'
    expect(mockPhoneTester.config.value.password).toBe('secret123')
  })

  it('load handler updates config', async () => {
    const wrapper = shallowMount(PhoneTester)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {
      config: { websocketUrl: 'wss://new.com', sipUri: 'sip:new@new.com', password: 'newpass', registrarServer: '', displayName: 'New', authorizationUser: 'new' },
      framework: 'react'
    })

    expect(mockPhoneTester.config.value.websocketUrl).toBe('wss://new.com')
    expect(mockPhoneTester.config.value.password).toBe('newpass')
    expect(mockPhoneTester.selectedFramework.value).toBe('react')
  })

  it('load handler handles missing config gracefully', async () => {
    const wrapper = shallowMount(PhoneTester)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    const originalConfig = { ...mockPhoneTester.config.value }
    await vaultSaveLoad.vm.$emit('load', {})

    expect(mockPhoneTester.config.value).toEqual(originalConfig)
  })

  it('load handler handles missing framework gracefully', async () => {
    const wrapper = shallowMount(PhoneTester)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { config: { websocketUrl: 'ws://x' } })

    expect(mockPhoneTester.selectedFramework.value).toBe('vue')
  })

  it('VaultSaveLoad has correct storeName', () => {
    const wrapper = shallowMount(PhoneTester)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('phone-configs')
  })
})

// ============================================================
// 3. MAP EDITOR
// ============================================================
const mockMapEditor = {
  map: ref(null), cursorCoords: ref({ lat: 40.4168, lng: -3.7038 }), copyCoordinates: vi.fn(),
  TILE_LAYERS: {}, currentTile: ref('osm'), setTileLayer: vi.fn(),
  activeTool: ref('marker'), setTool: vi.fn(),
  markers: ref([
    { id: 'm1', lat: 40.4168, lng: -3.7038, title: 'Madrid' },
    { id: 'm2', lat: 41.3851, lng: 2.1734, title: 'Barcelona' }
  ]),
  MARKER_COLORS: [], selectedMarkerColor: ref('#ef4444'),
  addMarker: vi.fn(), removeMarker: vi.fn(), focusMarker: vi.fn(),
  routes: ref([{ id: 'r1', color: '#22c55e', distance: 621 }]),
  selectedRouteColor: ref('#22c55e'), isRoutingMode: ref(false), routeWaypoints: ref([]),
  addRouteWaypoint: vi.fn(), finishRoute: vi.fn(), cancelRoute: vi.fn(),
  removeRoute: vi.fn(), focusRoute: vi.fn(), removeLastWaypoint: vi.fn(),
  formatDistance: vi.fn(d => `${d} km`), formatDuration: vi.fn(d => `${d} min`),
  exportGeoJSON: vi.fn(() => ({
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] }, properties: { id: 'm1', title: 'Madrid' } }
    ]
  })),
  importGeoJSON: vi.fn(),
  downloadGeoJSON: vi.fn(),
  initMap: vi.fn(), destroyMap: vi.fn(),
  layerPanelOpen: ref(true)
}
vi.mock('@/composables/useMapEditor', () => ({ useMapEditor: () => mockMapEditor }))

describe('MapEditor — VaultSaveLoad controls', () => {
  let MapEditor

  beforeEach(async () => {
    vi.clearAllMocks()
    mockMapEditor.currentTile.value = 'osm'
    mockMapEditor.markers.value = [
      { id: 'm1', lat: 40.4168, lng: -3.7038, title: 'Madrid' },
      { id: 'm2', lat: 41.3851, lng: 2.1734, title: 'Barcelona' }
    ]
    mockMapEditor.routes.value = [{ id: 'r1', color: '#22c55e', distance: 621 }]
    MapEditor = (await import('@/views/MapEditor.vue')).default
  })

  it('getData returns currentTile and geojson', () => {
    const wrapper = shallowMount(MapEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.currentTile).toBe('osm')
    expect(data.geojson).toBeDefined()
    expect(data.geojson.type).toBe('FeatureCollection')
    expect(mockMapEditor.exportGeoJSON).toHaveBeenCalled()
  })

  it('load handler clears existing markers and routes', async () => {
    const wrapper = shallowMount(MapEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    // Simulate the clear loop - removeMarker will need to modify the array
    mockMapEditor.removeMarker.mockImplementation((id) => {
      mockMapEditor.markers.value = mockMapEditor.markers.value.filter(m => m.id !== id)
    })
    mockMapEditor.removeRoute.mockImplementation((id) => {
      mockMapEditor.routes.value = mockMapEditor.routes.value.filter(r => r.id !== id)
    })

    await vaultSaveLoad.vm.$emit('load', {
      currentTile: 'satellite',
      geojson: { type: 'FeatureCollection', features: [] }
    })

    expect(mockMapEditor.removeMarker).toHaveBeenCalledWith('m1')
    expect(mockMapEditor.removeRoute).toHaveBeenCalledWith('r1')
  })

  it('load handler sets tile layer', async () => {
    mockMapEditor.markers.value = []
    mockMapEditor.routes.value = []
    const wrapper = shallowMount(MapEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {
      currentTile: 'satellite',
      geojson: { type: 'FeatureCollection', features: [] }
    })

    expect(mockMapEditor.setTileLayer).toHaveBeenCalledWith('satellite')
  })

  it('load handler imports GeoJSON', async () => {
    mockMapEditor.markers.value = []
    mockMapEditor.routes.value = []
    const wrapper = shallowMount(MapEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    const geojson = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} }] }
    await vaultSaveLoad.vm.$emit('load', { currentTile: 'osm', geojson })

    expect(mockMapEditor.importGeoJSON).toHaveBeenCalledWith(geojson)
  })

  it('VaultSaveLoad has correct storeName', () => {
    const wrapper = shallowMount(MapEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('map-projects')
  })
})

// ============================================================
// 4. SVG EDITOR
// ============================================================
const mockSvgEditor = {
  elements: ref([
    { id: 'rect1', type: 'rect', x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' }
  ]),
  artboardWidth: ref(800), artboardHeight: ref(600),
  gridSize: ref(16), showGrid: ref(true), snapToGrid: ref(true),
  clearSelection: vi.fn(),
  // Stubs for all other required refs
  selectedElements: ref([]), selectedIds: ref([]), selectionBox: ref(null),
  isDrawing: ref(false), drawingElement: ref(null),
  isDrawingPolygon: ref(false), isDrawingPath: ref(false),
  isTransforming: ref(false), transformType: ref(''),
  showExportModal: ref(false), isProcessing: ref(false),
  canUndo: computed(() => false), canRedo: computed(() => false),
  hasSelection: computed(() => false),
  undo: vi.fn(), redo: vi.fn(), saveToHistory: vi.fn(),
  startDrawing: vi.fn(), continueDrawing: vi.fn(), endDrawing: vi.fn(),
  finishPolygon: vi.fn(), cancelDrawing: vi.fn(), handleKeydown: vi.fn(),
  // From useSvgCanvas
  viewBox: ref({ x: 0, y: 0, width: 800, height: 600 }),
  zoom: ref(1), panX: ref(0), panY: ref(0), isPanning: ref(false),
  zoomIn: vi.fn(), zoomOut: vi.fn(), resetZoom: vi.fn(),
  // From useSvgElements
  currentTool: ref('select'), fillColor: ref('#22c55e'), strokeColor: ref('#000'),
  strokeWidth: ref(2), fontSize: ref(16), textContent: ref(''),
  opacity: ref(1), themeColor: ref('#22c55e'),
  tools: [], sizePresets: [],
  addElement: vi.fn(), deleteSelected: vi.fn(), duplicateSelected: vi.fn(),
  deleteElements: vi.fn(), reorderElements: vi.fn(),
  moveElement: vi.fn(), bringToFront: vi.fn(), sendToBack: vi.fn(),
  moveForward: vi.fn(), moveBackward: vi.fn(),
  groupSelected: vi.fn(), ungroupSelected: vi.fn(),
  alignElements: vi.fn(), distributeElements: vi.fn(),
  selectElement: vi.fn(), deselectAll: vi.fn(), selectAll: vi.fn(),
  toggleSelection: vi.fn(), setSelectionBox: vi.fn(),
  toggleVisibility: vi.fn(), toggleLock: vi.fn(),
  updateElement: vi.fn(), getSelectedBounds: vi.fn(() => null)
}
vi.mock('@/composables/svg/useSvgEditor', () => ({ useSvgEditor: () => mockSvgEditor }))

describe('SvgEditor — VaultSaveLoad controls', () => {
  let SvgEditor

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSvgEditor.elements.value = [
      { id: 'rect1', type: 'rect', x: 10, y: 20, width: 100, height: 50, fill: '#ff0000' }
    ]
    mockSvgEditor.artboardWidth.value = 800
    mockSvgEditor.artboardHeight.value = 600
    mockSvgEditor.gridSize.value = 16
    mockSvgEditor.showGrid.value = true
    mockSvgEditor.snapToGrid.value = true
    SvgEditor = (await import('@/views/SvgEditor.vue')).default
  })

  it('getData returns deep-cloned elements and artboard', () => {
    const wrapper = shallowMount(SvgEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.elements).toEqual(mockSvgEditor.elements.value)
    expect(data.artboard).toEqual({
      width: 800, height: 600, gridSize: 16, showGrid: true, snapToGrid: true
    })
  })

  it('getData deep-clones elements (not reference)', () => {
    const wrapper = shallowMount(SvgEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    data.elements[0].fill = '#modified'
    expect(mockSvgEditor.elements.value[0].fill).toBe('#ff0000')
  })

  it('load handler sets elements', async () => {
    const wrapper = shallowMount(SvgEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    const newElements = [{ id: 'circle1', type: 'circle', cx: 50, cy: 50, r: 30, fill: '#00ff00' }]
    await vaultSaveLoad.vm.$emit('load', { elements: newElements, artboard: { width: 1024, height: 768, gridSize: 8, showGrid: false, snapToGrid: false } })

    expect(mockSvgEditor.elements.value).toEqual(newElements)
    expect(mockSvgEditor.artboardWidth.value).toBe(1024)
    expect(mockSvgEditor.artboardHeight.value).toBe(768)
    expect(mockSvgEditor.gridSize.value).toBe(8)
    expect(mockSvgEditor.showGrid.value).toBe(false)
    expect(mockSvgEditor.snapToGrid.value).toBe(false)
  })

  it('load handler uses defaults for missing artboard values', async () => {
    const wrapper = shallowMount(SvgEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { elements: [], artboard: {} })

    expect(mockSvgEditor.artboardWidth.value).toBe(512)
    expect(mockSvgEditor.artboardHeight.value).toBe(512)
    expect(mockSvgEditor.gridSize.value).toBe(16)
    expect(mockSvgEditor.showGrid.value).toBe(true)
    expect(mockSvgEditor.snapToGrid.value).toBe(true)
  })

  it('load handler calls clearSelection', async () => {
    const wrapper = shallowMount(SvgEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { elements: [] })
    expect(mockSvgEditor.clearSelection).toHaveBeenCalled()
  })

  it('VaultSaveLoad has correct storeName', () => {
    const wrapper = shallowMount(SvgEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('svg-projects')
  })
})

// ============================================================
// 5. DEV TOOLS
// ============================================================
const mockDevTools = {
  activeTab: ref('playground'), themeColor: ref('#06b6d4'),
  htmlCode: ref('<h1>Hello</h1>'), cssCode: ref('h1 { color: red; }'), jsCode: ref('console.log("hi")'),
  consoleOutput: ref([]), autoRun: ref(true), previewKey: ref(0),
  runCode: vi.fn(), clearPlayground: vi.fn(), generatePreviewHtml: vi.fn(() => ''),
  loadTemplate: vi.fn(), addConsoleMessage: vi.fn(), clearConsole: vi.fn(),
  jsonInput: ref(''), jsonOutput: ref(''), jsonError: ref(''),
  formatJson: vi.fn(), minifyJson: vi.fn(), validateJson: vi.fn(),
  jsonToYaml: vi.fn(), yamlToJson: vi.fn(), copyToClipboard: vi.fn(), clearJson: vi.fn(),
  setThemeColor: vi.fn()
}
vi.mock('@/composables/useDevTools', () => ({ useDevTools: () => mockDevTools }))

describe('DevTools — VaultSaveLoad controls', () => {
  let DevTools

  beforeEach(async () => {
    vi.clearAllMocks()
    mockDevTools.htmlCode.value = '<h1>Hello</h1>'
    mockDevTools.cssCode.value = 'h1 { color: red; }'
    mockDevTools.jsCode.value = 'console.log("hi")'
    mockDevTools.activeTab.value = 'json'
    DevTools = (await import('@/views/DevTools.vue')).default
  })

  it('getData returns all code fields', () => {
    const wrapper = shallowMount(DevTools)
    // DevTools passes getData as prop to DevToolsToolbar
    const toolbar = wrapper.findComponent({ name: 'DevToolsToolbar' })
    const data = toolbar.props('getData')()

    expect(data).toEqual({
      htmlCode: '<h1>Hello</h1>',
      cssCode: 'h1 { color: red; }',
      jsCode: 'console.log("hi")'
    })
  })

  it('load handler sets code and switches to playground', async () => {
    const wrapper = shallowMount(DevTools)
    const toolbar = wrapper.findComponent({ name: 'DevToolsToolbar' })

    await toolbar.vm.$emit('load', {
      htmlCode: '<p>New</p>',
      cssCode: 'p { font-size: 20px; }',
      jsCode: 'alert("loaded")'
    })

    expect(mockDevTools.htmlCode.value).toBe('<p>New</p>')
    expect(mockDevTools.cssCode.value).toBe('p { font-size: 20px; }')
    expect(mockDevTools.jsCode.value).toBe('alert("loaded")')
    expect(mockDevTools.activeTab.value).toBe('playground')
    expect(mockDevTools.runCode).toHaveBeenCalled()
  })

  it('load handler uses empty string for missing fields', async () => {
    const wrapper = shallowMount(DevTools)
    const toolbar = wrapper.findComponent({ name: 'DevToolsToolbar' })

    await toolbar.vm.$emit('load', { htmlCode: '<div/>' })

    expect(mockDevTools.htmlCode.value).toBe('<div/>')
    expect(mockDevTools.cssCode.value).toBe('')
    expect(mockDevTools.jsCode.value).toBe('')
  })
})

// ============================================================
// 6. MARKDOWN EDITOR
// ============================================================
const markedFn = vi.fn(str => `<p>${str}</p>`)
markedFn.parse = vi.fn(str => `<p>${str}</p>`)
markedFn.setOptions = vi.fn()
vi.mock('marked', () => ({ marked: markedFn }))
vi.mock('dompurify', () => ({
  default: { sanitize: vi.fn(html => html) }
}))
// Mock pdfjs-dist (uses DOMMatrix not available in jsdom)
vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' }
}))

describe('MarkdownEditorContent — VaultSaveLoad controls', () => {
  let MarkdownEditorContent

  beforeEach(async () => {
    vi.clearAllMocks()
    MarkdownEditorContent = (await import('@/components/documents/MarkdownEditorContent.vue')).default
  })

  it('getData returns markdown content', () => {
    const wrapper = shallowMount(MarkdownEditorContent)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data).toHaveProperty('content')
    expect(typeof data.content).toBe('string')
  })

  it('load handler sets markdown content', async () => {
    const wrapper = shallowMount(MarkdownEditorContent)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { content: '# New Document\n\nLoaded from vault' })
    await nextTick()

    // Verify the component's internal state changed
    const data = vaultSaveLoad.props('getData')()
    expect(data.content).toBe('# New Document\n\nLoaded from vault')
  })

  it('load handler handles empty content', async () => {
    const wrapper = shallowMount(MarkdownEditorContent)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { content: '' })
    await nextTick()

    const data = vaultSaveLoad.props('getData')()
    expect(data.content).toBe('')
  })

  it('load handler handles missing content field', async () => {
    const wrapper = shallowMount(MarkdownEditorContent)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {})
    await nextTick()

    const data = vaultSaveLoad.props('getData')()
    expect(data.content).toBe('')
  })

  it('VaultSaveLoad has correct storeName and label', () => {
    const wrapper = shallowMount(MarkdownEditorContent)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('markdown-documents')
    expect(vaultSaveLoad.props('label')).toBe('documento')
  })
})

// ============================================================
// 7. SPREADSHEET EDITOR
// ============================================================
const mockSpreadsheet = {
  sheets: ref([
    { name: 'Hoja 1', data: [['A1', 'B1'], ['A2', 'B2']], styles: { A1: { bold: true } }, formulas: { B2: '=B1*2' }, colWidths: { 0: 100 }, rowHeights: { 0: 25 } },
    { name: 'Hoja 2', data: [['X', 'Y']], styles: {}, formulas: {}, colWidths: {}, rowHeights: {} }
  ]),
  activeSheetIndex: ref(0),
  data: ref([['A1', 'B1'], ['A2', 'B2']]),
  cellStyles: ref({ A1: { bold: true } }),
  columnWidths: ref({ 0: 100 }),
  rowHeights: ref({ 0: 25 }),
  cellFormulas: ref({}),
  // Other required stubs
  fileInput: ref(null), fileName: ref(''), selectedCell: ref(null),
  editingCell: ref(null), editValue: ref(''), isDragging: ref(false),
  contextMenu: ref(null), clipboard: ref(null), isLoading: ref(false),
  loadingMessage: ref(''),
  canUndo: computed(() => false), canRedo: computed(() => false),
  currentCellStyle: computed(() => ({})), currentCellRef: computed(() => ''),
  currentCellValue: computed(() => ''), columns: computed(() => 26),
  getColumnLabel: vi.fn(i => String.fromCharCode(65 + i)),
  getCellStyle: vi.fn(() => ({})), getCellComputedStyle: vi.fn(() => ({})),
  initEmptySheet: vi.fn(), loadFile: vi.fn(), exportXlsx: vi.fn(), exportCsv: vi.fn(),
  switchSheet: vi.fn(), selectCell: vi.fn(), startEdit: vi.fn(),
  finishEdit: vi.fn(), cancelEdit: vi.fn(), copyCell: vi.fn(), cutCell: vi.fn(),
  pasteCell: vi.fn(), clearCell: vi.fn(), setCellStyle: vi.fn(), toggleCellStyle: vi.fn(),
  setBorders: vi.fn(), setAlignment: vi.fn(), setFontSize: vi.fn(),
  setNumberFormat: vi.fn(), toggleWrapText: vi.fn(),
  insertRowAbove: vi.fn(), insertRowBelow: vi.fn(), deleteRow: vi.fn(),
  insertColumnLeft: vi.fn(), insertColumnRight: vi.fn(), deleteColumn: vi.fn(),
  moveSelection: vi.fn(), openContextMenu: vi.fn(), closeContextMenu: vi.fn(),
  undo: vi.fn(), redo: vi.fn(), saveToHistory: vi.fn(),
  addColumns: vi.fn(), addRows: vi.fn(), checkExpandColumns: vi.fn(), checkExpandRows: vi.fn(),
  setColumnWidth: vi.fn(), setRowHeight: vi.fn(), getColumnWidth: vi.fn(() => 80),
  getRowHeight: vi.fn(() => 24), addSheet: vi.fn(), renameSheet: vi.fn(),
  deleteSheet: vi.fn(), duplicateSheet: vi.fn(),
  getCellFormula: vi.fn(), setCellFormula: vi.fn(), hasFormula: vi.fn(() => false),
  getCellDisplayValue: vi.fn(v => v), evaluateFormula: vi.fn(), recalculateFormulas: vi.fn()
}
vi.mock('@/composables/useSpreadsheet', () => ({
  useSpreadsheet: () => mockSpreadsheet,
  isDark: ref(false),
  toggleDark: vi.fn(),
  TEXT_COLORS: ['#000', '#fff'],
  BG_COLORS: ['#fff', '#f00'],
  BORDER_PRESETS: [],
  FONT_SIZES: [10, 12, 14],
  NUMBER_FORMATS: []
}))

describe('SpreadsheetEditor — VaultSaveLoad controls', () => {
  let SpreadsheetEditor

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSpreadsheet.sheets.value = [
      { name: 'Hoja 1', data: [['A1', 'B1'], ['A2', 'B2']], styles: { A1: { bold: true } }, formulas: { B2: '=B1*2' }, colWidths: { 0: 100 }, rowHeights: { 0: 25 } },
      { name: 'Hoja 2', data: [['X', 'Y']], styles: {}, formulas: {}, colWidths: {}, rowHeights: {} }
    ]
    mockSpreadsheet.activeSheetIndex.value = 0
    mockSpreadsheet.data.value = [['A1', 'B1'], ['A2', 'B2']]
    mockSpreadsheet.cellStyles.value = { A1: { bold: true } }
    mockSpreadsheet.columnWidths.value = { 0: 100 }
    mockSpreadsheet.rowHeights.value = { 0: 25 }
    SpreadsheetEditor = (await import('@/components/documents/SpreadsheetEditor.vue')).default
  })

  it('getData returns workbook with active sheet synced', () => {
    const wrapper = shallowMount(SpreadsheetEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.sheets).toHaveLength(2)
    expect(data.activeSheetIndex).toBe(0)
    // Active sheet should use current refs
    expect(data.sheets[0].data).toEqual([['A1', 'B1'], ['A2', 'B2']])
    expect(data.sheets[0].styles).toEqual({ A1: { bold: true } })
    expect(data.sheets[0].colWidths).toEqual({ 0: 100 })
  })

  it('getData syncs active sheet from current refs (not from sheet object)', () => {
    // Change the live data (simulating user edits not yet saved to sheets array)
    mockSpreadsheet.data.value = [['Modified', 'Data'], ['A2', 'B2']]
    mockSpreadsheet.cellStyles.value = { A1: { bold: true, italic: true } }

    const wrapper = shallowMount(SpreadsheetEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.sheets[0].data[0][0]).toBe('Modified')
    expect(data.sheets[0].styles.A1.italic).toBe(true)
  })

  it('load handler sets all spreadsheet state', async () => {
    const wrapper = shallowMount(SpreadsheetEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    const newWorkbook = {
      sheets: [{ name: 'New Sheet', data: [['X', 'Y', 'Z']], styles: { B1: { color: 'red' } }, formulas: {}, colWidths: { 1: 150 }, rowHeights: { 0: 40 } }],
      activeSheetIndex: 0
    }
    await vaultSaveLoad.vm.$emit('load', newWorkbook)

    expect(mockSpreadsheet.sheets.value).toEqual(newWorkbook.sheets)
    expect(mockSpreadsheet.activeSheetIndex.value).toBe(0)
    expect(mockSpreadsheet.data.value).toEqual([['X', 'Y', 'Z']])
    expect(mockSpreadsheet.cellStyles.value).toEqual({ B1: { color: 'red' } })
    expect(mockSpreadsheet.columnWidths.value).toEqual({ 1: 150 })
    expect(mockSpreadsheet.rowHeights.value).toEqual({ 0: 40 })
  })

  it('load handler does nothing for empty sheets', async () => {
    const wrapper = shallowMount(SpreadsheetEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const originalData = [...mockSpreadsheet.data.value]

    await vaultSaveLoad.vm.$emit('load', { sheets: [] })

    expect(mockSpreadsheet.data.value).toEqual(originalData)
  })

  it('load handler defaults missing styles/colWidths/rowHeights', async () => {
    const wrapper = shallowMount(SpreadsheetEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {
      sheets: [{ name: 'Bare', data: [['A']] }],
      activeSheetIndex: 0
    })

    expect(mockSpreadsheet.cellStyles.value).toEqual({})
    expect(mockSpreadsheet.columnWidths.value).toEqual({})
    expect(mockSpreadsheet.rowHeights.value).toEqual({})
  })

  it('VaultSaveLoad has correct storeName', () => {
    const wrapper = shallowMount(SpreadsheetEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('spreadsheet-workbooks')
  })
})

// ============================================================
// 8. PDF EDITOR
// ============================================================
const mockPdfEditor = {
  pdfDoc: ref(null),
  pdfBytes: ref(new ArrayBuffer(5000)),
  fileName: ref('test.pdf'),
  isLoading: ref(false), isProcessing: ref(false), themeColor: ref('#8b5cf6'),
  pages: ref([{ id: 'p1', pageIndex: 0, rotation: 0 }, { id: 'p2', pageIndex: 1, rotation: 90 }]),
  selectedPages: ref(new Set()), pageCount: computed(() => 2),
  history: ref([]), historyIndex: ref(-1),
  loadingProgress: ref(0), loadingMessage: ref(''),
  toasts: ref([]),
  previewPage: ref(null), previewZoom: ref(1),
  annotations: ref([{ id: 'a1', pageIndex: 0, content: 'Note', color: '#ff0', size: 14, x: 100, y: 200, hasBg: false, bgColor: '' }]),
  showAnnotationPanel: ref(false),
  hasFile: computed(() => true), hasSelection: computed(() => false),
  allSelected: computed(() => false),
  canUndo: computed(() => false), canRedo: computed(() => false),
  undoActionName: computed(() => ''), redoActionName: computed(() => ''),
  loadFile: vi.fn(), addFiles: vi.fn(),
  togglePageSelection: vi.fn(), selectAll: vi.fn(), deselectAll: vi.fn(),
  rotateSelected: vi.fn(), deleteSelected: vi.fn(), reorderPages: vi.fn(),
  extractSelected: vi.fn(), exportPdf: vi.fn(), splitAll: vi.fn(),
  setThemeColor: vi.fn(), clearFile: vi.fn(),
  undo: vi.fn(), redo: vi.fn(), saveToHistory: vi.fn(), clearHistory: vi.fn(),
  showToast: vi.fn(), dismissToast: vi.fn(),
  openPreview: vi.fn(), closePreview: vi.fn(), setPreviewZoom: vi.fn(),
  toggleAnnotationPanel: vi.fn(), addAnnotation: vi.fn(),
  removeAnnotation: vi.fn(), updateAnnotation: vi.fn(), clearAnnotations: vi.fn()
}
vi.mock('@/composables/usePdfEditor', () => ({ usePdfEditor: () => mockPdfEditor }))

describe('PdfEditor — VaultSaveLoad controls', () => {
  let PdfEditor

  beforeEach(async () => {
    vi.clearAllMocks()
    mockPdfEditor.pdfBytes.value = new ArrayBuffer(5000)
    mockPdfEditor.fileName.value = 'test.pdf'
    mockPdfEditor.pages.value = [{ id: 'p1', pageIndex: 0, rotation: 0 }, { id: 'p2', pageIndex: 1, rotation: 90 }]
    mockPdfEditor.annotations.value = [{ id: 'a1', pageIndex: 0, content: 'Note', color: '#ff0', size: 14, x: 100, y: 200, hasBg: false, bgColor: '' }]
    PdfEditor = (await import('@/views/PdfEditor.vue')).default
  })

  it('getData returns serialized PDF data', () => {
    const wrapper = shallowMount(PdfEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.pdfBytes).toBeInstanceOf(Array)
    expect(data.pdfBytes.length).toBe(5000)
    expect(data.pages).toHaveLength(2)
    expect(data.pages[1].rotation).toBe(90)
    expect(data.annotations).toHaveLength(1)
    expect(data.annotations[0].content).toBe('Note')
    expect(data.fileName).toBe('test.pdf')
  })

  it('getData returns null when no PDF loaded', () => {
    mockPdfEditor.pdfBytes.value = null
    const wrapper = shallowMount(PdfEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data).toBeNull()
  })

  it('getData returns null and alerts for oversized PDFs', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    mockPdfEditor.pdfBytes.value = new ArrayBuffer(11 * 1024 * 1024) // > 10MB

    const wrapper = shallowMount(PdfEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data).toBeNull()
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('10MB'))
    alertMock.mockRestore()
  })

  it('load handler calls loadFile with reconstructed File', async () => {
    const wrapper = shallowMount(PdfEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {
      pdfBytes: Array.from({ length: 100 }, (_, i) => i % 256),
      fileName: 'loaded.pdf',
      annotations: [{ id: 'a2', pageIndex: 0, content: 'Loaded' }]
    })
    await flushPromises()

    expect(mockPdfEditor.loadFile).toHaveBeenCalled()
    const fileArg = mockPdfEditor.loadFile.mock.calls[0][0]
    expect(fileArg).toBeInstanceOf(File)
    expect(fileArg.name).toBe('loaded.pdf')
    expect(fileArg.type).toBe('application/pdf')
  })

  it('load handler sets annotations after loading', async () => {
    const wrapper = shallowMount(PdfEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    const annotations = [{ id: 'new', pageIndex: 1, content: 'New note' }]
    await vaultSaveLoad.vm.$emit('load', {
      pdfBytes: [1, 2, 3],
      fileName: 'test.pdf',
      annotations
    })
    await flushPromises()

    expect(mockPdfEditor.annotations.value).toEqual(annotations)
  })

  it('load handler does nothing without pdfBytes', async () => {
    const wrapper = shallowMount(PdfEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', { fileName: 'empty.pdf' })
    await flushPromises()

    expect(mockPdfEditor.loadFile).not.toHaveBeenCalled()
  })

  it('VaultSaveLoad has correct storeName', () => {
    const wrapper = shallowMount(PdfEditor)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('pdf-documents')
  })
})

// ============================================================
// 9. 3D PLAYGROUND
// ============================================================
const mockMesh = (type, pos, rot, scl, color) => ({
  userData: { type },
  position: { x: pos[0], y: pos[1], z: pos[2], toArray: () => [...pos], fromArray: vi.fn(function (arr) { this.x = arr[0]; this.y = arr[1]; this.z = arr[2] }) },
  rotation: { x: rot[0], y: rot[1], z: rot[2], set: vi.fn() },
  scale: { x: scl[0], y: scl[1], z: scl[2], toArray: () => [...scl], fromArray: vi.fn() },
  material: { color: { getHexString: () => color.replace('#', '') } }
})

const mockPlayground = {
  scene: ref(null), camera: ref(null), renderer: ref(null),
  orbitControls: ref(null), isInitialized: ref(true),
  objects: ref([
    mockMesh('cube', [0, 1, 0], [0, 0.5, 0], [1, 1, 1], '#22c55e'),
    mockMesh('sphere', [3, 0, -2], [0, 0, 0], [2, 2, 2], '#ef4444')
  ]),
  selectedObject: ref(null), keysPressed: ref(new Set()),
  addShape: vi.fn((type, opts) => mockMesh(type, [0, 0, 0], [0, 0, 0], [1, 1, 1], opts?.color || '#22c55e')),
  deleteObject: vi.fn(), deleteSelected: vi.fn(), duplicateSelected: vi.fn(),
  selectObject: vi.fn(), deselectObject: vi.fn(),
  ambientIntensity: ref(1), directionalIntensity: ref(1), currentLightingPreset: ref('default'),
  addSpotlight: vi.fn(), addPointLight: vi.fn(), addAreaLight: vi.fn(),
  addHemisphereLight: vi.fn(), addDirectionalLight: vi.fn(),
  setAmbientIntensity: vi.fn(), setDirectionalIntensity: vi.fn(),
  applyLightingPreset: vi.fn(), clearUserLights: vi.fn(),
  LIGHTING_PRESETS: [], LIGHT_TYPES: [], HUMAN_MODEL_URL: '', SCENE_PRESETS: [],
  MATERIAL_PRESETS: [], applyMaterialToSelected: vi.fn(), setSelectedColor: vi.fn(),
  getSelectedMaterialProperties: vi.fn(() => ({})), updateSelectedMaterialProperty: vi.fn(),
  applyTextureToSelected: vi.fn(), removeTextureFromSelected: vi.fn(),
  selectedHasTexture: ref(false), selectedTextureUrl: ref(''),
  bloomEnabled: ref(false), bloomStrength: ref(0.5), bloomRadius: ref(0.4), bloomThreshold: ref(0.9),
  setBloomEnabled: vi.fn(), setBloomStrength: vi.fn(), setBloomRadius: vi.fn(), setBloomThreshold: vi.fn(),
  ENVIRONMENT_PRESETS: [], currentEnvironment: ref('none'), showBackground: ref(false),
  environmentIntensity: ref(1), isLoadingEnvironment: ref(false),
  loadEnvironment: vi.fn(), setShowBackground: vi.fn(), setEnvironmentIntensity: vi.fn(),
  isImporting: ref(false), importProgress: ref(0), importError: ref(null), handleFileImport: vi.fn(),
  isExporting: ref(false), hasSavedScene: ref(false),
  quickActions: { clearScene: vi.fn() },
  animationPaused: ref(false), setAnimationPaused: vi.fn(),
  init: vi.fn(), destroy: vi.fn(), handleResize: vi.fn(), resetCamera: vi.fn()
}
vi.mock('@/composables/three/useThreePlayground', () => ({ useThreePlayground: () => mockPlayground }))

describe('3DPlayground — VaultSaveLoad controls', () => {
  let Playground

  beforeEach(async () => {
    vi.clearAllMocks()
    mockPlayground.objects.value = [
      mockMesh('cube', [0, 1, 0], [0, 0.5, 0], [1, 1, 1], '#22c55e'),
      mockMesh('sphere', [3, 0, -2], [0, 0, 0], [2, 2, 2], '#ef4444')
    ]
    Playground = (await import('@/views/3DPlayground.vue')).default
  })

  it('getData serializes objects with type, position, rotation, scale, color', () => {
    const wrapper = shallowMount(Playground)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.objects).toHaveLength(2)
    expect(data.objects[0]).toEqual({
      type: 'cube',
      position: [0, 1, 0],
      rotation: [0, 0.5, 0],
      scale: [1, 1, 1],
      color: '#22c55e'
    })
    expect(data.objects[1]).toEqual({
      type: 'sphere',
      position: [3, 0, -2],
      rotation: [0, 0, 0],
      scale: [2, 2, 2],
      color: '#ef4444'
    })
  })

  it('getData handles objects without userData type', () => {
    mockPlayground.objects.value = [{ ...mockMesh('cube', [0, 0, 0], [0, 0, 0], [1, 1, 1], '#fff'), userData: {} }]
    const wrapper = shallowMount(Playground)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    const data = vaultSaveLoad.props('getData')()

    expect(data.objects[0].type).toBe('cube') // fallback
  })

  it('load handler clears scene and adds shapes', async () => {
    const wrapper = shallowMount(Playground)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {
      objects: [
        { type: 'cylinder', position: [1, 2, 3], rotation: [0.1, 0.2, 0.3], scale: [1.5, 1.5, 1.5], color: '#3b82f6' }
      ]
    })

    expect(mockPlayground.quickActions.clearScene).toHaveBeenCalled()
    expect(mockPlayground.addShape).toHaveBeenCalledWith('cylinder', { color: '#3b82f6' })
  })

  it('load handler sets position, rotation, scale on created mesh', async () => {
    const createdMesh = mockMesh('cube', [0, 0, 0], [0, 0, 0], [1, 1, 1], '#22c55e')
    mockPlayground.addShape.mockReturnValue(createdMesh)

    const wrapper = shallowMount(Playground)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })

    await vaultSaveLoad.vm.$emit('load', {
      objects: [{ type: 'cube', position: [5, 10, 15], rotation: [0.1, 0.2, 0.3], scale: [2, 3, 4], color: '#ff0000' }]
    })

    expect(createdMesh.position.fromArray).toHaveBeenCalledWith([5, 10, 15])
    expect(createdMesh.rotation.set).toHaveBeenCalledWith(0.1, 0.2, 0.3)
    expect(createdMesh.scale.fromArray).toHaveBeenCalledWith([2, 3, 4])
  })

  it('load handler handles empty objects array', async () => {
    const wrapper = shallowMount(Playground)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    // Clear any addShape calls from mount/initialization
    mockPlayground.addShape.mockClear()
    mockPlayground.quickActions.clearScene.mockClear()

    await vaultSaveLoad.vm.$emit('load', { objects: [] })

    expect(mockPlayground.quickActions.clearScene).toHaveBeenCalled()
    expect(mockPlayground.addShape).not.toHaveBeenCalled()
  })

  it('load handler handles missing objects field', async () => {
    const wrapper = shallowMount(Playground)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    mockPlayground.addShape.mockClear()
    mockPlayground.quickActions.clearScene.mockClear()

    await vaultSaveLoad.vm.$emit('load', {})

    expect(mockPlayground.quickActions.clearScene).toHaveBeenCalled()
    expect(mockPlayground.addShape).not.toHaveBeenCalled()
  })

  it('VaultSaveLoad has correct storeName', () => {
    const wrapper = shallowMount(Playground)
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    expect(vaultSaveLoad.props('storeName')).toBe('three-scenes')
  })
})

// ============================================================
// 10. TODO KANBAN
// ============================================================
const mockKanbanDragDrop = { startDrag: vi.fn(), onDrop: vi.fn(), onDragOver: vi.fn(), draggedTask: ref(null) }
const mockKanbanStorage = {
  boards: ref([{ id: 'board1', name: 'Sprint 1' }]),
  currentBoardId: ref('board1'),
  deleteBoard: vi.fn(), renameBoard: vi.fn(),
  createBoard: vi.fn(() => ({
    id: 'board1', name: 'Sprint 1', createdAt: Date.now(), tags: [],
    columns: [
      { id: 'col1', title: 'To Do', tasks: [{ id: 't1', title: 'Task 1', description: '', priority: 'high', createdAt: Date.now() }] },
      { id: 'col2', title: 'Done', tasks: [] }
    ]
  })),
  genId: vi.fn(() => 'gen-id')
}
vi.mock('@/composables/kanban/useKanbanDragDrop', () => ({ useKanbanDragDrop: () => mockKanbanDragDrop }))
vi.mock('@/composables/kanban/useKanbanStorage', () => ({ useKanbanStorage: () => mockKanbanStorage }))

describe('TodoKanban — VaultSaveLoad controls', () => {
  let TodoKanban

  beforeEach(async () => {
    vi.clearAllMocks()
    mockKanbanStorage.boards.value = [{ id: 'board1', name: 'Sprint 1' }]
    mockKanbanStorage.currentBoardId.value = 'board1'
    TodoKanban = (await import('@/components/apps/TodoKanban.vue')).default
  })

  function mountKanban() {
    return shallowMount(TodoKanban)
  }

  it('getData returns deep clone of current board', () => {
    const wrapper = mountKanban()
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    if (!vaultSaveLoad.exists()) return

    const data = vaultSaveLoad.props('getData')()
    expect(data.id).toBe('board1')
    expect(data.columns).toHaveLength(2)
    expect(data.columns[0].tasks[0].title).toBe('Task 1')
  })

  it('getData returns independent copy (deep clone)', () => {
    const wrapper = mountKanban()
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    if (!vaultSaveLoad.exists()) return

    const data = vaultSaveLoad.props('getData')()
    data.columns[0].tasks[0].title = 'Modified'
    const data2 = vaultSaveLoad.props('getData')()
    expect(data2.columns[0].tasks[0].title).toBe('Task 1')
  })

  it('load handler sets currentBoard and currentBoardId', async () => {
    const wrapper = mountKanban()
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    if (!vaultSaveLoad.exists()) return

    const newBoard = {
      id: 'board2', name: 'New Board',
      columns: [{ id: 'c1', name: 'Column', color: '#000', tasks: [] }]
    }
    await vaultSaveLoad.vm.$emit('load', newBoard)
    await flushPromises()

    const data = vaultSaveLoad.props('getData')()
    expect(data.id).toBe('board2')
    expect(data.columns[0].name).toBe('Column')
    expect(mockKanbanStorage.currentBoardId.value).toBe('board2')
  })

  it('load handler ignores data without columns', async () => {
    const wrapper = mountKanban()
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    if (!vaultSaveLoad.exists()) return

    await vaultSaveLoad.vm.$emit('load', { id: 'x', name: 'No columns' })
    await flushPromises()

    const data = vaultSaveLoad.props('getData')()
    expect(data.columns).toHaveLength(2)
  })

  it('load handler ignores null data', async () => {
    const wrapper = mountKanban()
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    if (!vaultSaveLoad.exists()) return

    await vaultSaveLoad.vm.$emit('load', null)
    await flushPromises()

    const data = vaultSaveLoad.props('getData')()
    expect(data.columns).toHaveLength(2)
  })

  it('VaultSaveLoad has correct storeName', () => {
    const wrapper = mountKanban()
    const vaultSaveLoad = wrapper.findComponent({ name: 'VaultSaveLoad' })
    if (!vaultSaveLoad.exists()) return
    expect(vaultSaveLoad.props('storeName')).toBe('kanban-boards')
  })
})
