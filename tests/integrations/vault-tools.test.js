import { describe, it, expect, beforeEach } from 'vitest'
import { useVault } from '@/composables/useVault'
import { useAppCrypto } from '@/composables/useAppCrypto'

/**
 * Integration tests: verifies that each tool's data pattern survives
 * the full vault round-trip (getData → encrypt → IDB → decrypt → loadData)
 */
describe('Vault Tools Integration', () => {
  let vault

  beforeEach(async () => {
    const crypto = useAppCrypto()
    await crypto.resetCrypto()
    crypto.lock()

    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('app-vault')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase('app-crypto-db')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
    })

    await crypto.setup('integration-test-key')
    vault = useVault()
  })

  describe('Image Editor — Presets (image-presets)', () => {
    const samplePreset = {
      brightness: 15,
      contrast: -10,
      saturation: 25,
      exposure: 5,
      highlights: -20,
      shadows: 30,
      temperature: 10,
      sharpness: 50,
      blur: 0
    }

    it('saves and loads image presets', async () => {
      await vault.save('image-presets', 'vintage', 'Vintage', samplePreset)
      const loaded = await vault.load('image-presets', 'vintage')
      expect(loaded).toEqual(samplePreset)
    })

    it('preserves zero values correctly', async () => {
      const preset = { brightness: 0, contrast: 0, saturation: 0, exposure: 0, highlights: 0, shadows: 0, temperature: 0, sharpness: 0, blur: 0 }
      await vault.save('image-presets', 'default', 'Default', preset)
      const loaded = await vault.load('image-presets', 'default')
      expect(loaded.brightness).toBe(0)
      expect(loaded.blur).toBe(0)
    })

    it('preserves negative values', async () => {
      const preset = { ...samplePreset, brightness: -100, contrast: -50 }
      await vault.save('image-presets', 'dark', 'Dark', preset)
      const loaded = await vault.load('image-presets', 'dark')
      expect(loaded.brightness).toBe(-100)
      expect(loaded.contrast).toBe(-50)
    })
  })

  describe('SVG Editor — Projects (svg-projects)', () => {
    const sampleProject = {
      elements: [
        { id: 'rect1', type: 'rect', x: 10, y: 20, width: 100, height: 50, fill: '#ff0000', stroke: '#000', strokeWidth: 2, rotation: 0, opacity: 1 },
        { id: 'circle1', type: 'circle', cx: 150, cy: 100, r: 40, fill: '#00ff00', stroke: 'none', strokeWidth: 0, rotation: 0, opacity: 0.8 },
        { id: 'text1', type: 'text', x: 50, y: 200, content: 'Hello SVG', fontSize: 24, fontFamily: 'Arial', fill: '#333' }
      ],
      artboard: { width: 800, height: 600, gridSize: 10, showGrid: true, snapToGrid: true }
    }

    it('saves and loads SVG projects', async () => {
      await vault.save('svg-projects', 'logo', 'My Logo', sampleProject)
      const loaded = await vault.load('svg-projects', 'logo')
      expect(loaded).toEqual(sampleProject)
    })

    it('preserves element properties exactly', async () => {
      await vault.save('svg-projects', 'p1', 'Project', sampleProject)
      const loaded = await vault.load('svg-projects', 'p1')
      expect(loaded.elements[0].fill).toBe('#ff0000')
      expect(loaded.elements[1].opacity).toBe(0.8)
      expect(loaded.elements[2].content).toBe('Hello SVG')
    })

    it('handles empty elements array', async () => {
      const empty = { elements: [], artboard: { width: 400, height: 300, gridSize: 5, showGrid: false, snapToGrid: false } }
      await vault.save('svg-projects', 'empty', 'Empty', empty)
      const loaded = await vault.load('svg-projects', 'empty')
      expect(loaded.elements).toEqual([])
      expect(loaded.artboard.width).toBe(400)
    })

    it('handles many elements', async () => {
      const manyElements = Array.from({ length: 200 }, (_, i) => ({
        id: `el${i}`, type: 'rect', x: i * 10, y: i * 5, width: 50, height: 30, fill: `#${i.toString(16).padStart(6, '0')}`
      }))
      const project = { elements: manyElements, artboard: { width: 2000, height: 1000, gridSize: 10, showGrid: true, snapToGrid: false } }
      await vault.save('svg-projects', 'big', 'Big Project', project)
      const loaded = await vault.load('svg-projects', 'big')
      expect(loaded.elements).toHaveLength(200)
      expect(loaded.elements[199].x).toBe(1990)
    })
  })

  describe('3D Playground — Scenes (three-scenes)', () => {
    const sampleScene = {
      objects: [
        { type: 'cube', position: [0, 1, 0], rotation: [0, 0.5, 0], scale: [1, 1, 1], color: '#22c55e' },
        { type: 'sphere', position: [3, 0, -2], rotation: [0, 0, 0], scale: [2, 2, 2], color: '#ef4444' },
        { type: 'cylinder', position: [-1, 0.5, 1], rotation: [1.57, 0, 0], scale: [0.5, 2, 0.5], color: '#3b82f6' }
      ]
    }

    it('saves and loads 3D scenes', async () => {
      await vault.save('three-scenes', 'scene1', 'Demo Scene', sampleScene)
      const loaded = await vault.load('three-scenes', 'scene1')
      expect(loaded).toEqual(sampleScene)
    })

    it('preserves float precision in positions', async () => {
      const scene = {
        objects: [{ type: 'cube', position: [1.234567, -0.987654, 3.141592], rotation: [0, 0, 0], scale: [1, 1, 1], color: '#fff' }]
      }
      await vault.save('three-scenes', 'precise', 'Precise', scene)
      const loaded = await vault.load('three-scenes', 'precise')
      expect(loaded.objects[0].position[0]).toBeCloseTo(1.234567)
      expect(loaded.objects[0].position[1]).toBeCloseTo(-0.987654)
      expect(loaded.objects[0].position[2]).toBeCloseTo(3.141592)
    })

    it('handles empty scene', async () => {
      const empty = { objects: [] }
      await vault.save('three-scenes', 'empty', 'Empty', empty)
      const loaded = await vault.load('three-scenes', 'empty')
      expect(loaded.objects).toEqual([])
    })
  })

  describe('PDF Editor — Documents (pdf-documents)', () => {
    it('saves and loads PDF bytes as array', async () => {
      // Simulate a small PDF (actual PDF bytes pattern)
      const pdfBytes = Array.from({ length: 5000 }, (_, i) => i % 256)
      const data = {
        pdfBytes,
        pages: [
          { id: 'p1', pageIndex: 0, rotation: 0 },
          { id: 'p2', pageIndex: 1, rotation: 90 }
        ],
        annotations: [
          { id: 'a1', pageIndex: 0, content: 'Note here', color: '#ffff00', size: 14, x: 100, y: 200, hasBg: true, bgColor: '#fff' }
        ],
        fileName: 'contract.pdf'
      }

      await vault.save('pdf-documents', 'pdf1', 'Contract', data)
      const loaded = await vault.load('pdf-documents', 'pdf1')
      expect(loaded.pdfBytes).toEqual(pdfBytes)
      expect(loaded.pages).toHaveLength(2)
      expect(loaded.pages[1].rotation).toBe(90)
      expect(loaded.annotations[0].content).toBe('Note here')
      expect(loaded.fileName).toBe('contract.pdf')
    })

    it('preserves byte values 0-255 correctly', async () => {
      const allBytes = Array.from({ length: 256 }, (_, i) => i)
      const data = { pdfBytes: allBytes, pages: [], annotations: [], fileName: 'test.pdf' }
      await vault.save('pdf-documents', 'bytes', 'Bytes Test', data)
      const loaded = await vault.load('pdf-documents', 'bytes')
      expect(loaded.pdfBytes).toEqual(allBytes)
      expect(loaded.pdfBytes[0]).toBe(0)
      expect(loaded.pdfBytes[255]).toBe(255)
    })

    it('handles PDF near size limit (large byte array)', async () => {
      // 1MB of bytes (well within 10MB limit)
      const bigPdf = Array.from({ length: 1000000 }, (_, i) => i % 256)
      const data = { pdfBytes: bigPdf, pages: [], annotations: [], fileName: 'big.pdf' }
      await vault.save('pdf-documents', 'big', 'Big PDF', data)
      const loaded = await vault.load('pdf-documents', 'big')
      expect(loaded.pdfBytes).toHaveLength(1000000)
    })

    it('handles multiple annotations', async () => {
      const annotations = Array.from({ length: 50 }, (_, i) => ({
        id: `a${i}`, pageIndex: i % 5, content: `Note ${i}`,
        color: '#ff0000', size: 12 + i, x: i * 10, y: i * 20,
        hasBg: i % 2 === 0, bgColor: '#ffffff'
      }))
      const data = { pdfBytes: [1, 2, 3], pages: [], annotations, fileName: 'annotated.pdf' }
      await vault.save('pdf-documents', 'ann', 'Annotated', data)
      const loaded = await vault.load('pdf-documents', 'ann')
      expect(loaded.annotations).toHaveLength(50)
      expect(loaded.annotations[49].content).toBe('Note 49')
    })
  })

  describe('Spreadsheet Editor — Workbooks (spreadsheet-workbooks)', () => {
    const sampleWorkbook = {
      sheets: [
        {
          name: 'Presupuesto',
          data: [
            ['Concepto', 'Enero', 'Febrero', 'Total'],
            ['Ventas', 1000, 1200, 2200],
            ['Gastos', 500, 600, 1100],
            ['Beneficio', 500, 600, 1100]
          ],
          styles: { 'A1': { bold: true, color: '#000' }, 'B1': { bold: true } },
          formulas: { 'D2': '=B2+C2', 'D3': '=B3+C3', 'D4': '=B4+C4' },
          colWidths: { 0: 120, 1: 80, 2: 80, 3: 80 },
          rowHeights: { 0: 30 }
        },
        {
          name: 'Detalle',
          data: [['Item', 'Valor'], ['A', 10]],
          styles: {},
          formulas: {},
          colWidths: {},
          rowHeights: {}
        }
      ],
      activeSheetIndex: 0
    }

    it('saves and loads workbooks', async () => {
      await vault.save('spreadsheet-workbooks', 'wb1', 'Budget 2025', sampleWorkbook)
      const loaded = await vault.load('spreadsheet-workbooks', 'wb1')
      expect(loaded).toEqual(sampleWorkbook)
    })

    it('preserves cell types (string, number)', async () => {
      await vault.save('spreadsheet-workbooks', 'types', 'Types', sampleWorkbook)
      const loaded = await vault.load('spreadsheet-workbooks', 'types')
      expect(typeof loaded.sheets[0].data[0][0]).toBe('string')
      expect(typeof loaded.sheets[0].data[1][1]).toBe('number')
    })

    it('preserves formulas', async () => {
      await vault.save('spreadsheet-workbooks', 'formulas', 'Formulas', sampleWorkbook)
      const loaded = await vault.load('spreadsheet-workbooks', 'formulas')
      expect(loaded.sheets[0].formulas['D2']).toBe('=B2+C2')
    })

    it('preserves styles', async () => {
      await vault.save('spreadsheet-workbooks', 'styles', 'Styles', sampleWorkbook)
      const loaded = await vault.load('spreadsheet-workbooks', 'styles')
      expect(loaded.sheets[0].styles['A1'].bold).toBe(true)
    })

    it('handles multiple sheets', async () => {
      await vault.save('spreadsheet-workbooks', 'multi', 'Multi', sampleWorkbook)
      const loaded = await vault.load('spreadsheet-workbooks', 'multi')
      expect(loaded.sheets).toHaveLength(2)
      expect(loaded.sheets[1].name).toBe('Detalle')
    })

    it('handles empty cells', async () => {
      const wb = {
        sheets: [{ name: 'Sparse', data: [[null, '', 0, undefined]], styles: {}, formulas: {}, colWidths: {}, rowHeights: {} }],
        activeSheetIndex: 0
      }
      await vault.save('spreadsheet-workbooks', 'sparse', 'Sparse', wb)
      const loaded = await vault.load('spreadsheet-workbooks', 'sparse')
      expect(loaded.sheets[0].data[0][0]).toBeNull()
      expect(loaded.sheets[0].data[0][1]).toBe('')
      expect(loaded.sheets[0].data[0][2]).toBe(0)
    })
  })

  describe('Markdown Editor — Documents (markdown-documents)', () => {
    it('saves and loads markdown content', async () => {
      const doc = { content: '# Title\n\nParagraph with **bold** and *italic*.\n\n- Item 1\n- Item 2\n\n```js\nconsole.log("hello")\n```' }
      await vault.save('markdown-documents', 'doc1', 'Meeting Notes', doc)
      const loaded = await vault.load('markdown-documents', 'doc1')
      expect(loaded.content).toBe(doc.content)
    })

    it('preserves multiline content', async () => {
      const content = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n')
      await vault.save('markdown-documents', 'long', 'Long Doc', { content })
      const loaded = await vault.load('markdown-documents', 'long')
      expect(loaded.content.split('\n')).toHaveLength(100)
    })

    it('preserves special markdown characters', async () => {
      const content = '> Quote\n\n| Col1 | Col2 |\n|------|------|\n| A    | B    |\n\n---\n\n[link](http://example.com)'
      await vault.save('markdown-documents', 'special', 'Special', { content })
      const loaded = await vault.load('markdown-documents', 'special')
      expect(loaded.content).toBe(content)
    })

    it('handles empty document', async () => {
      await vault.save('markdown-documents', 'empty', 'Empty', { content: '' })
      const loaded = await vault.load('markdown-documents', 'empty')
      expect(loaded.content).toBe('')
    })
  })

  describe('Color Picker — Palettes (color-palettes)', () => {
    const samplePalette = {
      mode: 'custom',
      colorPoints: [
        { hue: 0, saturation: 100 },
        { hue: 120, saturation: 80 },
        { hue: 240, saturation: 90 }
      ],
      baseLightness: 50,
      exportFormat: 'css'
    }

    it('saves and loads color palettes', async () => {
      await vault.save('color-palettes', 'brand', 'Brand Colors', samplePalette)
      const loaded = await vault.load('color-palettes', 'brand')
      expect(loaded).toEqual(samplePalette)
    })

    it('preserves color point values', async () => {
      await vault.save('color-palettes', 'precise', 'Precise', samplePalette)
      const loaded = await vault.load('color-palettes', 'precise')
      expect(loaded.colorPoints[0].hue).toBe(0)
      expect(loaded.colorPoints[1].saturation).toBe(80)
    })

    it('handles different modes', async () => {
      const modes = ['complementary', 'triadic', 'analogous', 'custom']
      for (const mode of modes) {
        const palette = { ...samplePalette, mode }
        await vault.save('color-palettes', `mode-${mode}`, mode, palette)
        const loaded = await vault.load('color-palettes', `mode-${mode}`)
        expect(loaded.mode).toBe(mode)
      }
    })
  })

  describe('Dev Tools — Snippets (devtools-snippets)', () => {
    const sampleSnippet = {
      htmlCode: '<div class="container">\n  <h1>Hello</h1>\n  <p>World</p>\n</div>',
      cssCode: '.container { max-width: 800px; margin: 0 auto; }\nh1 { color: #333; }',
      jsCode: 'document.querySelector("h1").addEventListener("click", () => {\n  alert("Clicked!")\n})'
    }

    it('saves and loads code snippets', async () => {
      await vault.save('devtools-snippets', 's1', 'Landing Page', sampleSnippet)
      const loaded = await vault.load('devtools-snippets', 's1')
      expect(loaded).toEqual(sampleSnippet)
    })

    it('preserves code indentation and special chars', async () => {
      const snippet = {
        htmlCode: '  <div>\n    <span>&amp; &lt; &gt;</span>\n  </div>',
        cssCode: 'div::before { content: "\\2022"; }',
        jsCode: 'const re = /[a-z]+/g;\nconst obj = { "key": `value ${1+2}` };'
      }
      await vault.save('devtools-snippets', 's2', 'Special', snippet)
      const loaded = await vault.load('devtools-snippets', 's2')
      expect(loaded.htmlCode).toBe(snippet.htmlCode)
      expect(loaded.cssCode).toBe(snippet.cssCode)
      expect(loaded.jsCode).toBe(snippet.jsCode)
    })

    it('handles empty code fields', async () => {
      const empty = { htmlCode: '', cssCode: '', jsCode: '' }
      await vault.save('devtools-snippets', 'empty', 'Empty', empty)
      const loaded = await vault.load('devtools-snippets', 'empty')
      expect(loaded).toEqual(empty)
    })
  })

  describe('API Tester — Collections (api-collections)', () => {
    const sampleCollections = {
      collections: [
        {
          id: 'col1',
          name: 'My API',
          requests: [
            { id: 'req1', name: 'Get Users', method: 'GET', url: 'https://api.example.com/users', headers: { Authorization: 'Bearer token123' }, body: '' },
            { id: 'req2', name: 'Create User', method: 'POST', url: 'https://api.example.com/users', headers: { 'Content-Type': 'application/json' }, body: '{"name":"John"}' }
          ]
        }
      ],
      history: [
        { method: 'GET', url: 'https://api.example.com/users', status: 200, timestamp: Date.now() }
      ]
    }

    it('saves and loads API collections', async () => {
      await vault.save('api-collections', 'collections', 'API Collections', sampleCollections)
      const loaded = await vault.load('api-collections', 'collections')
      expect(loaded).toEqual(sampleCollections)
    })

    it('preserves sensitive headers (tokens)', async () => {
      await vault.save('api-collections', 'creds', 'With Creds', sampleCollections)
      const loaded = await vault.load('api-collections', 'creds')
      expect(loaded.collections[0].requests[0].headers.Authorization).toBe('Bearer token123')
    })

    it('preserves request bodies', async () => {
      await vault.save('api-collections', 'bodies', 'Bodies', sampleCollections)
      const loaded = await vault.load('api-collections', 'bodies')
      expect(loaded.collections[0].requests[1].body).toBe('{"name":"John"}')
    })

    it('handles complex nested collections', async () => {
      const complex = {
        collections: Array.from({ length: 5 }, (_, ci) => ({
          id: `col${ci}`,
          name: `Collection ${ci}`,
          requests: Array.from({ length: 10 }, (_, ri) => ({
            id: `req${ci}-${ri}`, name: `Request ${ri}`, method: 'GET',
            url: `https://api${ci}.example.com/endpoint${ri}`,
            headers: {}, body: ''
          }))
        })),
        history: []
      }
      await vault.save('api-collections', 'complex', 'Complex', complex)
      const loaded = await vault.load('api-collections', 'complex')
      expect(loaded.collections).toHaveLength(5)
      expect(loaded.collections[4].requests).toHaveLength(10)
    })
  })

  describe('Phone Tester — Configs (phone-configs)', () => {
    const sampleConfig = {
      config: {
        websocketUrl: 'wss://pbx.company.com/ws',
        sipUri: 'sip:user@company.com',
        password: 'super-secret-sip-password',
        registrarServer: 'sip:pbx.company.com',
        displayName: 'John Doe',
        authorizationUser: 'john.doe'
      },
      framework: 'vue'
    }

    it('saves and loads SIP configs', async () => {
      await vault.save('phone-configs', 'prod', 'Production PBX', sampleConfig)
      const loaded = await vault.load('phone-configs', 'prod')
      expect(loaded).toEqual(sampleConfig)
    })

    it('preserves passwords (sensitive data encrypted)', async () => {
      await vault.save('phone-configs', 'secret', 'Secret Config', sampleConfig)
      const loaded = await vault.load('phone-configs', 'secret')
      expect(loaded.config.password).toBe('super-secret-sip-password')
    })

    it('preserves SIP URIs correctly', async () => {
      await vault.save('phone-configs', 'uri', 'URI Test', sampleConfig)
      const loaded = await vault.load('phone-configs', 'uri')
      expect(loaded.config.sipUri).toBe('sip:user@company.com')
      expect(loaded.config.websocketUrl).toBe('wss://pbx.company.com/ws')
    })
  })

  describe('Map Editor — Projects (map-projects)', () => {
    const sampleMap = {
      currentTile: 'osm',
      geojson: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] },
            properties: { id: 'm1', title: 'Madrid', description: 'Capital', color: '#ef4444', address: 'Madrid, Spain' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [2.1734, 41.3851] },
            properties: { id: 'm2', title: 'Barcelona', description: 'Catalonia', color: '#3b82f6', address: 'Barcelona, Spain' }
          },
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[-3.7038, 40.4168], [-1.0, 40.0], [2.1734, 41.3851]] },
            properties: { id: 'r1', color: '#22c55e', distance: 621, duration: 360 }
          }
        ]
      }
    }

    it('saves and loads map projects', async () => {
      await vault.save('map-projects', 'trip', 'Spain Trip', sampleMap)
      const loaded = await vault.load('map-projects', 'trip')
      expect(loaded).toEqual(sampleMap)
    })

    it('preserves GeoJSON coordinates', async () => {
      await vault.save('map-projects', 'coords', 'Coords', sampleMap)
      const loaded = await vault.load('map-projects', 'coords')
      const point = loaded.geojson.features[0].geometry
      expect(point.coordinates[0]).toBeCloseTo(-3.7038)
      expect(point.coordinates[1]).toBeCloseTo(40.4168)
    })

    it('preserves route geometry', async () => {
      await vault.save('map-projects', 'route', 'Route', sampleMap)
      const loaded = await vault.load('map-projects', 'route')
      const line = loaded.geojson.features[2].geometry
      expect(line.type).toBe('LineString')
      expect(line.coordinates).toHaveLength(3)
    })

    it('handles map with no features', async () => {
      const empty = { currentTile: 'satellite', geojson: { type: 'FeatureCollection', features: [] } }
      await vault.save('map-projects', 'empty', 'Empty Map', empty)
      const loaded = await vault.load('map-projects', 'empty')
      expect(loaded.geojson.features).toEqual([])
      expect(loaded.currentTile).toBe('satellite')
    })
  })

  describe('Invoice Generator — Configs (invoice-configs)', () => {
    const sampleInvoice = {
      name: 'Client Config',
      invoice: {
        number: 'FAC-2025-001',
        date: '2025-01-15',
        company: { name: 'Mi Empresa SL', nif: 'B12345678', address: 'Calle Mayor 1, Madrid' },
        client: { name: 'Cliente SA', nif: 'A87654321', address: 'Av. Diagonal 100, Barcelona' },
        items: [
          { description: 'Desarrollo web', quantity: 40, price: 75, tax: 21 },
          { description: 'Diseño UI', quantity: 20, price: 60, tax: 21 }
        ],
        notes: 'Pago a 30 días',
        currency: 'EUR'
      }
    }

    it('saves and loads invoice configs', async () => {
      await vault.save('invoice-configs', 'inv1', 'Client Config', sampleInvoice)
      const loaded = await vault.load('invoice-configs', 'inv1')
      expect(loaded).toEqual(sampleInvoice)
    })

    it('preserves invoice line items', async () => {
      await vault.save('invoice-configs', 'lines', 'Lines', sampleInvoice)
      const loaded = await vault.load('invoice-configs', 'lines')
      expect(loaded.invoice.items).toHaveLength(2)
      expect(loaded.invoice.items[0].price).toBe(75)
      expect(loaded.invoice.items[1].description).toBe('Diseño UI')
    })

    it('preserves tax rates', async () => {
      await vault.save('invoice-configs', 'tax', 'Tax', sampleInvoice)
      const loaded = await vault.load('invoice-configs', 'tax')
      expect(loaded.invoice.items[0].tax).toBe(21)
    })
  })

  describe('Kanban — Boards (kanban-boards)', () => {
    const sampleBoard = {
      id: 'board1',
      name: 'Sprint 23',
      columns: [
        {
          id: 'col1', name: 'To Do', color: '#6366f1',
          tasks: [
            { id: 't1', title: 'Implement auth', description: 'Add JWT', priority: 'high', createdAt: Date.now() },
            { id: 't2', title: 'Fix bug #42', description: '', priority: 'medium', createdAt: Date.now() }
          ]
        },
        {
          id: 'col2', name: 'In Progress', color: '#f59e0b',
          tasks: [
            { id: 't3', title: 'API endpoints', description: 'REST API', priority: 'high', createdAt: Date.now() }
          ]
        },
        {
          id: 'col3', name: 'Done', color: '#22c55e',
          tasks: []
        }
      ]
    }

    it('saves and loads kanban boards', async () => {
      await vault.save('kanban-boards', 'board1', 'Sprint 23', sampleBoard)
      const loaded = await vault.load('kanban-boards', 'board1')
      expect(loaded).toEqual(sampleBoard)
    })

    it('preserves column structure', async () => {
      await vault.save('kanban-boards', 'cols', 'Columns', sampleBoard)
      const loaded = await vault.load('kanban-boards', 'cols')
      expect(loaded.columns).toHaveLength(3)
      expect(loaded.columns[0].name).toBe('To Do')
      expect(loaded.columns[1].color).toBe('#f59e0b')
    })

    it('preserves tasks within columns', async () => {
      await vault.save('kanban-boards', 'tasks', 'Tasks', sampleBoard)
      const loaded = await vault.load('kanban-boards', 'tasks')
      expect(loaded.columns[0].tasks).toHaveLength(2)
      expect(loaded.columns[0].tasks[0].title).toBe('Implement auth')
      expect(loaded.columns[0].tasks[0].priority).toBe('high')
    })

    it('handles empty columns', async () => {
      await vault.save('kanban-boards', 'empty-cols', 'Empty', sampleBoard)
      const loaded = await vault.load('kanban-boards', 'empty-cols')
      expect(loaded.columns[2].tasks).toEqual([])
    })

    it('handles board with many tasks', async () => {
      const bigBoard = {
        id: 'big', name: 'Big Board',
        columns: [{
          id: 'c1', name: 'All Tasks', color: '#000',
          tasks: Array.from({ length: 100 }, (_, i) => ({
            id: `t${i}`, title: `Task ${i}`, description: `Desc ${i}`,
            priority: ['low', 'medium', 'high'][i % 3], createdAt: Date.now() + i
          }))
        }]
      }
      await vault.save('kanban-boards', 'big', 'Big', bigBoard)
      const loaded = await vault.load('kanban-boards', 'big')
      expect(loaded.columns[0].tasks).toHaveLength(100)
    })
  })

  describe('Cross-tool operations', () => {
    it('multiple tools can save simultaneously without interference', async () => {
      await Promise.all([
        vault.save('color-palettes', 'p1', 'Palette', { colors: ['#f00'] }),
        vault.save('devtools-snippets', 's1', 'Snippet', { htmlCode: '<p>Hi</p>' }),
        vault.save('markdown-documents', 'd1', 'Doc', { content: '# Hello' }),
        vault.save('image-presets', 'i1', 'Preset', { brightness: 10 })
      ])

      const [palette, snippet, doc, preset] = await Promise.all([
        vault.load('color-palettes', 'p1'),
        vault.load('devtools-snippets', 's1'),
        vault.load('markdown-documents', 'd1'),
        vault.load('image-presets', 'i1')
      ])

      expect(palette.colors).toEqual(['#f00'])
      expect(snippet.htmlCode).toBe('<p>Hi</p>')
      expect(doc.content).toBe('# Hello')
      expect(preset.brightness).toBe(10)
    })

    it('clearing one store does not affect others', async () => {
      await vault.save('color-palettes', 'p1', 'Keep', { keep: true })
      await vault.save('devtools-snippets', 's1', 'Delete', { del: true })

      await vault.clearStore('devtools-snippets')

      const palette = await vault.load('color-palettes', 'p1')
      expect(palette.keep).toBe(true)

      const snippet = await vault.load('devtools-snippets', 's1')
      expect(snippet).toBeNull()
    })
  })
})
