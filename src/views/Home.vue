<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const isVisible = ref(false)
const threeCanvas = ref(null)

// Scroll tracking
const scrollY = ref(0)
const windowHeight = ref(0)

// Section refs
const heroSection = ref(null)
const toolsSection = ref(null)
const repoSection = ref(null)
const packagesSection = ref(null)

const onScroll = () => {
  scrollY.value = window.scrollY
}

// Get scroll progress for an element (0 = not visible, 1 = fully scrolled past)
const getScrollProgress = (el) => {
  if (!el || !windowHeight.value) return 0
  const rect = el.getBoundingClientRect()
  // Start when element enters viewport from bottom
  // End when element is at top of viewport
  const start = windowHeight.value
  const end = -rect.height * 0.3
  const progress = (start - rect.top) / (start - end)
  return Math.max(0, Math.min(1, progress))
}

// Hero parallax style - subtle movement
const heroStyle = computed(() => ({
  transform: `translateY(${scrollY.value * 0.1}px)`,
  opacity: Math.max(0, 1 - scrollY.value / 600)
}))

// Tool card style - alternates left/right by row, linked to scroll
const getToolCardStyle = (index) => {
  const progress = getScrollProgress(toolsSection.value)
  const row = Math.floor(index / 2)
  const isRowFromRight = row % 2 === 0 // Fila 0, 2, 4... desde derecha; 1, 3... desde izquierda
  
  // Stagger by row - balanced delay
  const rowDelay = row * 0.1
  const cardProgress = Math.max(0, Math.min(1, (progress - rowDelay) * 5))

  // Direction: right rows slide from +500px, left rows slide from -500px (from screen edges)
  // Starts invisible and fades in while sliding
  const direction = isRowFromRight ? 1 : -1
  const translateX = (1 - cardProgress) * 500 * direction

  return {
    opacity: cardProgress,
    transform: `translateX(${translateX}px)`,
    transition: 'none' // No transition, smooth via scroll
  }
}

// Repo card style - simple fade + slide (no rotation)
const repoStyle = computed(() => {
  const progress = getScrollProgress(repoSection.value)
  const eased = 1 - Math.pow(1 - progress, 3)

  return {
    opacity: Math.max(0.1, eased),
    transform: `translateY(${(1 - eased) * 30}px) scale(${0.95 + eased * 0.05})`
  }
})

// Package card style - staggered
const getPackageStyle = (index) => {
  const progress = getScrollProgress(packagesSection.value)
  const row = Math.floor(index / 3)
  const stagger = row * 0.1
  const itemProgress = Math.max(0, Math.min(1, (progress - stagger) * 1.5))
  return {
    opacity: itemProgress,
    transform: `translateY(${(1 - itemProgress) * 30}px)`
  }
}

// 3D Tilt + Magnetic effect for package cards
const packageCards = ref([])
const mousePos = ref({ x: 0, y: 0 })
const hoveredCard = ref(null)

const onPackageMouseMove = (e, index) => {
  const card = packageCards.value[index]
  if (!card) return

  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  // Calculate rotation (max 15deg)
  const rotateX = ((y - centerY) / centerY) * -15
  const rotateY = ((x - centerX) / centerX) * 15

  // Calculate shine position
  const shineX = (x / rect.width) * 100
  const shineY = (y / rect.height) * 100

  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
  card.style.setProperty('--shine-x', `${shineX}%`)
  card.style.setProperty('--shine-y', `${shineY}%`)
}

const onPackageMouseEnter = (index) => {
  hoveredCard.value = index
}

const onPackageMouseLeave = (index) => {
  const card = packageCards.value[index]
  if (!card) return

  hoveredCard.value = null
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
}

// Magnetic repulsion effect - track mouse in packages section
const onPackagesSectionMouseMove = (e) => {
  mousePos.value = { x: e.clientX, y: e.clientY }

  packageCards.value.forEach((card, index) => {
    if (!card || hoveredCard.value === index) return

    const rect = card.getBoundingClientRect()
    const cardCenterX = rect.left + rect.width / 2
    const cardCenterY = rect.top + rect.height / 2

    const deltaX = mousePos.value.x - cardCenterX
    const deltaY = mousePos.value.y - cardCenterY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Magnetic effect radius
    const maxDistance = 200

    if (distance < maxDistance) {
      const force = (1 - distance / maxDistance) * 8
      const moveX = -(deltaX / distance) * force
      const moveY = -(deltaY / distance) * force

      card.style.transform = `perspective(1000px) translateX(${moveX}px) translateY(${moveY}px)`
    } else {
      card.style.transform = 'perspective(1000px) translateX(0) translateY(0)'
    }
  })
}

const onPackagesSectionMouseLeave = () => {
  packageCards.value.forEach((card) => {
    if (!card) return
    card.style.transform = 'perspective(1000px) translateX(0) translateY(0)'
  })
}

let scene, camera, renderer, particles, animationId

const createCircleTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(32, 32, 32, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  return texture
}

const initThree = () => {
  if (!threeCanvas.value) return

  // Scene
  scene = new THREE.Scene()

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.z = 30

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: threeCanvas.value,
    alpha: true,
    antialias: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Circle texture for round particles
  const circleTexture = createCircleTexture()

  // Particles
  const particleCount = 300
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  const colorPalette = [
    new THREE.Color(0x22c55e), // green-500
    new THREE.Color(0x10b981), // emerald-500
    new THREE.Color(0x14b8a6), // teal-500
    new THREE.Color(0x059669), // emerald-600
  ]

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200
    positions[i * 3 + 1] = (Math.random() - 0.5) * 150
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b

    sizes[i] = Math.random() * 2 + 0.5
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    size: 1.5,
    map: circleTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // Animation
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    // Particles animate smoothly
    particles.rotation.y += 0.0003
    particles.rotation.x += 0.0001

    // Move camera based on scroll for parallax effect
    camera.position.y = -scrollY.value * 0.01
    camera.position.z = 30 + scrollY.value * 0.005

    // Subtle vertical bob animation
    const positions = particles.geometry.attributes.position.array
    const positionAttribute = particles.geometry.attributes.position
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.002
    }
    positionAttribute.needsUpdate = true

    renderer.render(scene, camera)
  }

  animate()

  // Resize handler
  window.addEventListener('resize', onResize)
}

const onResize = () => {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
  initThree()
  fetchGitHubCommits()
  fetchPackageStars()

  // Scroll tracking setup
  windowHeight.value = window.innerHeight
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', () => {
    windowHeight.value = window.innerHeight
  })
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll)
  if (renderer) renderer.dispose()
})

const tools = [
  {
    path: '/multimedia#image',
    name: 'Image Editor',
    description: 'Edita imágenes con filtros, recortes, ajustes de color y más herramientas profesionales.',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'blue',
    status: 'active'
  },
  {
    path: '/multimedia#audio',
    name: 'Audio Editor',
    description: 'Corta, une y aplica efectos a archivos de audio. Visualización de ondas en tiempo real.',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    color: 'purple',
    status: 'active'
  },
  {
    path: '/documents#pdf',
    name: 'PDF Editor',
    description: 'Combina, divide, rota y anota documentos PDF directamente en el navegador.',
    icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0 .83-.67 1.5-1.5 1.5H7v2H5.5V9H8c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V9H13c.83 0 1.5.67 1.5 1.5v3zm4-3H17v1h1.5V13H17v2h-1.5V9h3v1.5zM7 10.5h1v1H7v-1zm4 0h1v3h-1v-3z',
    color: 'red',
    status: 'active'
  },
  {
    path: '/documents#spreadsheet',
    name: 'Spreadsheet Editor',
    description: 'Editor de hojas de cálculo con estilos, fórmulas y exportación a Excel.',
    icon: 'M3 3h18v18H3V3zm16 4H5v12h14V7zM7 9h2v2H7V9zm0 4h2v2H7v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2zm4-4h2v2h-2V9zm0 4h2v2h-2v-2z',
    color: 'green',
    status: 'active'
  },
  {
    path: '/multimedia#3d',
    name: '3D Playground',
    description: 'Experimenta con gráficos 3D, shaders y visualizaciones interactivas.',
    icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
    color: 'green',
    status: 'active'
  },
  {
    path: '/technology#dev',
    name: 'Dev Tools',
    description: 'Formatea, valida y convierte JSON/YAML. Playground HTML/CSS/JS con preview en vivo.',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: 'cyan',
    status: 'active'
  },
  {
    path: '/multimedia#svg',
    name: 'SVG Editor',
    description: 'Crea y edita gráficos vectoriales SVG con herramientas profesionales de dibujo.',
    icon: 'M4 5a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 7.414V10a1 1 0 01-2 0V6a1 1 0 011-1zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V7.414l-2.293 2.293a1 1 0 01-1.414-1.414L16.586 6H14a1 1 0 010-2zM5 14a1 1 0 011 1v2.586l2.293-2.293a1 1 0 011.414 1.414L7.414 19H10a1 1 0 010 2H6a1 1 0 01-1-1v-4a1 1 0 011-1zm14 0a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h2.586l-2.293-2.293a1 1 0 011.414-1.414L19 16.586V15a1 1 0 011-1z',
    color: 'orange',
    status: 'active'
  },
  {
    path: '/unit-converter',
    name: 'Unit Converter',
    description: 'Convierte unidades de longitud, peso, temperatura, moneda y más. Tasas de cambio en tiempo real.',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    color: 'emerald',
    status: 'active'
  },
  {
    path: '/color-picker',
    name: 'Color Picker',
    description: 'Rueda de colores con armonías, paletas y exportación en múltiples formatos. Inspirado en Adobe Color.',
    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
    color: 'pink',
    status: 'active'
  },
  {
    path: '/cheatsheets',
    name: 'CheatSheets',
    description: 'Guías rápidas y cheatsheets de lenguajes, frameworks y herramientas de desarrollo.',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'green',
    status: 'active'
  },
  {
    path: '/documents#markdown',
    name: 'Markdown Editor',
    description: 'Editor de Markdown con preview en vivo. Exporta a HTML o descarga como .md',
    icon: 'M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zm8.56-1.98V8.81h-1.93v6.38h4.55v-1.98h-2.62z',
    color: 'blue',
    status: 'active'
  },
  {
    path: '/technology#phone',
    name: 'Phone Tester',
    description: 'Configura y prueba el componente de telefono SIP WebRTC. Genera codigo para Vue y React.',
    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    color: 'emerald',
    status: 'active'
  },
  {
    path: '/technology#security',
    name: 'CyberSecurity',
    description: 'JWT Debugger, Base64 Encoder/Decoder y Hash Generator. Herramientas de seguridad.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    color: 'red',
    status: 'active'
  }
]

const colorClasses = {
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'group-hover:shadow-purple-500/20',
    icon: 'group-hover:text-purple-400'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'group-hover:shadow-blue-500/20',
    icon: 'group-hover:text-blue-400'
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    glow: 'group-hover:shadow-red-500/20',
    icon: 'group-hover:text-red-400'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    glow: 'group-hover:shadow-green-500/20',
    icon: 'group-hover:text-green-400'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    glow: 'group-hover:shadow-cyan-500/20',
    icon: 'group-hover:text-cyan-400'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    glow: 'group-hover:shadow-orange-500/20',
    icon: 'group-hover:text-orange-400'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    glow: 'group-hover:shadow-emerald-500/20',
    icon: 'group-hover:text-emerald-400'
  },
  pink: {
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
    glow: 'group-hover:shadow-pink-500/20',
    icon: 'group-hover:text-pink-400'
  }
}

const packages = ref([
  {
    name: 'vuejs/core',
    description: 'The progressive JavaScript framework for building modern web UI.',
    url: 'https://github.com/vuejs/core',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'mrdoob/three.js',
    description: 'JavaScript 3D Library providing Canvas, SVG, CSS3D and WebGL renderers.',
    url: 'https://github.com/mrdoob/three.js',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'codemirror/dev',
    description: 'In-browser code editor with syntax highlighting, autocompletion and more.',
    url: 'https://github.com/codemirror/dev',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'nodeca/js-yaml',
    description: 'JavaScript YAML parser and serializer. Very fast.',
    url: 'https://github.com/nodeca/js-yaml',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'katspaugh/wavesurfer.js',
    description: 'Audio waveform player with real-time visualization.',
    url: 'https://github.com/katspaugh/wavesurfer.js',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'Hopding/pdf-lib',
    description: 'Create and modify PDF documents in any JavaScript environment.',
    url: 'https://github.com/Hopding/pdf-lib',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'tailwindlabs/tailwindcss',
    description: 'A utility-first CSS framework for rapid UI development.',
    url: 'https://github.com/tailwindlabs/tailwindcss',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'vitejs/vite',
    description: 'Next generation frontend tooling. It\'s fast!',
    url: 'https://github.com/vitejs/vite',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'mozilla/pdf.js',
    description: 'PDF.js is a PDF viewer built with HTML5.',
    url: 'https://github.com/mozilla/pdf.js',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'markedjs/marked',
    description: 'A markdown parser and compiler. Built for speed. Built for CommonMark.',
    url: 'https://github.com/markedjs/marked',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'cure53/DOMPurify',
    description: 'XSS sanitizer for HTML, MathML and SVG. Fast and easy to use.',
    url: 'https://github.com/cure53/DOMPurify',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'Tu-buen-camino/phone',
    description: 'Multi-framework SIP WebRTC phone component.',
    url: 'https://github.com/Tu-buen-camino/phone',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'exceljs/exceljs',
    description: 'Excel Workbook Manager. Read, manipulate and write XLSX and JSON.',
    url: 'https://github.com/exceljs/exceljs',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'vueuse/vueuse',
    description: 'Collection of essential Vue Composition Utilities.',
    url: 'https://github.com/vueuse/vueuse',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  }
])

const formatStars = (count) => {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return count?.toString() || ''
}

const fetchPackageStars = async () => {
  const results = await Promise.all(
    packages.value.map(async (pkg) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${pkg.name}`)
        const data = await res.json()
        return data.stargazers_count
      } catch {
        return null
      }
    })
  )

  packages.value = packages.value.map((pkg, i) => ({
    ...pkg,
    stars: results[i]
  }))
}

const recentCommits = ref([
  {
    message: 'Cargando commits...',
    hash: '',
    time: ''
  }
])

// Función para formatear tiempo relativo
const getRelativeTime = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'hace unos segundos'
  if (minutes < 60) return `hace ${minutes}m`
  if (hours < 24) return `hace ${hours}h`
  if (days < 7) return `hace ${days}d`
  if (days < 30) return `hace ${Math.floor(days / 7)}w`
  return `hace ${Math.floor(days / 30)}mo`
}

// Fetch commits desde GitHub API
const fetchGitHubCommits = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/christianpasinrey/tools/commits?per_page=10')
    const commits = await response.json()

    if (!Array.isArray(commits)) {
      console.error('Error fetching commits:', commits)
      return
    }

    recentCommits.value = commits.slice(0, 5).map(commit => ({
      message: commit.commit.message.split('\n')[0],
      hash: commit.sha.substring(0, 7),
      time: getRelativeTime(commit.commit.author.date),
      url: commit.html_url
    }))
  } catch (error) {
    console.error('Error fetching GitHub commits:', error)
  }
}
</script>

<template>
  <div class="min-h-screen relative overflow-x-clip">
    <!-- Three.js Canvas Background -->
    <canvas ref="threeCanvas" class="fixed inset-0 w-full h-full pointer-events-none" style="z-index: 0;"></canvas>

    <!-- Gradient Orbs with subtle parallax - fixed position so they don't get clipped -->
    <div class="fixed top-20 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" style="z-index: 0;" :style="{ transform: `translateY(${scrollY * 0.08}px)` }"></div>
    <div class="fixed top-40 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] animate-float pointer-events-none" style="z-index: 0;" :style="{ transform: `translateY(${scrollY * 0.12}px)` }"></div>
    <div class="fixed top-1/2 left-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-[80px] animate-pulse-slow pointer-events-none" style="z-index: 0; animation-delay: 1s;" :style="{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.15}px)` }"></div>

    <!-- Hero Section -->
    <div ref="heroSection" class="relative" style="z-index: 1;">

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40 text-center scroll-animated" :style="heroStyle">
        <!-- Badge -->
        <div
          :class="[
            'inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-xs mb-10 backdrop-blur-sm transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          ]"
        >
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span class="text-green-400 font-medium">100% en el navegador, sin servidores</span>
        </div>

        <!-- Title -->
        <h1
          :class="[
            'text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight transition-all duration-700 delay-100',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          ]"
        >
          Web <span class="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400">Tools</span>
        </h1>

        <!-- Subtitle -->
        <p
          :class="[
            'text-neutral-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-200',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          ]"
        >
          Herramientas open source que funcionan completamente en tu navegador.
          <br />
          <span class="text-neutral-300 text-sm">Sin servidores, sin tracking, privacidad total.</span>
        </p>

        <!-- Features -->
        <div
          :class="[
            'flex flex-wrap justify-center gap-8 text-sm transition-all duration-700 delay-300',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          ]"
        >
          <div class="flex items-center gap-2 text-neutral-400 group">
            <div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span>Privacidad total</span>
          </div>
          <div class="flex items-center gap-2 text-neutral-400 group">
            <div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span>Sin instalación</span>
          </div>
          <div class="flex items-center gap-2 text-neutral-400 group">
            <div class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <svg class="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span>Gratis y open source</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Tools Grid -->
    <div ref="toolsSection" class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40" style="z-index: 1;">
      <h2 class="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-8">
        Herramientas disponibles
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <router-link
          v-for="(tool, index) in tools"
          :key="tool.path"
          :to="tool.status === 'active' ? tool.path : '#'"
          :class="[
            'group relative overflow-hidden rounded-2xl p-6 transition-shadow duration-300',
            'bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50',
            'hover:border-neutral-700/50 hover:shadow-2xl',
            colorClasses[tool.color].glow,
            tool.status === 'active' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed',
            'scroll-animated'
          ]"
          :style="getToolCardStyle(index)"
        >
          <!-- Hover gradient overlay -->
          <div
            :class="[
              'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
              `bg-gradient-to-br from-${tool.color}-500/5 via-transparent to-transparent`
            ]"
          ></div>

          <!-- Glow effect on hover -->
          <div
            :class="[
              'absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl',
              `bg-${tool.color}-500/10`
            ]"
          ></div>

          <!-- Status Badge -->
          <div v-if="tool.status === 'coming'" class="absolute top-4 right-4 z-10">
            <span class="px-2.5 py-1 bg-neutral-800/80 text-neutral-400 text-[10px] font-medium rounded-full backdrop-blur-sm">Próximamente</span>
          </div>

          <div class="relative flex items-start gap-5">
            <!-- Icon -->
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300',
                'bg-neutral-800/80 border border-neutral-700/50',
                'group-hover:scale-110 group-hover:border-neutral-600/50',
                colorClasses[tool.color].bg
              ]"
            >
              <svg
                :class="[
                  'w-6 h-6 text-neutral-400 transition-colors duration-300',
                  colorClasses[tool.color].icon
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="tool.icon" />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3
                :class="[
                  'text-white font-semibold text-lg mb-2 transition-colors duration-300',
                  `group-hover:${colorClasses[tool.color].text}`
                ]"
              >
                {{ tool.name }}
              </h3>
              <p class="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-400 transition-colors duration-300">
                {{ tool.description }}
              </p>
            </div>

            <!-- Arrow -->
            <div
              v-if="tool.status === 'active'"
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300',
                'bg-neutral-800/50 group-hover:bg-neutral-700/50',
                'group-hover:translate-x-1'
              ]"
            >
              <svg
                :class="[
                  'w-4 h-4 text-neutral-500 transition-colors duration-300',
                  colorClasses[tool.color].icon
                ]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Repository Section -->
    <div ref="repoSection" class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32" style="z-index: 1;">
      <a
        href="https://github.com/christianpasinrey/tools"
        target="_blank"
        rel="noopener noreferrer"
        class="glass-container group block"
      >
        <div class="glass-filter"></div>
        <div class="glass-overlay"></div>
        <div class="glass-specular"></div>

        <div class="glass-content p-0">
          <div class="flex flex-col md:flex-row">
            <!-- Left: Repository Info -->
            <div class="flex-1 p-8 md:border-r border-white/5 flex flex-col">
              <!-- Header -->
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg class="w-6 h-6 text-white" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-white font-semibold text-lg group-hover:text-green-400 transition-colors">Web Tools</h3>
                    <p class="text-neutral-500 text-sm">christianpasinrey/tools</p>
                  </div>
                </div>
                <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg class="w-4 h-4 text-neutral-500 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </div>
              </div>

              <!-- Description -->
              <p class="text-neutral-400 text-base leading-relaxed mb-6">
                Herramientas útiles que funcionan
                <span class="text-green-400 font-medium">100% en tu navegador</span>.
                Sin servidores, sin uploads, privacidad total.
              </p>

              <!-- Features -->
              <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-500">
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Client-side only
                </span>
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  No registration
                </span>
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Open source
                </span>
              </div>

              <!-- Repository Stats -->
              <div class="grid grid-cols-2 gap-4 py-6 border-y border-white/5 my-6">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-400">{{ tools.length }}</div>
                  <div class="text-xs text-neutral-600 mt-1">Herramientas</div>
                </div>
                <a
                  href="https://github.com/christianpasinrey/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 transition-all group"
                  @click.stop
                >
                  <svg class="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span class="text-sm font-medium text-green-400 group-hover:text-green-300 transition-colors">Star</span>
                </a>
              </div>

              <!-- Tech stack - aligned bottom -->
              <div class="mt-auto pt-6 border-t border-white/5">
                <div class="flex items-center gap-5">
                  <!-- Vue -->
                  <div class="flex items-center gap-1.5 text-neutral-500 hover:text-[#42b883] transition-colors" title="Vue.js">
                    <svg class="w-5 h-5" viewBox="0 0 256 221" fill="currentColor">
                      <path d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0h47.36Z" fill-opacity="0.5"/>
                      <path d="M0 0l128 220.8L256 0h-51.2L128 132.48L50.56 0H0Z" fill-opacity="0.8"/>
                    </svg>
                  </div>
                  <!-- Vite -->
                  <div class="flex items-center gap-1.5 group/vite" title="Vite">
                    <svg class="w-5 h-5" viewBox="0 0 256 257" fill="none">
                      <path d="M255 38L135 256c-3 5-10 5-13 0L1 38c-3-6 1-13 8-12l120 22c1 0 3 0 4 0l114-22c7-1 11 6 8 12Z" class="fill-neutral-500 group-hover/vite:fill-[#646CFF] transition-colors"/>
                      <path d="M185 0L96 17c-2 0-3 2-3 4l-9 117c0 2 2 4 4 4l29-6c3-1 5 2 5 4l-9 45c0 3 2 5 5 4l18-5c3-1 5 2 5 4l-14 71c-1 4 5 6 7 2l1-2L227 63c1-3-1-6-4-5l-30 6c-3 0-5-2-4-5l17-55c1-3-1-5-4-5l-17 1Z" class="fill-neutral-500 group-hover/vite:fill-[#FFBD4F] transition-colors"/>
                    </svg>
                  </div>
                  <!-- Tailwind -->
                  <div class="flex items-center gap-1.5 text-neutral-500 hover:text-[#38bdf8] transition-colors" title="Tailwind CSS">
                    <svg class="w-5 h-5" viewBox="0 0 256 154" fill="currentColor">
                      <path d="M128 0Q85 0 64 43q32-22 64 0 16 11 24 33 19-43 64-43 43 0 64 43-32-22-64 0-16 11-24 33-19-43-64-43ZM64 77Q21 77 0 120q32-22 64 0 16 11 24 33 19-43 64-43 43 0 64 43-32-22-64 0-16 11-24 33-19-43-64-43Z"/>
                    </svg>
                  </div>
                  <!-- Three.js -->
                  <div class="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors" title="Three.js">
                    <svg class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M32 224L224 224L128 32L32 224ZM80 192L128 96L176 192L80 192Z" fill-opacity="0.7"/>
                    </svg>
                  </div>
                  <!-- CodeMirror -->
                  <div class="flex items-center gap-1.5 text-neutral-500 hover:text-[#d30707] transition-colors" title="CodeMirror">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill-opacity="0.7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Recent Commits -->
            <div class="flex-1 p-8 bg-white/[0.02]">
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Recent Activity</span>
              </div>

              <!-- Commit Timeline -->
              <div class="space-y-3">
                <a
                  v-for="(commit, i) in recentCommits"
                  :key="i"
                  :href="`https://github.com/christianpasinrey/tools/commit/${commit.hash}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="relative pl-6 group/commit block"
                  @click.stop
                >
                  <!-- Timeline line -->
                  <div class="absolute left-[7px] top-6 bottom-0 w-px bg-gradient-to-b from-green-500/30 to-transparent" v-if="i < recentCommits.length - 1"></div>
                  <!-- Dot -->
                  <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-green-500/50 bg-neutral-950 group-hover/commit:border-green-400 group-hover/commit:bg-green-500/20 transition-all">
                    <div class="absolute inset-1 rounded-full bg-green-500/50"></div>
                  </div>
                  <!-- Content -->
                  <div class="pb-3">
                    <p class="text-white/80 text-sm leading-snug mb-1 group-hover/commit:text-white transition-colors">{{ commit.message }}</p>
                    <div class="flex items-center gap-2 text-[10px] text-neutral-600">
                      <span class="font-mono text-green-500/70 group-hover/commit:text-green-400 transition-colors">{{ commit.hash }}</span>
                      <span>·</span>
                      <span>{{ commit.time }}</span>
                    </div>
                  </div>
                </a>
              </div>

              <!-- View all link -->
              <a
                href="https://github.com/christianpasinrey/tools/commits/main"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 pt-3 border-t border-white/5 block group/all"
                @click.stop
              >
                <span class="text-xs text-neutral-500 group-hover/all:text-green-400 transition-colors flex items-center gap-1">
                  View all commits
                  <svg class="w-3 h-3 group-hover/all:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </a>
    </div>

    <!-- Open Source Section -->
    <div ref="packagesSection" class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40" style="z-index: 1;">
      <div class="flex items-center gap-3 mb-8">
        <svg class="w-6 h-6 text-neutral-400" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
        </svg>
        <h2 class="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
          Powered by Open Source
        </h2>
      </div>

      <!-- SVG Filter for Liquid Glass -->
      <svg class="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="lensFilter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feDisplacementMap in="SourceGraphic" in2="blur" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr"
        @mousemove="onPackagesSectionMouseMove"
        @mouseleave="onPackagesSectionMouseLeave"
      >
        <a
          v-for="(pkg, index) in packages"
          :key="pkg.name"
          :ref="el => packageCards[index] = el"
          :href="pkg.url"
          target="_blank"
          rel="noopener noreferrer"
          class="glass-container group scroll-animated package-card-3d h-full"
          :style="getPackageStyle(index)"
          @mousemove="onPackageMouseMove($event, index)"
          @mouseenter="onPackageMouseEnter(index)"
          @mouseleave="onPackageMouseLeave(index)"
        >
          <!-- Liquid Glass Layers -->
          <div class="glass-filter"></div>
          <div class="glass-overlay"></div>
          <div class="glass-specular"></div>

          <!-- Glass content -->
          <div class="glass-content h-full flex flex-col">
            <!-- Repo Header -->
            <div class="flex items-start gap-3 mb-3">
              <svg class="w-4 h-4 text-white/60 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
              </svg>
              <span class="text-white/90 text-sm font-semibold group-hover:text-white truncate transition-colors">
                {{ pkg.name }}
              </span>
            </div>

            <!-- Description -->
            <p class="text-white/50 text-xs leading-relaxed mb-4 line-clamp-2 group-hover:text-white/70 transition-colors flex-1">
              {{ pkg.description }}
            </p>

            <!-- Footer -->
            <div class="flex items-center gap-4 text-xs text-white/40 mt-auto">
              <!-- Language -->
              <div class="flex items-center gap-1.5">
                <span
                  class="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                  :style="{ backgroundColor: pkg.languageColor }"
                ></span>
                <span>{{ pkg.language }}</span>
              </div>

              <!-- Stars -->
              <div v-if="pkg.stars" class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
                </svg>
                <span>{{ formatStars(pkg.stars) }}</span>
              </div>
            </div>
          </div>
        </a>
      </div>

      <!-- Footer Note -->
      <p class="text-center text-neutral-600 text-xs mt-8">
        Built with love using these amazing open source projects
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-20px) translateX(10px);
  }
  50% {
    transform: translateY(-10px) translateX(-10px);
  }
  75% {
    transform: translateY(-30px) translateX(5px);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-float {
  animation: float 12s ease-in-out infinite;
}

/* Scroll-linked animations */
.scroll-animated {
  will-change: transform, opacity;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* Liquid Glass Effect */
.glass-container {
  --lg-bg-color: rgba(30, 30, 30, 0.85);
  --lg-highlight: rgba(255, 255, 255, 0.35);
  --lg-highlight-soft: rgba(255, 255, 255, 0.12);
  --lg-border: rgba(255, 255, 255, 0.12);
  position: relative;
  border-radius: 24px;
  transition: box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s ease;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.glass-container:hover {
  --lg-bg-color: rgba(35, 35, 35, 0.9);
  --lg-highlight: rgba(255, 255, 255, 0.5);
  --lg-highlight-soft: rgba(255, 255, 255, 0.2);
}

/* Background blur + lens distortion filter */
.glass-filter {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  backdrop-filter: blur(12px) saturate(1.3);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
  filter: url(#lensFilter);
  z-index: 1;
}

/* Semi-transparent overlay */
.glass-overlay {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: var(--lg-bg-color);
  border: 1px solid var(--lg-border);
  transition: all 0.4s ease;
  z-index: 2;
}

.glass-container:hover .glass-overlay {
  border-color: rgba(34, 197, 94, 0.25);
  box-shadow:
    0 8px 32px rgba(34, 197, 94, 0.12),
    0 0 0 1px rgba(34, 197, 94, 0.08);
}

/* Specular highlights - the "liquid bubble" shine */
.glass-specular {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    var(--lg-highlight-soft) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.03) 100%
  );
  box-shadow:
    inset 1px 1px 1px var(--lg-highlight),
    inset 2px 2px 4px var(--lg-highlight-soft),
    inset -1px -1px 2px rgba(0, 0, 0, 0.15),
    inset 0 -2px 6px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  transition: all 0.4s ease;
  z-index: 3;
}

.glass-specular::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 12px;
  right: 50%;
  height: 20px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  border-radius: 50%;
  filter: blur(4px);
  opacity: 0.8;
  transition: opacity 0.4s ease;
}

.glass-container:hover .glass-specular::before {
  opacity: 1;
}

.glass-container:hover .glass-specular {
  box-shadow:
    inset 2px 2px 2px var(--lg-highlight),
    inset 3px 3px 8px var(--lg-highlight-soft),
    inset -1px -1px 3px rgba(0, 0, 0, 0.2),
    inset 0 -3px 10px rgba(0, 0, 0, 0.12);
}

/* Content layer */
.glass-content {
  position: relative;
  padding: 1.25rem;
  z-index: 4;
  height: 100%;
}

.glass-content.p-0 {
  padding: 0;
}

@keyframes glass-appear {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 3D Tilt + Magnetic effect for package cards */
.package-card-3d {
  --shine-x: 50%;
  --shine-y: 50%;
  transition: transform 0.15s ease-out, box-shadow 0.3s ease;
  transform-style: preserve-3d;
}

.package-card-3d::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: radial-gradient(
    circle at var(--shine-x) var(--shine-y),
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 20%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 10;
}

.package-card-3d:hover::after {
  opacity: 1;
}

.package-card-3d:hover {
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(34, 197, 94, 0.15);
  z-index: 10;
}
</style>
