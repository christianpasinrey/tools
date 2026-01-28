<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DockButton from './DockButton.vue'
import DockSubmenu from './DockSubmenu.vue'
import MobileDockSubmenu from './MobileDockSubmenu.vue'
import { useDevice } from '../composables/useDevice'

const route = useRoute()
const { isMobile } = useDevice()

// Tools configuration (con soporte móvil)
const allTools = [
  {
    path: '/multimedia',
    name: 'Multimedia',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#a855f7',
    hasSubmenu: true,
    submenuTitle: 'Multimedia',
    mobileSupport: false,
    submenuItems: [
      {
        path: '/multimedia#image',
        name: 'Editor de Imagen',
        description: 'Edita, recorta y transforma imágenes',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        color: '#3b82f6',
        mobileSupport: false
      },
      {
        path: '/multimedia#audio',
        name: 'Editor de Audio',
        description: 'Corta, mezcla y exporta audio',
        icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
        color: '#a855f7',
        mobileSupport: false
      },
      {
        path: '/multimedia#3d',
        name: '3D Playground',
        description: 'Escenas 3D interactivas con Three.js',
        icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
        color: '#22c55e',
        mobileSupport: false
      },
      {
        path: '/multimedia#svg',
        name: 'Editor SVG',
        description: 'Crea y edita gráficos vectoriales',
        icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
        color: '#f97316',
        mobileSupport: false
      }
    ]
  },
  {
    path: '/documents',
    name: 'Documentos',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: '#ef4444',
    hasSubmenu: true,
    submenuTitle: 'Documentos',
    mobileSupport: true,
    submenuItems: [
      {
        path: '/documents#pdf',
        name: 'PDF Editor',
        description: 'Combina, divide y anota PDFs',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5V9H8c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V9H13c.83 0 1.5.67 1.5 1.5v3zm4-3H17v1h1.5V13H17v2h-1.5V9h3v1.5zM7 10.5h1v1H7v-1zm4 0h1v3h-1v-3z',
        color: '#ef4444',
        mobileSupport: false
      },
      {
        path: '/documents#spreadsheet',
        name: 'Spreadsheet Editor',
        description: 'Hojas de cálculo con fórmulas',
        icon: 'M3 3h18v18H3V3zm16 4H5v12h14V7zM7 9h2v2H7V9zm0 4h2v2H7v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z',
        color: '#22c55e',
        mobileSupport: false
      },
      {
        path: '/documents#markdown',
        name: 'Markdown Editor',
        description: 'Editor MD con preview en vivo',
        icon: 'M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zm8.56-1.98V8.81h-1.93v6.38h4.55v-1.98h-2.62z',
        color: '#3b82f6',
        mobileSupport: true
      }
    ]
  },
  {
    path: '/technology',
    name: 'Technology',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: '#06b6d4',
    hasSubmenu: true,
    submenuTitle: 'Technology',
    mobileSupport: true,
    submenuItems: [
      {
        path: '/technology#dev',
        name: 'Dev Tools',
        description: 'JSON, YAML, HTML/CSS/JS playground',
        icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
        color: '#06b6d4',
        mobileSupport: false
      },
      {
        path: '/technology#phone',
        name: 'Phone Tester',
        description: 'Prueba llamadas SIP WebRTC',
        icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
        color: '#10b981',
        mobileSupport: true
      },
      {
        path: '/technology#security',
        name: 'Cyber Security',
        description: 'JWT, Base64, Hash y más',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        color: '#ef4444',
        mobileSupport: true
      }
    ]
  },
  {
    path: '/tools',
    name: 'Tools',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    color: '#10b981',
    hasSubmenu: true,
    submenuTitle: 'Tools',
    submenuColumns: 2,
    submenuLayout: ['large', 'large'],
    mobileSupport: true,
    submenuItems: [
      {
        path: '/tools#converter',
        name: 'Unit Converter',
        description: 'Longitud, peso, temperatura, tiempo, monedas y más',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
        color: '#10b981',
        mobileSupport: true
      },
      {
        path: '/tools#color',
        name: 'Color Picker',
        description: 'Paletas de colores, gradientes, conversión HEX/RGB/HSL',
        icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
        color: '#ec4899',
        mobileSupport: true
      }
    ]
  },
  {
    path: '/apps',
    name: 'Apps',
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    color: '#6366f1',
    hasSubmenu: true,
    submenuTitle: 'Apps',
    mobileSupport: true,
    submenuItems: [
      {
        path: '/apps#map',
        name: 'Map Editor',
        description: 'Mapas interactivos con marcadores y formas',
        icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
        color: '#2563eb',
        mobileSupport: true
      },
      {
        path: '/apps#todo',
        name: 'TODO Kanban',
        description: 'Tablero de tareas con drag & drop',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        color: '#6366f1',
        mobileSupport: true
      },
      {
        path: '/apps#invoice',
        name: 'Facturas',
        description: 'Generador de facturas con PDF profesional',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        color: '#10b981',
        mobileSupport: true
      }
    ]
  },
  {
    path: '/cheatsheets',
    name: 'Reference',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#f59e0b',
    hasSubmenu: true,
    submenuTitle: 'Cheatsheets',
    mobileSupport: true,
    submenuItems: [
      {
        name: 'Sistemas',
        description: 'macOS, Windows, Linux',
        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        color: '#3b82f6',
        children: [
          { path: '/cheatsheets#macos', name: 'macOS', color: '#3b82f6' },
          { path: '/cheatsheets#windows', name: 'Windows', color: '#0ea5e9' },
          { path: '/cheatsheets#linux', name: 'Linux', color: '#f59e0b' }
        ]
      },
      {
        name: 'Desarrollo',
        description: 'Bash, Git, Python, TypeScript',
        icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
        color: '#22c55e',
        children: [
          { path: '/cheatsheets#bash', name: 'Bash', color: '#22c55e' },
          { path: '/cheatsheets#git', name: 'Git', color: '#f97316' },
          { path: '/cheatsheets#typescript', name: 'TypeScript', color: '#3b82f6' },
          { path: '/cheatsheets#python', name: 'Python', color: '#eab308' },
          { path: '/cheatsheets#vim', name: 'Vim', color: '#22c55e' },
          { path: '/cheatsheets#vscode', name: 'VS Code', color: '#0ea5e9' },
          { path: '/cheatsheets#regex', name: 'Regex', color: '#a855f7' }
        ]
      },
      {
        name: 'Bases de Datos',
        description: 'MySQL, SQL, MongoDB',
        icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
        color: '#06b6d4',
        children: [
          { path: '/cheatsheets#mysql', name: 'MySQL', color: '#06b6d4' },
          { path: '/cheatsheets#sql', name: 'SQL', color: '#3b82f6' },
          { path: '/cheatsheets#mongodb', name: 'MongoDB', color: '#22c55e' }
        ]
      },
      {
        name: 'DevOps',
        description: 'Docker, Kubernetes, NPM',
        icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
        color: '#a855f7',
        children: [
          { path: '/cheatsheets#docker', name: 'Docker', color: '#0ea5e9' },
          { path: '/cheatsheets#kubernetes', name: 'Kubernetes', color: '#3b82f6' },
          { path: '/cheatsheets#npm', name: 'NPM', color: '#ef4444' }
        ]
      },
      {
        name: 'Frameworks',
        description: 'Laravel, Vue, React',
        icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
        color: '#ef4444',
        children: [
          { path: '/cheatsheets#laravel', name: 'Laravel', color: '#ef4444' },
          { path: '/cheatsheets#vue', name: 'Vue.js', color: '#22c55e' },
          { path: '/cheatsheets#react', name: 'React', color: '#06b6d4' }
        ]
      },
      {
        name: 'Estilos',
        description: 'CSS, Tailwind',
        icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
        color: '#ec4899',
        children: [
          { path: '/cheatsheets#css', name: 'CSS', color: '#3b82f6' },
          { path: '/cheatsheets#tailwind', name: 'Tailwind', color: '#06b6d4' }
        ]
      },
      {
        name: 'Ciencias',
        description: 'Física, Química, Matemáticas',
        icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
        color: '#f97316',
        children: [
          { path: '/cheatsheets#physics', name: 'Física', color: '#3b82f6' },
          { path: '/cheatsheets#chemistry', name: 'Química', color: '#22c55e' },
          { path: '/cheatsheets#math', name: 'Matemáticas', color: '#a855f7' },
          { path: '/cheatsheets#statistics', name: 'Estadística', color: '#f97316' },
          { path: '/cheatsheets#electricity', name: 'Electricidad', color: '#eab308' },
          { path: '/cheatsheets#accounting', name: 'Contabilidad', color: '#10b981' },
          { path: '/cheatsheets#periodictable', name: 'Tabla Periódica', color: '#06b6d4' }
        ]
      },
      {
        name: 'Productividad',
        description: 'Excel, Notion, Adobe',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        color: '#10b981',
        children: [
          { path: '/cheatsheets#excel', name: 'Excel', color: '#22c55e' },
          { path: '/cheatsheets#notion', name: 'Notion', color: '#64748b' },
          { path: '/cheatsheets#photoshop', name: 'Photoshop', color: '#3b82f6' },
          { path: '/cheatsheets#lightroom', name: 'Lightroom', color: '#06b6d4' }
        ]
      },
      {
        name: 'Creativos',
        description: 'Música, Foto, Video, 3D',
        icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
        color: '#8b5cf6',
        children: [
          { path: '/cheatsheets#music', name: 'Música', color: '#ec4899' },
          { path: '/cheatsheets#photography', name: 'Fotografía', color: '#f97316' },
          { path: '/cheatsheets#premiere', name: 'Premiere', color: '#a855f7' },
          { path: '/cheatsheets#aftereffects', name: 'After Effects', color: '#8b5cf6' },
          { path: '/cheatsheets#illustrator', name: 'Illustrator', color: '#f97316' },
          { path: '/cheatsheets#blender', name: 'Blender', color: '#f97316' }
        ]
      },
      {
        name: 'Idiomas',
        description: 'Inglés, Japonés, Chino...',
        icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129',
        color: '#14b8a6',
        children: [
          { path: '/cheatsheets#english', name: 'Inglés', color: '#3b82f6' },
          { path: '/cheatsheets#french', name: 'Francés', color: '#ef4444' },
          { path: '/cheatsheets#german', name: 'Alemán', color: '#eab308' },
          { path: '/cheatsheets#japanese', name: 'Japonés', color: '#ef4444' },
          { path: '/cheatsheets#chinese', name: 'Chino', color: '#ef4444' },
          { path: '/cheatsheets#korean', name: 'Coreano', color: '#3b82f6' }
        ]
      },
      {
        name: 'Contemporáneo',
        description: 'Jerga Gen Z, Anglicismos',
        icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
        color: '#f43f5e',
        children: [
          { path: '/cheatsheets#slang', name: 'Jerga Gen Z', color: '#f43f5e' },
          { path: '/cheatsheets#anglicismos', name: 'Anglicismos', color: '#a855f7' },
          { path: '/cheatsheets#internet', name: 'Internet', color: '#06b6d4' }
        ]
      },
      {
        name: 'Web',
        description: 'HTTP, Markdown',
        icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
        color: '#64748b',
        children: [
          { path: '/cheatsheets#http', name: 'HTTP', color: '#64748b' },
          { path: '/cheatsheets#markdown', name: 'Markdown', color: '#3b82f6' }
        ]
      }
    ]
  },
]

// Computed para filtrar herramientas según plataforma
const tools = computed(() => {
  if (!isMobile.value) return allTools

  return allTools
    .filter(tool => tool.mobileSupport !== false)
    .map(tool => {
      // Si tiene submenu, filtrar sus items también
      if (tool.submenuItems) {
        const filteredItems = tool.submenuItems.filter(
          item => item.mobileSupport !== false
        )
        // Si no quedan items después de filtrar, excluir la sección
        if (filteredItems.length === 0) return null
        return {
          ...tool,
          submenuItems: filteredItems
        }
      }
      return tool
    })
    .filter(tool => tool !== null)
})

// Dock magnetic effect
const dockRef = ref(null)
const iconRefs = ref([])
const scales = ref(tools.value.map(() => 1))
const hoveredIndex = ref(-1)

// Actualizar scales cuando cambie tools filtrado
watch(tools, (newTools) => {
  scales.value = newTools.map(() => 1)
}, { immediate: true })

// Submenu state
const activeSubmenuIndex = ref(-1)
const submenuHovered = ref(false)
let submenuTimeout = null

const MAX_SCALE = 1.25
const EFFECT_DISTANCE = 60

const onDockMouseMove = (e) => {
  // No hacer nada en móvil
  if (isMobile.value || !dockRef.value) return

  const mouseX = e.clientX

  iconRefs.value.forEach((iconRef, index) => {
    if (!iconRef) return

    const iconEl = iconRef.$el || iconRef
    if (!iconEl || typeof iconEl.getBoundingClientRect !== 'function') return

    const iconRect = iconEl.getBoundingClientRect()
    const iconCenterX = iconRect.left + iconRect.width / 2
    const distance = Math.abs(mouseX - iconCenterX)

    if (distance < EFFECT_DISTANCE) {
      const scale = MAX_SCALE - (distance / EFFECT_DISTANCE) * (MAX_SCALE - 1)
      scales.value[index] = scale
    } else {
      scales.value[index] = 1
    }
  })
}

const onDockMouseLeave = () => {
  // No hacer nada en móvil
  if (isMobile.value) return

  hoveredIndex.value = -1
  scales.value.forEach((_, index) => {
    scales.value[index] = 1
  })

  // Delay closing submenu to allow mouse to move to it
  if (activeSubmenuIndex.value !== -1 && !submenuHovered.value) {
    submenuTimeout = setTimeout(() => {
      if (!submenuHovered.value) {
        activeSubmenuIndex.value = -1
      }
    }, 350)
  }
}

const onIconMouseEnter = (index) => {
  hoveredIndex.value = index
}

const onIconMouseLeave = () => {
  hoveredIndex.value = -1
}

// Submenu handlers (solo desktop)
const onSubmenuEnter = (index) => {
  if (isMobile.value) return
  clearTimeout(submenuTimeout)
  activeSubmenuIndex.value = index
}

const onSubmenuLeave = (index) => {
  if (isMobile.value) return
  // Delay to allow transition to submenu
  submenuTimeout = setTimeout(() => {
    if (!submenuHovered.value) {
      activeSubmenuIndex.value = -1
    }
  }, 350)
}

const onSubmenuMouseEnter = () => {
  if (isMobile.value) return
  clearTimeout(submenuTimeout)
  submenuHovered.value = true
}

const onSubmenuMouseLeave = () => {
  if (isMobile.value) return
  submenuHovered.value = false
  submenuTimeout = setTimeout(() => {
    activeSubmenuIndex.value = -1
  }, 350)
}

const onSubmenuItemClick = () => {
  activeSubmenuIndex.value = -1
  submenuHovered.value = false
}

// Close submenu (used by mobile)
const closeSubmenu = () => {
  activeSubmenuIndex.value = -1
  submenuHovered.value = false
}

// Toggle submenu (used by mobile)
const onSubmenuToggle = (index) => {
  if (activeSubmenuIndex.value === index) {
    activeSubmenuIndex.value = -1
  } else {
    activeSubmenuIndex.value = index
  }
}

// Computed for active submenu
const activeSubmenu = computed(() => {
  if (activeSubmenuIndex.value === -1) return null
  return tools.value[activeSubmenuIndex.value]
})
</script>

<template>
  <!-- Floating Dock at bottom -->
  <div class="dock-wrapper">
    <!-- SVG Filter for Liquid Glass -->
    <svg class="absolute w-0 h-0" aria-hidden="true">
      <defs>
        <filter id="dockLensFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feDisplacementMap in="SourceGraphic" in2="blur" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <!-- Submenu Panel - Desktop -->
    <DockSubmenu
      v-if="!isMobile && activeSubmenu?.hasSubmenu"
      :visible="activeSubmenuIndex !== -1"
      :title="activeSubmenu?.submenuTitle"
      :items="activeSubmenu?.submenuItems"
      :color="activeSubmenu?.color"
      :layout="activeSubmenu?.submenuLayout || 'auto'"
      :columns="activeSubmenu?.submenuColumns || 3"
      @mouseenter="onSubmenuMouseEnter"
      @mouseleave="onSubmenuMouseLeave"
      @item-click="onSubmenuItemClick"
      @close="closeSubmenu"
    />

    <!-- Submenu Panel - Mobile -->
    <MobileDockSubmenu
      v-if="isMobile && activeSubmenu?.hasSubmenu"
      :visible="activeSubmenuIndex !== -1"
      :title="activeSubmenu?.submenuTitle"
      :items="activeSubmenu?.submenuItems"
      :color="activeSubmenu?.color"
      @item-click="onSubmenuItemClick"
      @close="closeSubmenu"
    />

    <div
      ref="dockRef"
      class="dock-glass"
      @mousemove="onDockMouseMove"
      @mouseleave="onDockMouseLeave"
    >
      <!-- Liquid Glass Layers -->
      <div class="dock-glass-filter"></div>
      <div class="dock-glass-overlay"></div>
      <div class="dock-glass-specular"></div>

      <!-- Dock Content -->
      <div class="dock-content">
        <!-- Home button -->
        <router-link
          to="/"
          class="dock-item dock-home"
          :class="{ 'is-active': route.path === '/' }"
        >
          <div class="dock-icon home-icon">
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style="width: 20px; height: 20px;"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div v-if="route.path === '/'" class="dock-active-dot"></div>
        </router-link>

        <!-- Separator -->
        <div class="dock-separator"></div>

        <!-- Tool icons -->
        <DockButton
          v-for="(tool, index) in tools"
          :key="tool.path"
          :ref="el => iconRefs[index] = el"
          :path="tool.path"
          :name="tool.name"
          :icon="tool.icon"
          :color="tool.color"
          :scale="scales[index]"
          :is-hovered="hoveredIndex === index"
          :has-submenu="tool.hasSubmenu || false"
          :submenu-open="activeSubmenuIndex === index"
          @mouseenter="onIconMouseEnter(index)"
          @mouseleave="onIconMouseLeave"
          @submenu-enter="onSubmenuEnter(index)"
          @submenu-leave="onSubmenuLeave(index)"
          @submenu-toggle="onSubmenuToggle(index)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dock Wrapper - Fixed at bottom center */
.dock-wrapper {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  padding: 8px;
}

/* Liquid Glass Container - Dark mode (default, same as MobileDock) */
.dock-glass {
  position: relative;
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.04) 50%,
    rgba(255, 255, 255, 0.06) 100%
  );
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.2),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 4px 20px rgba(0, 0, 0, 0.2),
    0 0 0 0.5px rgba(255, 255, 255, 0.08);
}

.dock-glass::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 9999px;
}

/* Light mode */
:global(html:not(.dark)) .dock-glass {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0.7) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark)) .dock-glass::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
}

/* Hide the extra glass layers - not needed with new approach */
.dock-glass-filter,
.dock-glass-overlay,
.dock-glass-specular {
  display: none;
}

/* Dock content layer */
.dock-content {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 8px 12px;
  z-index: 4;
}

/* Separator between home and tools - Dark mode (default) */
.dock-separator {
  width: 1px;
  height: 32px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(255, 255, 255, 0.2) 20%,
    rgba(255, 255, 255, 0.2) 80%,
    transparent
  );
  margin: 0 8px;
  align-self: center;
}

/* Light mode */
:global(html:not(.dark)) .dock-separator {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 0, 0, 0.15) 20%,
    rgba(0, 0, 0, 0.15) 80%,
    transparent
  );
}

/* Home Dock Item */
.dock-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: bottom center;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.dock-item:hover {
  z-index: 10;
}

/* Dock Icon - Dark mode (default, same as MobileDock) */
.dock-icon {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  backdrop-filter: blur(20px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.85);
  transition: all 0.2s ease;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 0 0.5px rgba(255, 255, 255, 0.1);
}

.dock-icon::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 9999px;
}

.dock-icon svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  filter:
    drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))
    drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
}

.dock-item:hover .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 30%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.dock-item.is-active .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 16px color-mix(in srgb, var(--tool-color, #22c55e) 25%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.25),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
}

/* Dock Icon - Light mode */
:global(html:not(.dark)) .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(255, 255, 255, 0.8) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.75) !important;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark)) .dock-icon svg {
  stroke: currentColor;
  filter:
    drop-shadow(0 0 1px rgba(0, 0, 0, 0.15))
    drop-shadow(0 0 2px rgba(0, 0, 0, 0.08));
}

:global(html:not(.dark)) .dock-icon::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
}

:global(html:not(.dark)) .dock-item:hover .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border-color: rgba(0, 0, 0, 0.12);
  color: var(--tool-color, #22c55e) !important;
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 25%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 4px 12px rgba(0, 0, 0, 0.1);
}

:global(html:not(.dark)) .dock-item.is-active .dock-icon {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border-color: color-mix(in srgb, var(--tool-color, #22c55e) 40%, rgba(0, 0, 0, 0.1));
  color: var(--tool-color, #22c55e) !important;
}

/* Home icon special styling */
.home-icon {
  --tool-color: #22c55e;
}

/* Active dot indicator */
.dock-active-dot {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--tool-color, #22c55e);
  box-shadow: 0 0 8px var(--tool-color, #22c55e);
}

/* ===== RESPONSIVE - Tablet ===== */
@media (max-width: 768px) {
  .dock-wrapper {
    bottom: 12px;
    padding: 4px;
    max-width: calc(100vw - 24px);
  }

  .dock-glass {
    border-radius: 16px;
  }

  .dock-glass-filter,
  .dock-glass-overlay,
  .dock-glass-specular {
    border-radius: 16px;
  }

  .dock-content {
    padding: 6px 10px;
    gap: 2px;
  }

  .dock-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .dock-icon svg {
    width: 18px;
    height: 18px;
  }

  .dock-separator {
    height: 28px;
    margin: 0 6px;
  }
}

/* ===== RESPONSIVE - Mobile ===== */
@media (max-width: 480px) {
  .dock-wrapper {
    bottom: 12px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    max-width: calc(100vw - 24px);
  }

  .dock-glass {
    border-radius: 18px;
    width: auto;
  }

  .dock-glass-filter,
  .dock-glass-overlay,
  .dock-glass-specular {
    border-radius: 18px;
  }

  .dock-content {
    padding: 8px 10px;
    gap: 4px;
    justify-content: center;
    width: auto;
  }

  .dock-icon {
    width: 42px;
    height: 42px;
    border-radius: 11px;
  }

  .dock-icon svg {
    width: 20px;
    height: 20px;
  }

  .dock-separator {
    height: 28px;
    margin: 0 6px;
  }

  .dock-active-dot {
    width: 4px;
    height: 4px;
    bottom: -5px;
  }

  .dock-item {
    transform: scale(1) !important;
    transition: transform 0.1s ease;
  }

  .dock-item:active {
    transform: scale(0.92) !important;
  }

  .dock-item:active .dock-icon {
    background: rgba(255, 255, 255, 0.15);
  }

  /* Ocultar tooltip en móvil */
  .dock-tooltip {
    display: none !important;
  }
}

/* ===== RESPONSIVE - Very small screens ===== */
@media (max-width: 380px) {
  .dock-content {
    padding: 6px 8px;
    gap: 3px;
  }

  .dock-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }

  .dock-icon svg {
    width: 18px;
    height: 18px;
  }

  .dock-separator {
    height: 24px;
    margin: 0 4px;
  }

  .dock-active-dot {
    bottom: -4px;
  }
}
</style>
