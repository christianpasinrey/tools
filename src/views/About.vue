<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppCrypto } from '../composables/useAppCrypto'
import { useAuth } from '../composables/useAuth'
import { useDevice } from '../composables/useDevice'
import SyncAccountButton from '../components/common/SyncAccountButton.vue'
import { TASKS } from '../config/catalog'

const toolCount = TASKS.length

const appCrypto = useAppCrypto()
const auth = useAuth()
const { isMobile, platform } = useDevice()

const isVisible = ref(false)

// Efecto "descifrado" del titular: las letras se resuelven desde glifos
// aleatorios, en línea con la identidad de cifrado de la app
const HERO_WORD = 'tus datos'
const scrambledTitle = ref(HERO_WORD)
const SCRAMBLE_GLYPHS = '█▓▒░<>/\\{}[]#*+='

const runTitleDecode = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const total = 900
  const start = performance.now()
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / total)
    const settled = Math.floor(progress * HERO_WORD.length)
    scrambledTitle.value = HERO_WORD
      .split('')
      .map((ch, i) => {
        if (ch === ' ' || i < settled) return ch
        return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
      })
      .join('')
    if (progress < 1) requestAnimationFrame(tick)
    else scrambledTitle.value = HERO_WORD
  }
  requestAnimationFrame(tick)
}

// Scroll tracking
const scrollY = ref(0)
const windowHeight = ref(0)

// Section refs
const heroSection = ref(null)
const repoSection = ref(null)
const packagesSection = ref(null)
const backendSection = ref(null)

// El scroll de la app vive en #app-main, no en window
let scroller = null
const onScroll = () => {
  scrollY.value = scroller ? scroller.scrollTop : 0
}
const onResize = () => {
  windowHeight.value = window.innerHeight
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
  transform: `translateY(${scrollY.value * 0.1}px)`
}))

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

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
  setTimeout(runTitleDecode, 450)
  fetchGitHubCommits()
  fetchPackageStars()
  fetchBackendStars()

  // Scroll tracking setup
  windowHeight.value = window.innerHeight
  scroller = document.getElementById('app-main')
  scroller?.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  scroller?.removeEventListener('scroll', onScroll)
})

const packages = ref([
  // Build & tooling
  {
    name: 'vitejs/vite',
    description: 'Next generation frontend tooling. It\'s fast!',
    url: 'https://github.com/vitejs/vite',
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
  // Framework & ecosystem
  {
    name: 'vuejs/core',
    description: 'The progressive JavaScript framework for building modern web UI.',
    url: 'https://github.com/vuejs/core',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'vuejs/router',
    description: 'The official Router for Vue.js. Expressive and configurable.',
    url: 'https://github.com/vuejs/router',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'vueuse/vueuse',
    description: 'Collection of essential Vue Composition Utilities.',
    url: 'https://github.com/vueuse/vueuse',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  // Editors & code
  {
    name: 'codemirror/dev',
    description: 'In-browser code editor with syntax highlighting, autocompletion and more.',
    url: 'https://github.com/codemirror/dev',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  // 3D, maps & media
  {
    name: 'mrdoob/three.js',
    description: 'JavaScript 3D Library providing Canvas, SVG, CSS3D and WebGL renderers.',
    url: 'https://github.com/mrdoob/three.js',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'Leaflet/Leaflet',
    description: 'JavaScript library for mobile-friendly interactive maps.',
    url: 'https://github.com/Leaflet/Leaflet',
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
  // Document processing
  {
    name: 'mozilla/pdf.js',
    description: 'PDF.js is a PDF viewer built with HTML5.',
    url: 'https://github.com/mozilla/pdf.js',
    language: 'JavaScript',
    languageColor: '#f1e05a',
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
    name: 'exceljs/exceljs',
    description: 'Excel Workbook Manager. Read, manipulate and write XLSX and JSON.',
    url: 'https://github.com/exceljs/exceljs',
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
  // Utilities & security
  {
    name: 'nodeca/js-yaml',
    description: 'JavaScript YAML parser and serializer. Very fast.',
    url: 'https://github.com/nodeca/js-yaml',
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
  // Domain-specific
  {
    name: 'Tu-buen-camino/phone',
    description: 'Multi-framework SIP WebRTC phone component.',
    url: 'https://github.com/Tu-buen-camino/phone',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  }
])

const backendPackages = ref([
  {
    name: 'expressjs/express',
    description: 'Fast, unopinionated, minimalist web framework for Node.js.',
    url: 'https://github.com/expressjs/express',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'Automattic/mongoose',
    description: 'MongoDB object modeling designed to work in an asynchronous environment.',
    url: 'https://github.com/Automattic/mongoose',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'kelektiv/node.bcrypt.js',
    description: 'bcrypt for Node.js. Hash and compare passwords securely.',
    url: 'https://github.com/kelektiv/node.bcrypt.js',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'auth0/node-jsonwebtoken',
    description: 'JsonWebToken implementation for Node.js. Sign and verify tokens.',
    url: 'https://github.com/auth0/node-jsonwebtoken',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'helmetjs/helmet',
    description: 'Help secure Express apps with various HTTP headers.',
    url: 'https://github.com/helmetjs/helmet',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'expressjs/cors',
    description: 'Node.js CORS middleware for Express with various options.',
    url: 'https://github.com/expressjs/cors',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'express-rate-limit/express-rate-limit',
    description: 'Basic rate-limiting middleware for Express to limit repeated requests.',
    url: 'https://github.com/express-rate-limit/express-rate-limit',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'express-validator/express-validator',
    description: 'Express middleware for validator.js. Validate and sanitize inputs.',
    url: 'https://github.com/express-validator/express-validator',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: null
  },
  {
    name: 'motdotla/dotenv',
    description: 'Loads environment variables from .env file into process.env.',
    url: 'https://github.com/motdotla/dotenv',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'expressjs/cookie-parser',
    description: 'Parse Cookie header and populate req.cookies with an object.',
    url: 'https://github.com/expressjs/cookie-parser',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  },
  {
    name: 'nodemailer/nodemailer',
    description: 'Send emails from Node.js. Supports SMTP, SES, and more.',
    url: 'https://github.com/nodemailer/nodemailer',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: null
  }
])

const backendCards = ref([])
const hoveredBackendCard = ref(null)

const getBackendPackageStyle = (index) => {
  const progress = getScrollProgress(backendSection.value)
  const row = Math.floor(index / 3)
  const stagger = row * 0.1
  const itemProgress = Math.max(0, Math.min(1, (progress - stagger) * 1.5))
  return {
    opacity: itemProgress,
    transform: `translateY(${(1 - itemProgress) * 30}px)`
  }
}

const onBackendMouseMove = (e, index) => {
  const card = backendCards.value[index]
  if (!card) return
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  const rotateX = ((y - centerY) / centerY) * -15
  const rotateY = ((x - centerX) / centerX) * 15
  const shineX = (x / rect.width) * 100
  const shineY = (y / rect.height) * 100
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
  card.style.setProperty('--shine-x', `${shineX}%`)
  card.style.setProperty('--shine-y', `${shineY}%`)
}

const onBackendMouseEnter = (index) => {
  hoveredBackendCard.value = index
}

const onBackendMouseLeave = (index) => {
  const card = backendCards.value[index]
  if (!card) return
  hoveredBackendCard.value = null
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
}

const onBackendSectionMouseMove = (e) => {
  backendCards.value.forEach((card, index) => {
    if (!card || hoveredBackendCard.value === index) return
    const rect = card.getBoundingClientRect()
    const cardCenterX = rect.left + rect.width / 2
    const cardCenterY = rect.top + rect.height / 2
    const deltaX = e.clientX - cardCenterX
    const deltaY = e.clientY - cardCenterY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
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

const onBackendSectionMouseLeave = () => {
  backendCards.value.forEach((card) => {
    if (!card) return
    card.style.transform = 'perspective(1000px) translateX(0) translateY(0)'
  })
}

const fetchBackendStars = async () => {
  const results = await Promise.all(
    backendPackages.value.map(async (pkg) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${pkg.name}`)
        const data = await res.json()
        return data.stargazers_count
      } catch {
        return null
      }
    })
  )
  backendPackages.value = backendPackages.value.map((pkg, i) => ({
    ...pkg,
    stars: results[i]
  }))
}

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
  <div class="home-view about-view min-h-full relative overflow-x-clip pb-16 bg-tb-bg">

    <!-- Gradient Orbs with subtle parallax - fixed position so they don't get clipped -->
    <div class="fixed top-20 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-green-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" style="z-index: 0;" :style="{ transform: `translateY(${scrollY * 0.08}px)` }"></div>
    <div class="fixed top-40 right-1/4 w-80 h-80 bg-cyan-500/15 dark:bg-emerald-500/15 rounded-full blur-[100px] animate-float pointer-events-none" style="z-index: 0;" :style="{ transform: `translateY(${scrollY * 0.12}px)` }"></div>
    <div class="fixed top-1/2 left-1/2 w-72 h-72 bg-sky-500/10 dark:bg-teal-500/10 rounded-full blur-[80px] animate-pulse-slow pointer-events-none" style="z-index: 0; animation-delay: 1s;" :style="{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.15}px)` }"></div>

    <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" style="z-index: 1;">
      <router-link to="/" class="inline-flex items-center gap-2 text-sm font-ui text-tb-muted hover:text-tb-ink transition-colors">
        <span aria-hidden="true">←</span> Volver a las herramientas
      </router-link>
    </div>

    <!-- Hero Section -->
    <div ref="heroSection" class="relative" style="z-index: 1;">

      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 scroll-animated" :style="heroStyle">
        <div class="flex flex-col items-center text-center">

          <!-- Vault Visual -->
          <div
            :class="[
              'relative mb-10 transition-all duration-1000',
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            ]"
          >
            <!-- Outer ring -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-36 h-36 rounded-full border vault-ring-1" :class="appCrypto.isLocked.value ? 'border-amber-500/15' : 'border-emerald-500/15'"></div>
            </div>
            <!-- Inner ring -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-28 h-28 rounded-full border vault-ring-2" :class="appCrypto.isLocked.value ? 'border-amber-500/20' : 'border-emerald-500/20'"></div>
            </div>
            <!-- Dot orbit -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-32 h-32 vault-ring-3">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" :class="appCrypto.isLocked.value ? 'bg-amber-400/60' : 'bg-emerald-400/60'"></div>
              </div>
            </div>
            <!-- Center lock icon -->
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center relative transition-colors duration-700" :class="appCrypto.isLocked.value ? 'bg-amber-500/10' : 'bg-emerald-500/10'">
              <svg class="w-9 h-9 transition-all duration-700" :class="appCrypto.isLocked.value ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="appCrypto.isLocked.value || !auth.isAuthenticated.value" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <!-- Glow pulse when unlocked -->
              <div v-if="!appCrypto.isLocked.value && auth.isAuthenticated.value" class="absolute inset-0 rounded-2xl bg-emerald-500/15 animate-ping opacity-30"></div>
            </div>
          </div>

          <!-- Title -->
          <h1
            :class="[
              'text-4xl sm:text-5xl lg:text-6xl font-bold hero-title mb-5 tracking-tight transition-all duration-700 delay-150',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            ]"
          >
            Tu navegador, <span class="text-transparent bg-clip-text bg-gradient-to-r whitespace-nowrap" :class="auth.isAuthenticated.value && !appCrypto.isLocked.value ? 'from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400' : 'from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400'">{{ scrambledTitle }}</span>
          </h1>

          <!-- Subtitle -->
          <div
            :class="[
              'max-w-md mx-auto mb-8 transition-all duration-700 delay-200',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            ]"
          >
            <p class="hero-subtitle text-sm sm:text-base font-medium">Client-side AES-256-GCM encryption.</p>
            <p class="hero-muted text-xs sm:text-sm mt-1">Tus datos se cifran antes de salir del navegador. Sync entre dispositivos.</p>
          </div>

          <!-- Status indicator -->
          <div
            :class="[
              'transition-all duration-700 delay-300',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            ]"
          >
            <div v-if="!auth.isAuthenticated.value" class="flex flex-col items-center gap-4">
              <div class="flex items-center gap-3">
                <SyncAccountButton />
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border status-badge-inactive">
                  <span class="relative inline-flex rounded-full h-1.5 w-1.5 status-dot-inactive"></span>
                  Sin cuenta
                </div>
              </div>
              <p class="status-hint text-xs">Crea una cuenta para cifrar y sincronizar tus datos</p>
            </div>

            <div v-else class="flex flex-col items-center gap-4">
              <div class="flex items-center gap-3">
                <SyncAccountButton />
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border" :class="appCrypto.isLocked.value ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'">
                  <span class="relative flex h-1.5 w-1.5">
                    <span v-if="!appCrypto.isLocked.value" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-1.5 w-1.5" :class="appCrypto.isLocked.value ? 'bg-amber-400' : 'bg-emerald-400'"></span>
                  </span>
                  {{ appCrypto.isLocked.value ? 'Bloqueado' : 'Conectado' }}
                </div>
              </div>
              <p class="status-hint text-xs">{{ appCrypto.isLocked.value ? 'Inicia sesión para acceder a tus datos' : 'Sesión activa — datos cifrados y sincronizados' }}</p>
            </div>
          </div>

          <!-- Encrypted tools badges -->
          <div
            :class="[
              'flex flex-wrap justify-center gap-2 mt-10 transition-all duration-700 delay-[400ms]',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            ]"
          >
            <router-link to="/apps#invoice" class="badge-glass flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:text-emerald-600 dark:hover:text-emerald-400 transition-all">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Facturas
            </router-link>
            <router-link to="/apps#todo" class="badge-glass flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Kanban
            </router-link>
            <router-link to="/technology#browser-storage" class="badge-glass flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:text-purple-600 dark:hover:text-purple-400 transition-all">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
              Storage
            </router-link>
          </div>

          <!-- Educational section -->
          <div class="relative z-10 mt-20 max-w-3xl mx-auto px-4 w-full">

            <!-- Section title -->
            <div class="text-center mb-10">
              <p class="text-xs uppercase tracking-[0.2em] section-label mb-2">Modelo de confianza</p>
              <h2 class="text-xl sm:text-2xl font-bold section-title">¿Quién puede leer tus datos?</h2>
            </div>

            <!-- Comparison cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

              <!-- Traditional model card -->
              <div class="glass-card rounded-xl p-5 overflow-hidden">
                <div class="flex items-center gap-2.5 mb-4">
                  <div class="comparison-icon w-8 h-8 rounded-lg flex items-center justify-center">
                    <svg class="w-4.5 h-4.5 comparison-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
                    </svg>
                  </div>
                  <h3 class="text-sm font-bold comparison-title">Modelo tradicional</h3>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2 h-2 rounded-full bg-neutral-500 dark:bg-neutral-500 shrink-0"></span>
                    <span class="text-xs comparison-text">Tú, la empresa y quien ella autorice</span>
                  </div>
                  <p class="text-[11px] comparison-muted leading-relaxed pl-4">
                    Las apps cifran correctamente tu conexión y sus servidores. Pero la empresa gestiona las claves de cifrado — es su infraestructura. Pueden cumplir órdenes judiciales, sufrir brechas o cambiar sus políticas de privacidad.
                  </p>
                  <div class="mt-4 px-3 py-2.5 rounded-lg comparison-callout">
                    <p class="text-[11px] comparison-muted leading-relaxed">Tu privacidad depende de la confianza en un tercero.</p>
                  </div>
                </div>
              </div>

              <!-- This app card -->
              <div class="glass-card glass-card-emerald rounded-xl p-5 overflow-hidden">
                <div class="flex items-center gap-2.5 mb-4">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <svg class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <h3 class="text-sm font-bold text-emerald-700 dark:text-emerald-300">Zero-Knowledge</h3>
                </div>
                <div class="space-y-3">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span class="text-xs comparison-text">Solo tú</span>
                  </div>
                  <p class="text-[11px] comparison-muted leading-relaxed pl-4">
                    Tus datos se cifran con tu clave en el navegador antes de salir. El servidor sincroniza blobs cifrados entre tus dispositivos, pero no puede descifrarlos — nunca recibe tu password ni la clave de cifrado.
                  </p>
                  <div class="mt-4 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-600/30 dark:bg-emerald-950/60 dark:border-emerald-500/30">
                    <p class="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">Tu privacidad depende de la criptografía. No de la confianza.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Soft delete callout -->
            <div class="glass-card glass-card-amber rounded-xl p-5">
              <div class="flex items-start gap-4">
                <div class="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2">Cuando "borras" no borras</h3>
                  <p class="text-xs callout-text leading-relaxed">
                    La mayoría de apps usan <span class="text-amber-700 dark:text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">soft delete</span>: al pulsar "eliminar", solo marcan tus datos con una fecha (<span class="text-amber-700 dark:text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">deleted_at</span>) y los ocultan de tu vista. Siguen en sus servidores, accesibles para la empresa, indefinidamente.
                  </p>
                </div>
              </div>
            </div>

          </div>


        </div>
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
            <div class="flex-1 p-8 md:border-r repo-divider flex flex-col">
              <!-- Header -->
              <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg class="w-6 h-6 text-white" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="repo-title font-semibold text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Web Tools</h3>
                    <p class="repo-subtitle text-sm">christianpasinrey/tools</p>
                  </div>
                </div>
                <div class="w-8 h-8 rounded-full repo-icon-bg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg class="w-4 h-4 repo-icon group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </div>
              </div>

              <!-- Description -->
              <p class="repo-desc text-base leading-relaxed mb-6">
                Herramientas útiles que funcionan
                <span class="text-green-600 dark:text-green-400 font-medium">100% en tu navegador</span>.
                Sin servidores, sin uploads, privacidad total.
              </p>

              <!-- Features -->
              <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm repo-features">
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
              <div class="grid grid-cols-2 gap-4 py-6 repo-border my-6">
                <div class="text-center">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ toolCount }}</div>
                  <div class="text-xs repo-muted mt-1">Herramientas</div>
                </div>
                <a
                  href="https://github.com/christianpasinrey/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 transition-all group"
                  @click.stop
                >
                  <svg class="w-4 h-4 text-green-600 group-hover:text-green-700 dark:text-green-400 dark:group-hover:text-green-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span class="text-sm font-medium text-green-600 group-hover:text-green-700 dark:text-green-400 dark:group-hover:text-green-300 transition-colors">Star</span>
                </a>
              </div>

              <!-- Tech stack - aligned bottom -->
              <div class="mt-auto pt-6 tech-border">
                <div class="flex items-center gap-5">
                  <!-- Vue -->
                  <div class="flex items-center gap-1.5 tech-icon hover:text-[#42b883] transition-colors" title="Vue.js">
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
                  <div class="flex items-center gap-1.5 tech-icon hover:text-[#38bdf8] transition-colors" title="Tailwind CSS">
                    <svg class="w-5 h-5" viewBox="0 0 256 154" fill="currentColor">
                      <path d="M128 0Q85 0 64 43q32-22 64 0 16 11 24 33 19-43 64-43 43 0 64 43-32-22-64 0-16 11-24 33-19-43-64-43ZM64 77Q21 77 0 120q32-22 64 0 16 11 24 33 19-43 64-43 43 0 64 43-32-22-64 0-16 11-24 33-19-43-64-43Z"/>
                    </svg>
                  </div>
                  <!-- Three.js -->
                  <div class="flex items-center gap-1.5 tech-icon hover:text-white transition-colors" title="Three.js">
                    <svg class="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M32 224L224 224L128 32L32 224ZM80 192L128 96L176 192L80 192Z" fill-opacity="0.7"/>
                    </svg>
                  </div>
                  <!-- CodeMirror -->
                  <div class="flex items-center gap-1.5 tech-icon hover:text-[#d30707] transition-colors" title="CodeMirror">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill-opacity="0.7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Recent Commits -->
            <div class="flex-1 p-8 commits-section">
              <div class="flex items-center gap-2 mb-4">
                <svg class="w-4 h-4 commits-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-xs font-medium commits-label uppercase tracking-wider">Recent Activity</span>
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
                  <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-green-500/50 commit-dot group-hover/commit:border-green-400 group-hover/commit:bg-green-500/20 transition-all">
                    <div class="absolute inset-1 rounded-full bg-green-500/50"></div>
                  </div>
                  <!-- Content -->
                  <div class="pb-3">
                    <p class="commit-message text-sm leading-snug mb-1 group-hover/commit:text-green-600 dark:group-hover/commit:text-green-400 transition-colors">{{ commit.message }}</p>
                    <div class="flex items-center gap-2 text-[10px] commit-meta">
                      <span class="font-mono text-green-700/70 dark:text-green-500/70 group-hover/commit:text-green-600 dark:group-hover/commit:text-green-400 transition-colors">{{ commit.hash }}</span>
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
                class="mt-3 pt-3 commits-border block group/all"
                @click.stop
              >
                <span class="text-xs commits-link group-hover/all:text-green-600 dark:group-hover/all:text-green-400 transition-colors flex items-center gap-1">
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
        <svg class="w-6 h-6 section-icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
        </svg>
        <h2 class="text-xs font-semibold section-label uppercase tracking-widest">
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
              <svg class="w-4 h-4 pkg-icon mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
              </svg>
              <span class="pkg-title text-sm font-semibold truncate transition-colors">
                {{ pkg.name }}
              </span>
            </div>

            <!-- Description -->
            <p class="pkg-desc text-xs leading-relaxed mb-4 line-clamp-2 transition-colors flex-1">
              {{ pkg.description }}
            </p>

            <!-- Footer -->
            <div class="flex items-center gap-4 text-xs pkg-meta mt-auto">
              <!-- Language -->
              <div class="flex items-center gap-1.5">
                <span
                  class="w-2.5 h-2.5 rounded-full pkg-ring"
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
      <p class="text-center footer-note text-xs mt-8">
        Built with love using these amazing open source projects
      </p>
    </div>

    <!-- Backend & Sync Architecture Section -->
    <div ref="backendSection" class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40" style="z-index: 1;">

      <!-- Section Header -->
      <div class="flex items-center gap-3 mb-4">
        <svg class="w-6 h-6 section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        <h2 class="text-xs font-semibold section-label uppercase tracking-widest">
          Zero-Knowledge Sync
        </h2>
      </div>

      <!-- Architecture Explanation -->
      <div class="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- How it works card -->
        <div class="arch-card rounded-2xl p-6">
          <h3 class="arch-title font-semibold text-base mb-4">Cómo se guardan tus datos</h3>
          <div class="space-y-3">
            <div class="flex items-start gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5">1</span>
              <p class="arch-text text-sm">Tu password genera una <span class="text-emerald-600 dark:text-emerald-400 font-mono text-xs">AES-256-GCM key</span> via PBKDF2 (100k iteraciones)</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5">2</span>
              <p class="arch-text text-sm">Los datos se cifran <span class="arch-highlight font-medium">en el navegador</span> antes de guardarse en IndexedDB</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5">3</span>
              <p class="arch-text text-sm">Los blobs cifrados <span class="arch-code font-mono text-xs">{salt, iv, data}</span> se sincronizan al servidor</p>
            </div>
            <div class="flex items-start gap-3">
              <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5">4</span>
              <p class="arch-text text-sm">El servidor <span class="text-amber-600 dark:text-amber-400 font-medium">nunca</span> recibe tu password ni puede descifrar nada</p>
            </div>
          </div>
        </div>

        <!-- Technical details card -->
        <div class="arch-card rounded-2xl p-6">
          <h3 class="arch-title font-semibold text-base mb-4">Detalles técnicos</h3>
          <div class="space-y-2.5">
            <div class="flex items-center justify-between py-1.5 arch-row">
              <span class="arch-label text-xs">Cifrado</span>
              <span class="arch-value text-xs font-mono">AES-256-GCM</span>
            </div>
            <div class="flex items-center justify-between py-1.5 arch-row">
              <span class="arch-label text-xs">Key derivation</span>
              <span class="arch-value text-xs font-mono">PBKDF2 (100k iter)</span>
            </div>
            <div class="flex items-center justify-between py-1.5 arch-row">
              <span class="arch-label text-xs">Auth tokens</span>
              <span class="arch-value text-xs font-mono">JWT (15min + 7d refresh)</span>
            </div>
            <div class="flex items-center justify-between py-1.5 arch-row">
              <span class="arch-label text-xs">Password hash (server)</span>
              <span class="arch-value text-xs font-mono">bcrypt (12 rounds)</span>
            </div>
            <div class="flex items-center justify-between py-1.5 arch-row">
              <span class="arch-label text-xs">Conflictos</span>
              <span class="arch-value text-xs font-mono">Last-Write-Wins</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="arch-label text-xs">Offline</span>
              <span class="arch-value text-xs font-mono">Cola en localStorage</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Backend Packages Mosaic -->
      <div class="flex items-center gap-2 mb-6">
        <svg class="w-4 h-4 section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
        </svg>
        <span class="text-xs section-label uppercase tracking-wider font-medium">Backend Stack</span>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr"
        @mousemove="onBackendSectionMouseMove"
        @mouseleave="onBackendSectionMouseLeave"
      >
        <a
          v-for="(pkg, index) in backendPackages"
          :key="pkg.name"
          :ref="el => backendCards[index] = el"
          :href="pkg.url"
          target="_blank"
          rel="noopener noreferrer"
          class="glass-container group scroll-animated package-card-3d h-full"
          :style="getBackendPackageStyle(index)"
          @mousemove="onBackendMouseMove($event, index)"
          @mouseenter="onBackendMouseEnter(index)"
          @mouseleave="onBackendMouseLeave(index)"
        >
          <!-- Liquid Glass Layers -->
          <div class="glass-filter"></div>
          <div class="glass-overlay"></div>
          <div class="glass-specular"></div>

          <!-- Glass content -->
          <div class="glass-content h-full flex flex-col">
            <!-- Repo Header -->
            <div class="flex items-start gap-3 mb-3">
              <svg class="w-4 h-4 pkg-icon mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
              </svg>
              <span class="pkg-title text-sm font-semibold truncate transition-colors">
                {{ pkg.name }}
              </span>
            </div>

            <!-- Description -->
            <p class="pkg-desc text-xs leading-relaxed mb-4 line-clamp-2 transition-colors flex-1">
              {{ pkg.description }}
            </p>

            <!-- Footer -->
            <div class="flex items-center gap-4 text-xs pkg-meta mt-auto">
              <!-- Language -->
              <div class="flex items-center gap-1.5">
                <span
                  class="w-2.5 h-2.5 rounded-full pkg-ring"
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

      <p class="text-center footer-note text-xs mt-8">
        Sync API powered by these open source projects
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

/* Liquid Glass Effect - Dark mode (default, same as MobileDock) */
.glass-container {
  position: relative;
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
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

.glass-container::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 9999px;
  z-index: 5;
}

.glass-container:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(34, 197, 94, 0.15);
}

/* Light mode */
:global(html:not(.dark) .home-view .glass-container) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark) .home-view .glass-container::before) {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
}

:global(html:not(.dark) .home-view .glass-container:hover) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border-color: rgba(34, 197, 94, 0.3);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 20px rgba(34, 197, 94, 0.1);
}

/* Hide extra glass layers - not needed with new approach */
.glass-filter,
.glass-overlay,
.glass-specular {
  display: none;
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

/* Text colors - Dark mode (default) */
.glass-container .text-white\/90,
.glass-container .text-white\/80,
.glass-container .text-white {
  color: rgba(255, 255, 255, 0.9);
}

.glass-container .text-white\/60,
.glass-container .text-white\/50 {
  color: rgba(255, 255, 255, 0.6);
}

.glass-container .text-white\/40 {
  color: rgba(255, 255, 255, 0.5);
}

/* Text colors - Light mode */
:global(html:not(.dark) .home-view .glass-container .text-white\/90),
:global(html:not(.dark) .home-view .glass-container .text-white\/80),
:global(html:not(.dark) .home-view .glass-container .text-white) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .glass-container .text-white\/60),
:global(html:not(.dark) .home-view .glass-container .text-white\/50) {
  color: rgba(0, 0, 0, 0.6);
}

:global(html:not(.dark) .home-view .glass-container .text-white\/40) {
  color: rgba(0, 0, 0, 0.5);
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

/* Vault ring animations */
@keyframes vault-spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes vault-spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes vault-orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.vault-ring-1 {
  animation: vault-spin-slow 20s linear infinite;
}

.vault-ring-2 {
  animation: vault-spin-reverse 14s linear infinite;
}

.vault-ring-3 {
  animation: vault-orbit 8s linear infinite;
  position: relative;
}

/* Tool Cards - Dark mode (default) */
.tool-card {
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

.tool-card::before {
  content: '';
  position: absolute;
  top: 1px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  border-radius: 9999px;
}

.tool-card:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.3),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3);
}

.tool-icon {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.tool-icon-svg {
  color: rgba(255, 255, 255, 0.6);
}

.tool-title {
  color: rgba(255, 255, 255, 0.9);
}

.tool-description {
  color: rgba(255, 255, 255, 0.5);
}

.tool-card:hover .tool-description {
  color: rgba(255, 255, 255, 0.7);
}

.tool-arrow {
  background: rgba(255, 255, 255, 0.08);
}

.tool-card:hover .tool-arrow {
  background: rgba(255, 255, 255, 0.12);
}

.tool-arrow-svg {
  color: rgba(255, 255, 255, 0.5);
}

/* Tool Cards - Light mode */
:global(html:not(.dark) .home-view .tool-card) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 4px 20px rgba(0, 0, 0, 0.1),
    0 0 0 0.5px rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark) .home-view .tool-card::before) {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
}

:global(html:not(.dark) .home-view .tool-card:hover) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.95),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 8px 32px rgba(0, 0, 0, 0.12);
}

:global(html:not(.dark) .home-view .tool-icon) {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

:global(html:not(.dark) .home-view .tool-icon-svg) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .tool-title) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .tool-description) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .tool-card:hover .tool-description) {
  color: rgba(0, 0, 0, 0.7);
}

:global(html:not(.dark) .home-view .tool-arrow) {
  background: rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark) .home-view .tool-card:hover .tool-arrow) {
  background: rgba(0, 0, 0, 0.08);
}

:global(html:not(.dark) .home-view .tool-arrow-svg) {
  color: rgba(0, 0, 0, 0.5);
}

/* Tinte del borde con el color de cada herramienta al hacer hover */
.tool-card:hover {
  border-color: color-mix(in srgb, var(--tool-color, #ffffff) 40%, rgba(255, 255, 255, 0.1));
}

:global(html:not(.dark) .home-view .tool-card:hover) {
  border-color: color-mix(in srgb, var(--tool-color, #000000) 40%, rgba(0, 0, 0, 0.04));
}

/* Comparison Cards - textos y elementos internos */

.comparison-icon {
  background: rgba(255, 255, 255, 0.08);
}

.comparison-icon-svg {
  color: rgba(255, 255, 255, 0.6);
}

.comparison-title {
  color: rgba(255, 255, 255, 0.85);
}

.comparison-text {
  color: rgba(255, 255, 255, 0.75);
}

.comparison-muted {
  color: rgba(255, 255, 255, 0.5);
}

.comparison-callout {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Comparison Cards - Light mode textos */

:global(html:not(.dark) .home-view .comparison-icon) {
  background: rgba(0, 0, 0, 0.05);
}

:global(html:not(.dark) .home-view .comparison-icon-svg) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .comparison-title) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .comparison-text) {
  color: rgba(0, 0, 0, 0.75);
}

:global(html:not(.dark) .home-view .comparison-muted) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .comparison-callout) {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Callout text colors */
.callout-text {
  color: rgba(255, 255, 255, 0.75);
}

:global(html:not(.dark) .home-view .callout-text) {
  color: rgba(0, 0, 0, 0.75);
}

/* Architecture Cards - Dark mode (default) */
.arch-card {
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
    0 4px 20px rgba(0, 0, 0, 0.2);
}

.arch-title {
  color: rgba(255, 255, 255, 0.9);
}

.arch-text {
  color: rgba(255, 255, 255, 0.6);
}

.arch-highlight {
  color: rgba(255, 255, 255, 0.9);
}

.arch-code {
  color: rgba(255, 255, 255, 0.75);
}

.arch-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.arch-label {
  color: rgba(255, 255, 255, 0.5);
}

.arch-value {
  color: rgba(255, 255, 255, 0.75);
}

/* Architecture Cards - Light mode */
:global(html:not(.dark) .home-view .arch-card) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.75) 50%,
    rgba(255, 255, 255, 0.85) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 4px 20px rgba(0, 0, 0, 0.1);
}

:global(html:not(.dark) .home-view .arch-title) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .arch-text) {
  color: rgba(0, 0, 0, 0.6);
}

:global(html:not(.dark) .home-view .arch-highlight) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .arch-code) {
  color: rgba(0, 0, 0, 0.7);
}

:global(html:not(.dark) .home-view .arch-row) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:global(html:not(.dark) .home-view .arch-label) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .arch-value) {
  color: rgba(0, 0, 0, 0.7);
}

/* Badge Glass - Dark mode (default) */
.badge-glass {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  -webkit-backdrop-filter: blur(16px) saturate(1.6);
  backdrop-filter: blur(16px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.6);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.15),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.15);
}

.badge-glass:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  border-color: rgba(255, 255, 255, 0.2);
}

/* Badge Glass - Light mode */
:global(html:not(.dark) .home-view .badge-glass) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 255, 255, 0.7) 50%,
    rgba(255, 255, 255, 0.8) 100%
  );
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.6);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.85),
    inset 0 -1px 1px rgba(0, 0, 0, 0.03),
    0 2px 8px rgba(0, 0, 0, 0.08);
}

:global(html:not(.dark) .home-view .badge-glass:hover) {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(255, 255, 255, 0.9) 100%
  );
  border-color: rgba(0, 0, 0, 0.12);
}

/* Hero text - Dark mode (default) */
.hero-title {
  color: rgba(255, 255, 255, 0.95);
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.6);
}

.hero-muted {
  color: rgba(255, 255, 255, 0.4);
}

.section-title {
  color: rgba(255, 255, 255, 0.9);
}

.section-label {
  color: rgba(255, 255, 255, 0.5);
}

/* Hero text - Light mode */
:global(html:not(.dark) .home-view .hero-title) {
  color: rgba(0, 0, 0, 0.9);
}

:global(html:not(.dark) .home-view .hero-subtitle) {
  color: rgba(0, 0, 0, 0.6);
}

:global(html:not(.dark) .home-view .hero-muted) {
  color: rgba(0, 0, 0, 0.45);
}

:global(html:not(.dark) .home-view .section-title) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .section-label) {
  color: rgba(0, 0, 0, 0.5);
}

/* Section icons and footer - Dark mode (default) */
.section-icon {
  color: rgba(255, 255, 255, 0.5);
}

.footer-note {
  color: rgba(255, 255, 255, 0.4);
}

/* Section icons and footer - Light mode */
:global(html:not(.dark) .home-view .section-icon) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .footer-note) {
  color: rgba(0, 0, 0, 0.45);
}

/* Package card text - Dark mode (default) */
.pkg-icon {
  color: rgba(255, 255, 255, 0.6);
}

.pkg-title {
  color: rgba(255, 255, 255, 0.9);
}

.glass-container:hover .pkg-title {
  color: rgba(255, 255, 255, 1);
}

.pkg-desc {
  color: rgba(255, 255, 255, 0.55);
}

.glass-container:hover .pkg-desc {
  color: rgba(255, 255, 255, 0.75);
}

.pkg-meta {
  color: rgba(255, 255, 255, 0.45);
}

.pkg-ring {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

/* Package card text - Light mode */
:global(html:not(.dark) .home-view .pkg-icon) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .pkg-title) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .glass-container:hover .pkg-title) {
  color: rgba(0, 0, 0, 1);
}

:global(html:not(.dark) .home-view .pkg-desc) {
  color: rgba(0, 0, 0, 0.55);
}

:global(html:not(.dark) .home-view .glass-container:hover .pkg-desc) {
  color: rgba(0, 0, 0, 0.75);
}

:global(html:not(.dark) .home-view .pkg-meta) {
  color: rgba(0, 0, 0, 0.45);
}

:global(html:not(.dark) .home-view .pkg-ring) {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
}

/* Repository card text - Dark mode (default) */
.repo-title {
  color: rgba(255, 255, 255, 0.9);
}

.repo-subtitle {
  color: rgba(255, 255, 255, 0.5);
}

.repo-desc {
  color: rgba(255, 255, 255, 0.6);
}

.repo-features {
  color: rgba(255, 255, 255, 0.6);
}

.repo-border {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.repo-muted {
  color: rgba(255, 255, 255, 0.5);
}

.repo-icon {
  color: rgba(255, 255, 255, 0.5);
}

.repo-icon-bg {
  background: rgba(255, 255, 255, 0.08);
}

/* Repository card text - Light mode */
:global(html:not(.dark) .home-view .repo-title) {
  color: rgba(0, 0, 0, 0.85);
}

:global(html:not(.dark) .home-view .repo-subtitle) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .repo-desc) {
  color: rgba(0, 0, 0, 0.6);
}

:global(html:not(.dark) .home-view .repo-features) {
  color: rgba(0, 0, 0, 0.6);
}

:global(html:not(.dark) .home-view .repo-border) {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

:global(html:not(.dark) .home-view .repo-muted) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .repo-icon) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .repo-icon-bg) {
  background: rgba(0, 0, 0, 0.06);
}

/* Commits section - Dark mode (default) */
.commits-section {
  background: rgba(255, 255, 255, 0.02);
}

.commits-icon {
  color: rgba(255, 255, 255, 0.5);
}

.commits-label {
  color: rgba(255, 255, 255, 0.5);
}

.commit-dot {
  background: rgba(23, 23, 23, 1);
}

.commit-message {
  color: rgba(255, 255, 255, 0.8);
}

.commit-meta {
  color: rgba(255, 255, 255, 0.4);
}

.commits-border {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.commits-link {
  color: rgba(255, 255, 255, 0.5);
}

/* Commits section - Light mode */
:global(html:not(.dark) .home-view .commits-section) {
  background: rgba(0, 0, 0, 0.02);
}

:global(html:not(.dark) .home-view .commits-icon) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .commits-label) {
  color: rgba(0, 0, 0, 0.5);
}

:global(html:not(.dark) .home-view .commit-dot) {
  background: rgba(250, 250, 250, 1);
}

:global(html:not(.dark) .home-view .commit-message) {
  color: rgba(0, 0, 0, 0.75);
}

:global(html:not(.dark) .home-view .commit-meta) {
  color: rgba(0, 0, 0, 0.45);
}

:global(html:not(.dark) .home-view .commits-border) {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

:global(html:not(.dark) .home-view .commits-link) {
  color: rgba(0, 0, 0, 0.5);
}

/* Repo divider and tech stack - Dark mode (default) */
.repo-divider {
  border-color: rgba(255, 255, 255, 0.08);
}

.tech-border {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.tech-icon {
  color: rgba(255, 255, 255, 0.5);
}

/* Repo divider and tech stack - Light mode */
:global(html:not(.dark) .home-view .repo-divider) {
  border-color: rgba(0, 0, 0, 0.08);
}

:global(html:not(.dark) .home-view .tech-border) {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

:global(html:not(.dark) .home-view .tech-icon) {
  color: rgba(0, 0, 0, 0.5);
}

/* Status badges - Dark mode (default) */
.status-badge-inactive {
  background: rgba(38, 38, 38, 0.5);
  color: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
}

.status-dot-inactive {
  background: rgba(255, 255, 255, 0.4);
}

.status-hint {
  color: rgba(255, 255, 255, 0.4);
}

.coming-soon-badge {
  background: rgba(38, 38, 38, 0.8);
  color: rgba(255, 255, 255, 0.5);
}

/* Status badges - Light mode */
:global(html:not(.dark) .home-view .status-badge-inactive) {
  background: rgba(220, 220, 220, 0.5);
  color: rgba(0, 0, 0, 0.5);
  border-color: rgba(0, 0, 0, 0.15);
}

:global(html:not(.dark) .home-view .status-dot-inactive) {
  background: rgba(0, 0, 0, 0.4);
}

:global(html:not(.dark) .home-view .status-hint) {
  color: rgba(0, 0, 0, 0.45);
}

:global(html:not(.dark) .home-view .coming-soon-badge) {
  background: rgba(220, 220, 220, 0.8);
  color: rgba(0, 0, 0, 0.5);
}
</style>
