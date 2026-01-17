<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const isVisible = ref(false)
const threeCanvas = ref(null)

let scene, camera, renderer, particles, animationId

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

  // Particles
  const particleCount = 200
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
    positions[i * 3] = (Math.random() - 0.5) * 100
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50

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
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // Animation
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    particles.rotation.y += 0.0003
    particles.rotation.x += 0.0001

    const positions = particles.geometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.002
    }
    particles.geometry.attributes.position.needsUpdate = true

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
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
})

const tools = [
  {
    path: '/audio-editor',
    name: 'Audio Editor',
    description: 'Corta, une y aplica efectos a archivos de audio. Visualización de ondas en tiempo real.',
    icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
    color: 'purple',
    status: 'active'
  },
  {
    path: '/image-editor',
    name: 'Image Editor',
    description: 'Edita imágenes con filtros, recortes, ajustes de color y más herramientas profesionales.',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'blue',
    status: 'active'
  },
  {
    path: '/pdf-editor',
    name: 'PDF Editor',
    description: 'Combina, divide, rota y anota documentos PDF directamente en el navegador.',
    icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    color: 'red',
    status: 'active'
  },
  {
    path: '/3d-playground',
    name: '3D Playground',
    description: 'Experimenta con gráficos 3D, shaders y visualizaciones interactivas.',
    icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
    color: 'green',
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
  }
}

const packages = [
  {
    name: 'vuejs/core',
    description: 'The progressive JavaScript framework for building modern web UI.',
    url: 'https://github.com/vuejs/core',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: '48.2k'
  },
  {
    name: 'mrdoob/three.js',
    description: 'JavaScript 3D Library providing Canvas, SVG, CSS3D and WebGL renderers.',
    url: 'https://github.com/mrdoob/three.js',
    language: 'JavaScript',
    languageColor: '#f1e05a',
    stars: '103k'
  },
  {
    name: 'katspaugh/wavesurfer.js',
    description: 'Audio waveform player with real-time visualization.',
    url: 'https://github.com/katspaugh/wavesurfer.js',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: '9.2k'
  },
  {
    name: 'Hopding/pdf-lib',
    description: 'Create and modify PDF documents in any JavaScript environment.',
    url: 'https://github.com/Hopding/pdf-lib',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: '7.1k'
  },
  {
    name: 'tailwindlabs/tailwindcss',
    description: 'A utility-first CSS framework for rapid UI development.',
    url: 'https://github.com/tailwindlabs/tailwindcss',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: '86k'
  },
  {
    name: 'vitejs/vite',
    description: 'Next generation frontend tooling. It\'s fast!',
    url: 'https://github.com/vitejs/vite',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: '70.5k'
  }
]
</script>

<template>
  <div class="min-h-screen relative">
    <!-- Three.js Canvas Background -->
    <canvas ref="threeCanvas" class="fixed inset-0 w-full h-full pointer-events-none" style="z-index: 0;"></canvas>

    <!-- Hero Section -->
    <div class="relative overflow-hidden" style="z-index: 1;">
      <!-- Gradient Orbs -->
      <div class="absolute top-20 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div class="absolute top-40 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] animate-float"></div>
      <div class="absolute -bottom-20 left-1/2 w-72 h-72 bg-teal-500/10 rounded-full blur-[80px] animate-pulse-slow" style="animation-delay: 1s;"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
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
          Herramientas profesionales de edición que funcionan completamente en tu navegador.
          <span class="text-neutral-300">Sin subir archivos, sin registro, sin límites.</span>
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
    <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" style="z-index: 1;">
      <h2
        :class="[
          'text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-8 transition-all duration-700 delay-400',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        ]"
      >
        Herramientas disponibles
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <router-link
          v-for="(tool, index) in tools"
          :key="tool.path"
          :to="tool.status === 'active' ? tool.path : '#'"
          :class="[
            'group relative overflow-hidden rounded-2xl p-6 transition-all duration-500',
            'bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50',
            'hover:border-neutral-700/50 hover:shadow-2xl hover:-translate-y-1',
            colorClasses[tool.color].glow,
            tool.status === 'active' ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          ]"
          :style="{ transitionDelay: `${500 + index * 100}ms` }"
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

    <!-- Open Source Section -->
    <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24" style="z-index: 1;">
      <div class="flex items-center gap-3 mb-8">
        <svg class="w-6 h-6 text-neutral-400" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
        </svg>
        <h2 class="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
          Powered by Open Source
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a
          v-for="(pkg, index) in packages"
          :key="pkg.name"
          :href="pkg.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="[
            'group block p-4 rounded-lg border transition-all duration-300',
            'bg-[#0d1117] border-[#30363d] hover:border-[#8b949e]',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          ]"
          :style="{ transitionDelay: `${900 + index * 75}ms` }"
        >
          <!-- Repo Header -->
          <div class="flex items-start gap-3 mb-3">
            <svg class="w-4 h-4 text-[#8b949e] mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
            </svg>
            <span class="text-[#58a6ff] text-sm font-semibold group-hover:underline truncate">
              {{ pkg.name }}
            </span>
          </div>

          <!-- Description -->
          <p class="text-[#8b949e] text-xs leading-relaxed mb-4 line-clamp-2">
            {{ pkg.description }}
          </p>

          <!-- Footer -->
          <div class="flex items-center gap-4 text-xs text-[#8b949e]">
            <!-- Language -->
            <div class="flex items-center gap-1.5">
              <span
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: pkg.languageColor }"
              ></span>
              <span>{{ pkg.language }}</span>
            </div>

            <!-- Stars -->
            <div class="flex items-center gap-1">
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
              </svg>
              <span>{{ pkg.stars }}</span>
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
</style>
