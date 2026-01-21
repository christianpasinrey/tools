<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { cheatsheetData, sheets, categories } from '@/data/cheatsheets'
import * as THREE from 'three'

const activeSheet = ref('macos')
const expandedCategories = ref({})
const threeCanvas = ref(null)

// Get sheet data by id
const getSheetById = (id) => sheets.find(s => s.id === id)

// Get category sheets with full data
const getCategorySheets = (categoryId) => {
  const category = categories.find(c => c.id === categoryId)
  if (!category) return []
  return category.sheets.map(sheetId => sheets.find(s => s.id === sheetId)).filter(Boolean)
}

// Toggle category dropdown (only one open at a time)
const toggleCategory = (categoryId) => {
  const isCurrentlyOpen = expandedCategories.value[categoryId]
  // Close all dropdowns
  Object.keys(expandedCategories.value).forEach(key => {
    expandedCategories.value[key] = false
  })
  // Open the clicked one if it was closed
  if (!isCurrentlyOpen) {
    expandedCategories.value[categoryId] = true
  }
}

// Select sheet and close dropdown
const selectSheet = (sheetId) => {
  activeSheet.value = sheetId
  // Close all dropdowns
  Object.keys(expandedCategories.value).forEach(key => {
    expandedCategories.value[key] = false
  })
}

// Get current sheet language (for audio)
const currentSheetLang = computed(() =>
  sheets.find(s => s.id === activeSheet.value)?.lang || null
)

// Speech rate control
const speechRate = ref(0.9)
const availableVoices = ref([])

// Load voices (async in some browsers)
const loadVoices = () => {
  availableVoices.value = window.speechSynthesis?.getVoices() || []
}

// Initialize voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

// Text-to-Speech function
const speakText = (text, lang) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate.value

    // Try to find the best voice for the language
    const voices = availableVoices.value.length > 0
      ? availableVoices.value
      : window.speechSynthesis.getVoices()

    const langCode = lang.split('-')[0] // e.g., 'fr' from 'fr-FR'
    const voice = voices.find(v => v.lang === lang) ||
                  voices.find(v => v.lang.startsWith(lang)) ||
                  voices.find(v => v.lang.startsWith(langCode)) ||
                  voices.find(v => v.lang.toLowerCase().includes(langCode))

    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      utterance.lang = lang
    }

    window.speechSynthesis.speak(utterance)
  }
}

// Three.js variables
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

  return new THREE.CanvasTexture(canvas)
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
  const particleCount = 120
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
    size: 1.5,
    map: circleTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // Animation loop
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

  window.addEventListener('resize', onResize)
}

const onResize = () => {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onMounted(() => {
  initThree()
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
})
const currentSheet = computed(() => cheatsheetData[activeSheet.value])
const currentSheetType = computed(() => sheets.find(s => s.id === activeSheet.value)?.type || 'shortcuts')
const isExporting = ref(false)

async function exportToPDF() {
  isExporting.value = true

  try {
    const sheet = currentSheet.value
    const pdfDoc = await PDFDocument.create()

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier)

    // Colors
    const colors = {
      bg: rgb(0.04, 0.04, 0.04),
      cardBg: rgb(0.08, 0.08, 0.08),
      title: rgb(0.13, 0.77, 0.37), // #22c55e
      text: rgb(0.9, 0.9, 0.9),
      textMuted: rgb(0.6, 0.6, 0.6),
      code: rgb(0.49, 0.83, 0.99), // #7dd3fc
      keyBg: rgb(0.2, 0.2, 0.2),
      border: rgb(0.15, 0.15, 0.15)
    }

    // Page settings
    const pageWidth = 842 // A4 landscape
    const pageHeight = 595
    const margin = 30
    const colGap = 15
    const numCols = 3
    const colWidth = (pageWidth - margin * 2 - colGap * (numCols - 1)) / numCols

    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let colIndex = 0
    let yPos = pageHeight - margin

    // Draw background
    const drawBackground = (p) => {
      p.drawRectangle({
        x: 0, y: 0,
        width: pageWidth, height: pageHeight,
        color: colors.bg
      })
    }
    drawBackground(page)

    // Title
    page.drawText(sheet.title, {
      x: margin,
      y: yPos - 5,
      size: 18,
      font: fontBold,
      color: colors.title
    })

    page.drawText(sheet.description, {
      x: margin,
      y: yPos - 22,
      size: 9,
      font: fontRegular,
      color: colors.textMuted
    })

    yPos -= 45
    const startY = yPos
    const colHeights = [0, 0, 0]

    // Process sections
    for (const section of sheet.sections) {
      // Calculate section height
      const headerHeight = 20
      const itemHeight = 14
      const padding = 16
      const sectionHeight = headerHeight + section.items.length * itemHeight + padding

      // Find best column (shortest)
      colIndex = colHeights.indexOf(Math.min(...colHeights))
      const colX = margin + colIndex * (colWidth + colGap)
      const colY = startY - colHeights[colIndex]

      // Check if we need a new page
      if (colY - sectionHeight < margin) {
        // If all columns are full, new page
        if (Math.min(...colHeights) > startY - margin - 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          drawBackground(page)
          colHeights.fill(0)
          colIndex = 0
        }
      }

      const currentY = startY - colHeights[colIndex]
      const currentX = margin + colIndex * (colWidth + colGap)

      // Card background
      page.drawRectangle({
        x: currentX,
        y: currentY - sectionHeight,
        width: colWidth,
        height: sectionHeight,
        color: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 0.5
      })

      // Section title bar
      page.drawRectangle({
        x: currentX,
        y: currentY - headerHeight,
        width: 3,
        height: 12,
        color: colors.title
      })

      page.drawText(section.name.toUpperCase(), {
        x: currentX + 8,
        y: currentY - 14,
        size: 8,
        font: fontBold,
        color: colors.title
      })

      // Items
      let itemY = currentY - headerHeight - 6
      for (const item of section.items) {
        itemY -= itemHeight

        if (item.keys) {
          // Keyboard shortcut
          let keyX = currentX + 6
          for (const key of item.keys) {
            const keyWidth = fontMono.widthOfTextAtSize(key, 7) + 8
            page.drawRectangle({
              x: keyX,
              y: itemY - 2,
              width: keyWidth,
              height: 11,
              color: colors.keyBg,
              borderColor: colors.border,
              borderWidth: 0.3
            })
            page.drawText(key, {
              x: keyX + 4,
              y: itemY + 1,
              size: 7,
              font: fontMono,
              color: colors.text
            })
            keyX += keyWidth + 3
          }
          // Description (right aligned)
          const descWidth = fontRegular.widthOfTextAtSize(item.desc, 7)
          page.drawText(item.desc, {
            x: currentX + colWidth - descWidth - 6,
            y: itemY + 1,
            size: 7,
            font: fontRegular,
            color: colors.textMuted
          })
        } else if (item.cmd) {
          // Command
          const cmdText = item.cmd.length > 35 ? item.cmd.substring(0, 35) + '...' : item.cmd
          page.drawText(cmdText, {
            x: currentX + 6,
            y: itemY + 1,
            size: 7,
            font: fontMono,
            color: colors.code
          })
          // Description (right aligned)
          const descText = item.desc.length > 25 ? item.desc.substring(0, 25) + '...' : item.desc
          const descWidth = fontRegular.widthOfTextAtSize(descText, 7)
          page.drawText(descText, {
            x: currentX + colWidth - descWidth - 6,
            y: itemY + 1,
            size: 7,
            font: fontRegular,
            color: colors.textMuted
          })
        }
      }

      colHeights[colIndex] += sectionHeight + 8
    }

    // Footer
    const footerText = `${sheet.title} Cheatsheet - Generated ${new Date().toLocaleDateString()}`
    page.drawText(footerText, {
      x: margin,
      y: 15,
      size: 7,
      font: fontRegular,
      color: colors.textMuted
    })

    // Download
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeSheet.value}-cheatsheet.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting PDF:', error)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="cheatsheet-page">
    <!-- Three.js Particle Background -->
    <canvas ref="threeCanvas" class="particles-canvas"></canvas>

    <!-- Background Glows -->
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <!-- SVG Filters -->
    <svg class="absolute w-0 h-0" aria-hidden="true">
      <defs>
        <filter id="sheetGlassFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feDisplacementMap in="SourceGraphic" in2="blur" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <!-- Top Navigation Menu with Categories -->
    <div class="sheet-menu-wrapper">
      <div class="sheet-menu">
        <div class="sheet-menu-glass"></div>
        <div class="sheet-menu-content">
          <!-- Category Dropdowns -->
          <div class="categories-container">
            <div
              v-for="category in categories"
              :key="category.id"
              class="category-dropdown"
            >
              <button
                @click="toggleCategory(category.id)"
                class="category-btn"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path :d="category.icon" />
                </svg>
                <span class="category-label">{{ category.name }}</span>
                <svg
                  class="w-4 h-4 transition-transform"
                  :class="{ 'rotate-180': expandedCategories[category.id] }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <transition name="dropdown">
                <div
                  v-show="expandedCategories[category.id]"
                  class="category-menu"
                >
                  <button
                    v-for="sheet in getCategorySheets(category.id)"
                    :key="sheet.id"
                    @click="selectSheet(sheet.id)"
                    class="category-menu-item"
                    :class="{ 'is-active': activeSheet === sheet.id }"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path :d="sheet.icon" />
                    </svg>
                    <span>{{ sheet.name }}</span>
                  </button>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="sheet-content">
      <!-- Header -->
      <header class="sheet-header">
        <div class="header-top">
          <h1 class="sheet-title">{{ currentSheet.title }}</h1>

          <!-- Speed control for language sheets -->
          <div v-if="currentSheetLang" class="speed-control">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              type="range"
              v-model="speechRate"
              min="0.5"
              max="1.5"
              step="0.1"
              class="speed-slider"
            />
            <span class="speed-label">{{ speechRate }}x</span>
          </div>

          <button
            @click="exportToPDF"
            :disabled="isExporting"
            class="export-btn"
          >
            <svg v-if="!isExporting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isExporting ? 'Exportando...' : 'Exportar PDF' }}</span>
          </button>
        </div>
        <p class="sheet-description">{{ currentSheet.description }}</p>
      </header>

      <!-- Sections Grid -->
      <div class="sheet-grid">
        <article
          v-for="section in currentSheet.sections"
          :key="section.name"
          class="sheet-card"
        >
          <!-- Card Glass Effect Layers -->
          <div class="card-glass-filter"></div>
          <div class="card-glass-overlay"></div>
          <div class="card-glass-specular"></div>

          <!-- Card Content -->
          <div class="card-content">
            <h2 class="card-title">{{ section.name }}</h2>

            <div class="card-items">
              <div
                v-for="(item, idx) in section.items"
                :key="idx"
                class="sheet-item"
              >
                <!-- Keyboard Shortcut Style -->
                <div v-if="item.keys" class="item-keys">
                  <kbd
                    v-for="(key, keyIdx) in item.keys"
                    :key="keyIdx"
                    class="key-cap"
                  >
                    <span class="key-surface">{{ key }}</span>
                  </kbd>
                </div>

                <!-- Command/Code Style -->
                <div v-else-if="item.cmd" class="item-cmd">
                  <code class="cmd-code">{{ item.cmd }}</code>
                </div>

                <!-- Description -->
                <span class="item-desc">{{ item.desc }}</span>

                <!-- Audio button for language sheets -->
                <button
                  v-if="currentSheetLang && item.keys"
                  @click="speakText(item.keys[0], currentSheetLang)"
                  class="audio-btn"
                  title="Escuchar pronunciación"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
