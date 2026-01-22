<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import DockButton from './DockButton.vue'
import DockSubmenu from './DockSubmenu.vue'

const route = useRoute()

// Tools configuration
const tools = [
  {
    path: '/multimedia',
    name: 'Multimedia',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#a855f7',
    hasSubmenu: true,
    submenuTitle: 'Multimedia',
    submenuItems: [
      {
        path: '/multimedia#image',
        name: 'Editor de Imagen',
        description: 'Edita, recorta y transforma imágenes',
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
        color: '#3b82f6'
      },
      {
        path: '/multimedia#audio',
        name: 'Editor de Audio',
        description: 'Corta, mezcla y exporta audio',
        icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
        color: '#a855f7'
      },
      {
        path: '/multimedia#3d',
        name: '3D Playground',
        description: 'Escenas 3D interactivas con Three.js',
        icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
        color: '#22c55e'
      },
      {
        path: '/multimedia#svg',
        name: 'Editor SVG',
        description: 'Crea y edita gráficos vectoriales',
        icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
        color: '#f97316'
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
    submenuItems: [
      {
        path: '/documents#pdf',
        name: 'PDF Editor',
        description: 'Combina, divide y anota PDFs',
        icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5V9H8c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V9H13c.83 0 1.5.67 1.5 1.5v3zm4-3H17v1h1.5V13H17v2h-1.5V9h3v1.5zM7 10.5h1v1H7v-1zm4 0h1v3h-1v-3z',
        color: '#ef4444'
      },
      {
        path: '/documents#spreadsheet',
        name: 'Spreadsheet Editor',
        description: 'Hojas de cálculo con fórmulas',
        icon: 'M3 3h18v18H3V3zm16 4H5v12h14V7zM7 9h2v2H7V9zm0 4h2v2H7v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z',
        color: '#22c55e'
      },
      {
        path: '/documents#markdown',
        name: 'Markdown Editor',
        description: 'Editor MD con preview en vivo',
        icon: 'M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zm8.56-1.98V8.81h-1.93v6.38h4.55v-1.98h-2.62z',
        color: '#3b82f6'
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
    submenuItems: [
      {
        path: '/technology#dev',
        name: 'Dev Tools',
        description: 'JSON, YAML, HTML/CSS/JS playground',
        icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
        color: '#06b6d4'
      },
      {
        path: '/technology#phone',
        name: 'Phone Tester',
        description: 'Prueba llamadas SIP WebRTC',
        icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
        color: '#10b981'
      },
      {
        path: '/technology#security',
        name: 'Cyber Security',
        description: 'JWT, Base64, Hash y más',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        color: '#ef4444'
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
    submenuItems: [
      {
        path: '/tools#converter',
        name: 'Unit Converter',
        description: 'Longitud, peso, temperatura, tiempo, monedas y más',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
        color: '#10b981'
      },
      {
        path: '/tools#color',
        name: 'Color Picker',
        description: 'Paletas de colores, gradientes, conversión HEX/RGB/HSL',
        icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
        color: '#ec4899'
      }
    ]
  },
  {
    path: '/location',
    name: 'Location',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    color: '#2563eb',
    hasSubmenu: true,
    submenuTitle: 'Location',
    submenuItems: [
      {
        path: '/location#map',
        name: 'Map Editor',
        description: 'Mapas interactivos con marcadores y formas',
        icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
        color: '#2563eb'
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

// Dock magnetic effect
const dockRef = ref(null)
const iconRefs = ref([])
const scales = reactive(tools.map(() => 1))
const hoveredIndex = ref(-1)

// Submenu state
const activeSubmenuIndex = ref(-1)
const submenuHovered = ref(false)
let submenuTimeout = null

const MAX_SCALE = 1.25
const EFFECT_DISTANCE = 60

const onDockMouseMove = (e) => {
  if (!dockRef.value) return

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
      scales[index] = scale
    } else {
      scales[index] = 1
    }
  })
}

const onDockMouseLeave = () => {
  hoveredIndex.value = -1
  scales.forEach((_, index) => {
    scales[index] = 1
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

// Submenu handlers
const onSubmenuEnter = (index) => {
  clearTimeout(submenuTimeout)
  activeSubmenuIndex.value = index
}

const onSubmenuLeave = (index) => {
  // Delay to allow transition to submenu
  submenuTimeout = setTimeout(() => {
    if (!submenuHovered.value) {
      activeSubmenuIndex.value = -1
    }
  }, 350)
}

const onSubmenuMouseEnter = () => {
  clearTimeout(submenuTimeout)
  submenuHovered.value = true
}

const onSubmenuMouseLeave = () => {
  submenuHovered.value = false
  submenuTimeout = setTimeout(() => {
    activeSubmenuIndex.value = -1
  }, 350)
}

const onSubmenuItemClick = () => {
  activeSubmenuIndex.value = -1
  submenuHovered.value = false
}

// Computed for active submenu
const activeSubmenu = computed(() => {
  if (activeSubmenuIndex.value === -1) return null
  return tools[activeSubmenuIndex.value]
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

    <!-- Submenu Panel -->
    <DockSubmenu
      v-if="activeSubmenu?.hasSubmenu"
      :visible="activeSubmenuIndex !== -1"
      :title="activeSubmenu?.submenuTitle"
      :items="activeSubmenu?.submenuItems"
      :color="activeSubmenu?.color"
      :layout="activeSubmenu?.submenuLayout || 'auto'"
      :columns="activeSubmenu?.submenuColumns || 3"
      @mouseenter="onSubmenuMouseEnter"
      @mouseleave="onSubmenuMouseLeave"
      @item-click="onSubmenuItemClick"
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
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

/* Liquid Glass Container */
.dock-glass {
  --lg-bg-color: rgba(20, 20, 20, 0.75);
  --lg-highlight: rgba(255, 255, 255, 0.4);
  --lg-highlight-soft: rgba(255, 255, 255, 0.15);
  --lg-border: rgba(255, 255, 255, 0.15);
  position: relative;
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.dock-glass:hover {
  --lg-bg-color: rgba(25, 25, 25, 0.85);
  --lg-highlight: rgba(255, 255, 255, 0.55);
  --lg-highlight-soft: rgba(255, 255, 255, 0.25);
}

/* Background blur + lens distortion */
.dock-glass-filter {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  filter: url(#dockLensFilter);
  z-index: 1;
}

/* Semi-transparent overlay */
.dock-glass-overlay {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: var(--lg-bg-color);
  border: 1px solid var(--lg-border);
  transition: all 0.4s ease;
  z-index: 2;
}

.dock-glass:hover .dock-glass-overlay {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Specular highlights - liquid bubble shine */
.dock-glass-specular {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    var(--lg-highlight-soft) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.05) 100%
  );
  box-shadow:
    inset 1px 1px 1px var(--lg-highlight),
    inset 2px 2px 6px var(--lg-highlight-soft),
    inset -1px -1px 3px rgba(0, 0, 0, 0.2),
    inset 0 -2px 8px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  transition: all 0.4s ease;
  z-index: 3;
}

.dock-glass-specular::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 8px;
  right: 60%;
  height: 12px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(3px);
  opacity: 0.9;
  transition: opacity 0.4s ease;
}

.dock-glass:hover .dock-glass-specular {
  box-shadow:
    inset 2px 2px 2px var(--lg-highlight),
    inset 4px 4px 10px var(--lg-highlight-soft),
    inset -1px -1px 4px rgba(0, 0, 0, 0.25),
    inset 0 -4px 12px rgba(0, 0, 0, 0.2);
}

.dock-glass:hover .dock-glass-specular::before {
  opacity: 1;
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

/* Separator between home and tools */
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

/* Home Dock Item */
.dock-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: bottom center;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.dock-item:hover {
  z-index: 10;
}

/* Dock Icon */
.dock-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.dock-item:hover .dock-icon {
  background: rgba(45, 45, 45, 1);
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 24px color-mix(in srgb, var(--tool-color, #22c55e) 30%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
}

.dock-item.is-active .dock-icon {
  background: color-mix(in srgb, var(--tool-color, #22c55e) 15%, rgba(0, 0, 0, 0.3));
  border-color: color-mix(in srgb, var(--tool-color, #22c55e) 30%, transparent);
  color: var(--tool-color, #22c55e);
  box-shadow:
    0 0 16px color-mix(in srgb, var(--tool-color, #22c55e) 20%, transparent),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.2);
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
    bottom: 8px;
    left: 8px;
    right: 8px;
    transform: none;
    max-width: none;
  }

  .dock-glass {
    border-radius: 14px;
    width: 100%;
  }

  .dock-glass-filter,
  .dock-glass-overlay,
  .dock-glass-specular {
    border-radius: 14px;
  }

  .dock-content {
    padding: 6px 8px;
    gap: 1px;
    justify-content: space-between;
    width: 100%;
  }

  .dock-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .dock-icon svg {
    width: 16px;
    height: 16px;
  }

  .dock-separator {
    height: 24px;
    margin: 0 4px;
  }

  .dock-active-dot {
    width: 3px;
    height: 3px;
    bottom: -4px;
  }

  .dock-item {
    transform: scale(1) !important;
    transition: transform 0.1s ease;
  }

  .dock-item:active {
    transform: scale(0.9) !important;
  }

  .dock-item:active .dock-icon {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* ===== RESPONSIVE - Very small screens ===== */
@media (max-width: 380px) {
  .dock-content {
    padding: 5px 6px;
  }

  .dock-icon {
    width: 32px;
    height: 32px;
    border-radius: 7px;
  }

  .dock-icon svg {
    width: 14px;
    height: 14px;
  }

  .dock-separator {
    height: 20px;
    margin: 0 3px;
  }

  .dock-active-dot {
    bottom: -3px;
  }
}
</style>
