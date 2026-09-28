import sheetMeta from '@/data/cheatsheets/meta.json'

export const CATEGORIES = [
  { id: 'documents', name: 'Documentos', blurb: 'PDF, Word, hojas de cálculo y conversores', path: '/documents', icon: 'documents' },
  { id: 'multimedia', name: 'Multimedia', blurb: 'Imagen, audio, vectores y 3D', path: '/multimedia', icon: 'multimedia' },
  { id: 'tools', name: 'Utilidades', blurb: 'Conversores y color para el día a día', path: '/tools', icon: 'tools' },
  { id: 'apps', name: 'Apps', blurb: 'Tareas, facturas y mapas que se guardan cifrados', path: '/apps', icon: 'apps' },
  { id: 'technology', name: 'Tecnología', blurb: 'APIs, código, seguridad y almacenamiento', path: '/technology', icon: 'technology' },
  { id: 'cheatsheets', name: 'Chuletas', blurb: 'Atajos, comandos y fórmulas a mano', path: '/cheatsheets', icon: 'cheatsheets' }
]

const r = (path, hash = '') => ({ path, hash })

export const TASKS = [
  // Documentos
  { id: 'pdf-editor', name: 'Editor de PDF', task: 'Anota, firma, reordena y combina páginas de un PDF', category: 'documents', route: r('/documents', 'pdf'), keywords: ['pdf', 'editar', 'firmar', 'firma', 'anotar', 'unir', 'combinar', 'juntar', 'paginas', 'reordenar'], accepts: ['.pdf', 'application/pdf'], preview: 'PdfSign', mobile: false, featured: true, launch: 'pdf' },
  { id: 'pdf-to-jpg', name: 'PDF a JPG', task: 'Convierte cada página de un PDF en una imagen', category: 'documents', route: r('/documents', 'converter'), keywords: ['pdf', 'jpg', 'jpeg', 'imagen', 'imagenes', 'convertir', 'exportar'], accepts: ['.pdf', 'application/pdf'], preview: 'PdfToImages', mobile: true, featured: true, launch: 'converter:pdf-to-jpg' },
  { id: 'pdf-to-word', name: 'PDF a Word', task: 'Extrae el texto de un PDF a un documento .docx', category: 'documents', route: r('/documents', 'converter'), keywords: ['pdf', 'word', 'docx', 'documento', 'convertir', 'texto'], accepts: ['.pdf', 'application/pdf'], preview: 'PdfToDoc', mobile: true, featured: true, launch: 'converter:pdf-to-word' },
  { id: 'pdf-to-excel', name: 'PDF a Excel', task: 'Saca las tablas de un PDF a una hoja .xlsx', category: 'documents', route: r('/documents', 'converter'), keywords: ['pdf', 'excel', 'xlsx', 'tabla', 'tablas', 'hoja', 'convertir'], accepts: ['.pdf', 'application/pdf'], preview: 'Sheet', mobile: true, featured: false, launch: 'converter:pdf-to-excel' },
  { id: 'jpg-to-pdf', name: 'Imágenes a PDF', task: 'Junta fotos JPG o PNG en un único PDF', category: 'documents', route: r('/documents', 'converter'), keywords: ['jpg', 'jpeg', 'png', 'imagen', 'imagenes', 'foto', 'fotos', 'pdf', 'convertir', 'juntar'], accepts: ['.jpg', '.jpeg', '.png', 'image/jpeg', 'image/png'], preview: 'ImagesToPdf', mobile: true, featured: false, launch: 'converter:jpg-to-pdf' },
  { id: 'spreadsheet', name: 'Hoja de cálculo', task: 'Abre, edita y crea hojas Excel y CSV con fórmulas', category: 'documents', route: r('/documents', 'spreadsheet'), keywords: ['excel', 'xlsx', 'csv', 'hoja', 'calculo', 'formulas', 'tabla'], accepts: ['.xlsx', '.xls', '.csv'], preview: 'Sheet', mobile: false, featured: false },
  { id: 'docx', name: 'Documento Word', task: 'Escribe y edita documentos .docx sin instalar nada', category: 'documents', route: r('/documents', 'docx'), keywords: ['word', 'docx', 'documento', 'escribir', 'texto', 'carta'], accepts: ['.docx'], preview: 'DocWrite', mobile: true, featured: false },
  { id: 'markdown', name: 'Editor Markdown', task: 'Escribe en Markdown y ve el resultado al instante', category: 'documents', route: r('/documents', 'markdown'), keywords: ['markdown', 'md', 'readme', 'notas', 'escribir'], accepts: ['.md', 'text/markdown'], preview: 'Markdown', mobile: true, featured: false },
  // Multimedia
  { id: 'image-editor', name: 'Editor de imágenes', task: 'Recorta, ajusta la luz y aplica filtros a tus fotos', category: 'multimedia', route: r('/multimedia', 'image'), keywords: ['imagen', 'foto', 'fotos', 'recortar', 'filtros', 'brillo', 'redimensionar', 'editar'], accepts: ['image/*'], preview: 'ImageAdjust', mobile: false, featured: true, launch: 'image' },
  { id: 'audio-editor', name: 'Editor de audio', task: 'Corta, une y aplica efectos a pistas de audio', category: 'multimedia', route: r('/multimedia', 'audio'), keywords: ['audio', 'mp3', 'wav', 'sonido', 'musica', 'cortar', 'recortar', 'podcast'], accepts: ['audio/*'], preview: 'Waveform', mobile: false, featured: true },
  { id: 'svg-editor', name: 'Editor SVG', task: 'Dibuja y retoca gráficos vectoriales', category: 'multimedia', route: r('/multimedia', 'svg'), keywords: ['svg', 'vector', 'vectorial', 'dibujar', 'icono', 'logo', 'ilustracion'], accepts: ['.svg', 'image/svg+xml'], preview: 'Bezier', mobile: false, featured: false },
  { id: '3d', name: 'Estudio 3D', task: 'Crea y explora escenas 3D en el navegador', category: 'multimedia', route: r('/multimedia', '3d'), keywords: ['3d', 'modelo', 'escena', 'three', 'render'], accepts: [], preview: 'Orbit', mobile: false, featured: false },
  // Utilidades
  { id: 'unit-converter', name: 'Conversor de unidades', task: 'Longitud, peso, temperatura, datos y más', category: 'tools', route: r('/tools', 'converter'), keywords: ['unidades', 'convertir', 'conversor', 'medidas', 'km', 'millas', 'kg', 'libras', 'temperatura', 'celsius', 'fahrenheit'], accepts: [], preview: 'Units', mobile: true, featured: true },
  { id: 'color', name: 'Selector de color', task: 'Elige colores y conviértelos entre HEX, RGB y HSL', category: 'tools', route: r('/tools', 'color'), keywords: ['color', 'colores', 'hex', 'rgb', 'hsl', 'paleta', 'picker'], accepts: [], preview: 'ColorDrop', mobile: true, featured: true },
  // Apps
  { id: 'todo', name: 'Tablero Kanban', task: 'Organiza tareas en columnas y arrástralas', category: 'apps', route: r('/apps', 'todo'), keywords: ['tareas', 'kanban', 'todo', 'pendientes', 'organizar', 'proyecto'], accepts: [], preview: 'Kanban', mobile: true, featured: true },
  { id: 'invoice', name: 'Facturas', task: 'Crea facturas profesionales y descárgalas en PDF', category: 'apps', route: r('/apps', 'invoice'), keywords: ['factura', 'facturas', 'invoice', 'presupuesto', 'autonomo', 'iva'], accepts: [], preview: 'Invoice', mobile: true, featured: false },
  { id: 'map', name: 'Editor de mapas', task: 'Marca lugares, dibuja rutas y guarda tus mapas', category: 'apps', route: r('/apps', 'map'), keywords: ['mapa', 'mapas', 'ruta', 'rutas', 'ubicacion', 'lugares', 'gps'], accepts: ['.geojson', '.gpx'], preview: 'MapPins', mobile: true, featured: false },
  // Tecnología
  { id: 'api', name: 'Probador de APIs', task: 'Lanza peticiones HTTP y revisa las respuestas', category: 'technology', route: r('/technology', 'api'), keywords: ['api', 'http', 'rest', 'peticion', 'postman', 'get', 'post', 'endpoint'], accepts: [], preview: 'ApiRequest', mobile: false, featured: true },
  { id: 'dev', name: 'Herramientas de código', task: 'Formatea JSON y prueba HTML, CSS y JS en vivo', category: 'technology', route: r('/technology', 'dev'), keywords: ['json', 'formatear', 'html', 'css', 'javascript', 'codigo', 'playground'], accepts: ['.json', 'application/json'], preview: 'Code', mobile: false, featured: false },
  { id: 'security', name: 'Seguridad', task: 'Contraseñas, hashes, JWT, Base64, UUID y más', category: 'technology', route: r('/technology', 'security'), keywords: ['contrasena', 'password', 'hash', 'sha', 'md5', 'jwt', 'base64', 'uuid', 'timestamp', 'hex', 'url', 'codificar'], accepts: [], preview: 'Generic', mobile: true, featured: false },
  { id: 'storage', name: 'Almacenamiento del navegador', task: 'Inspecciona localStorage, sessionStorage e IndexedDB', category: 'technology', route: r('/technology', 'browser-storage'), keywords: ['localstorage', 'sessionstorage', 'indexeddb', 'cookies', 'almacenamiento', 'storage'], accepts: [], preview: 'Generic', mobile: true, featured: false },
  { id: 'phone', name: 'Teléfono SIP', task: 'Prueba cuentas SIP y llamadas desde el navegador', category: 'technology', route: r('/technology', 'phone'), keywords: ['sip', 'telefono', 'voip', 'llamada', 'webrtc'], accepts: [], preview: 'Generic', mobile: true, featured: false },
  // Chuletas
  { id: 'cheatsheets', name: 'Chuletas', task: `${sheetMeta.length} chuletas de atajos, comandos y fórmulas`, category: 'cheatsheets', route: r('/cheatsheets'), keywords: ['chuleta', 'chuletas', 'cheatsheet', 'atajos', 'comandos', 'referencia'], accepts: [], preview: 'Cheatsheet', mobile: true, featured: false }
]

export const SHEETS = sheetMeta.map(s => ({
  id: `sheet-${s.id}`,
  name: s.title,
  task: s.description,
  category: 'cheatsheets',
  route: r('/cheatsheets', s.id),
  keywords: [s.id, 'chuleta', 'atajos'],
  accepts: [],
  preview: null,
  mobile: true,
  featured: false,
  bench: false
}))

export const SEARCH_INDEX = [...TASKS, ...SHEETS]

const byId = new Map(SEARCH_INDEX.map(e => [e.id, e]))
const categoriesById = new Map(CATEGORIES.map(c => [c.id, c]))

export const getEntry = (id) => byId.get(id)
export const getCategory = (id) => categoriesById.get(id)
export const benchTasks = (categoryId) => TASKS.filter(t => t.category === categoryId && t.bench !== false)
export const toHref = (entry) => entry.route.path + (entry.route.hash ? `#${entry.route.hash}` : '')
