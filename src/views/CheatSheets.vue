<script setup>
import { ref, computed } from 'vue'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { cheatsheetData, sheets } from '@/data/cheatsheets'

const activeSheet = ref('macos')
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
    <!-- Background Elements -->
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

    <!-- Top Navigation Dock -->
    <div class="sheet-dock-wrapper">
      <div class="sheet-dock">
        <div class="sheet-dock-glass"></div>
        <div class="sheet-dock-content">
          <button
            v-for="sheet in sheets"
            :key="sheet.id"
            @click="activeSheet = sheet.id"
            class="sheet-dock-btn"
            :class="{ 'is-active': activeSheet === sheet.id }"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path :d="sheet.icon" />
            </svg>
            <span class="sheet-dock-label">{{ sheet.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="sheet-content">
      <!-- Header -->
      <header class="sheet-header">
        <div class="header-top">
          <h1 class="sheet-title">{{ currentSheet.title }}</h1>
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
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Page Layout - Compact */
.cheatsheet-page {
  min-height: 100vh;
  background: #0a0a0a;
  padding: 0 0 80px 0;
  position: relative;
  overflow-x: hidden;
}

/* Background Glows - Subtle */
.bg-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.bg-glow-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.3), transparent 70%);
  top: -200px;
  left: -200px;
}

.bg-glow-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.25), transparent 70%);
  bottom: -150px;
  right: -150px;
}

/* ===== TOP DOCK - Compact ===== */
.sheet-dock-wrapper {
  position: sticky;
  top: 8px;
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 4px 8px;
  margin-bottom: 12px;
}

.sheet-dock {
  position: relative;
  border-radius: 12px;
  max-width: 100%;
  overflow: hidden;
}

.sheet-dock-glass {
  position: absolute;
  inset: 0;
  background: rgba(15, 15, 15, 0.9);
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.sheet-dock-glass::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%);
  border-radius: 12px 12px 0 0;
  pointer-events: none;
}

.sheet-dock-content {
  position: relative;
  display: flex;
  gap: 2px;
  padding: 6px 8px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sheet-dock-content::-webkit-scrollbar {
  display: none;
}

.sheet-dock-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.sheet-dock-btn svg {
  width: 16px;
  height: 16px;
}

.sheet-dock-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
}

.sheet-dock-btn.is-active {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.sheet-dock-label {
  font-size: 9px;
  font-weight: 500;
}

/* ===== CONTENT - Tight ===== */
.sheet-content {
  position: relative;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 12px;
  z-index: 1;
}

.sheet-header {
  text-align: center;
  margin-bottom: 16px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 4px;
}

.sheet-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.sheet-description {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  color: #22c55e;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.5);
  transform: translateY(-1px);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-btn svg {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* ===== MASONRY LAYOUT ===== */
.sheet-grid {
  column-count: 4;
  column-gap: 10px;
}

/* ===== CARDS - Compact Glass ===== */
.sheet-card {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  break-inside: avoid;
  margin-bottom: 10px;
}

.card-glass-filter {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(12px) saturate(1.3);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
  border-radius: 10px;
  z-index: 1;
}

.card-glass-overlay {
  position: absolute;
  inset: 0;
  background: rgba(18, 18, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  z-index: 2;
}

.card-glass-specular {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, transparent 50%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: none;
  z-index: 3;
}

.card-glass-specular::before {
  display: none;
}

.card-content {
  position: relative;
  padding: 10px 12px;
  z-index: 4;
}

.card-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #22c55e;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-title::before {
  content: '';
  width: 3px;
  height: 12px;
  background: #22c55e;
  border-radius: 1px;
}

/* ===== ITEMS - Ultra Compact ===== */
.card-items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.sheet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.sheet-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* ===== KEYBOARD KEYS - Mini ===== */
.item-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  flex-shrink: 0;
}

.key-cap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
  border-radius: 3px;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 9px;
  font-weight: 600;
  color: #e5e5e5;
  border: none;
  box-shadow:
    0 1px 0 0 #1a1a1a,
    0 2px 0 0 #1a1a1a,
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.key-cap:hover {
  background: linear-gradient(180deg, #454545 0%, #353535 100%);
}

.key-surface {
  position: relative;
  z-index: 1;
}

.key-cap::before {
  display: none;
}

/* ===== CODE COMMANDS - Minimal ===== */
.item-cmd {
  flex-shrink: 1;
  min-width: 0;
}

.cmd-code {
  display: inline;
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 3px;
  font-family: ui-monospace, 'SF Mono', Monaco, monospace;
  font-size: 10px;
  color: #7dd3fc;
  word-break: break-word;
  white-space: normal;
}

/* ===== DESCRIPTION - Compact ===== */
.item-desc {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  line-height: 1.3;
  flex-shrink: 1;
  min-width: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1400px) {
  .sheet-grid {
    column-count: 3;
  }
}

@media (max-width: 1000px) {
  .sheet-grid {
    column-count: 2;
  }
}

@media (max-width: 768px) {
  .sheet-dock-wrapper {
    top: 4px;
    padding: 2px 6px;
  }

  .sheet-dock-content {
    padding: 4px 6px;
  }

  .sheet-dock-btn {
    padding: 4px 6px;
  }

  .sheet-dock-btn svg {
    width: 14px;
    height: 14px;
  }

  .sheet-dock-label {
    font-size: 8px;
  }

  .sheet-title {
    font-size: 1.25rem;
  }

  .card-content {
    padding: 8px 10px;
  }

  .item-desc {
    font-size: 9px;
  }
}

@media (max-width: 540px) {
  .sheet-grid {
    column-count: 1;
  }

  .sheet-dock-label {
    display: none;
  }

  .sheet-dock-btn {
    padding: 6px 8px;
  }

  .sheet-dock-btn svg {
    width: 16px;
    height: 16px;
  }
}

@media (min-width: 1800px) {
  .sheet-grid {
    column-count: 5;
  }
}
</style>
