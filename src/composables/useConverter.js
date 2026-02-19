import { ref } from 'vue'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from 'docx'
import ExcelJS from 'exceljs'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

export function useConverter() {
  const activeConversion = ref(null)
  const isProcessing = ref(false)
  const progress = ref(0)
  const progressMessage = ref('')

  // Toast system
  const toasts = ref([])

  const showToast = (message, type = 'info', duration = 3000) => {
    const toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      duration
    }
    toasts.value.push(toast)
    if (duration > 0) {
      setTimeout(() => dismissToast(toast.id), duration)
    }
  }

  const dismissToast = (id) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  // Download helper
  const downloadFile = (data, filename, mimeType) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Navigation
  const selectConversion = (type) => {
    activeConversion.value = type
  }

  const goBack = () => {
    activeConversion.value = null
  }

  // ==========================================
  // TEXT EXTRACTION (shared by Word & Excel)
  // ==========================================

  const groupItemsByLine = (items, tolerance = 2) => {
    if (!items.length) return []
    const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5])
    const lines = []
    let currentLine = []
    let currentY = null

    for (const item of sorted) {
      if (!item.str.trim() && !item.str.includes(' ')) continue
      const y = item.transform[5]
      if (currentY === null || Math.abs(y - currentY) <= tolerance) {
        currentLine.push(item)
        currentY = currentY ?? y
      } else {
        if (currentLine.length) {
          lines.push(currentLine.sort((a, b) => a.transform[4] - b.transform[4]))
        }
        currentLine = [item]
        currentY = y
      }
    }
    if (currentLine.length) {
      lines.push(currentLine.sort((a, b) => a.transform[4] - b.transform[4]))
    }
    return lines
  }

  const extractTextFromPdf = async (arrayBuffer) => {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    const pages = []

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const lines = groupItemsByLine(content.items)

      const processedLines = lines.map(lineItems => {
        const fontSize = Math.abs(lineItems[0]?.transform[0] || 12)
        const fontName = lineItems[0]?.fontName || ''
        const text = lineItems.map(item => item.str).join(' ')
        const xPositions = lineItems.map(item => item.transform[4])
        return { text, fontSize, fontName, xPositions, items: lineItems }
      })

      pages.push({ pageNum: i, lines: processedLines })
      progress.value = (i / doc.numPages) * 50
    }

    doc.destroy()
    return pages
  }

  // ==========================================
  // JPG TO PDF
  // ==========================================

  const jpgToPdf = async (imageFiles, pageSize = 'fit') => {
    isProcessing.value = true
    progress.value = 0
    progressMessage.value = 'Creando PDF...'

    try {
      const pdfDoc = await PDFDocument.create()

      for (let i = 0; i < imageFiles.length; i++) {
        progressMessage.value = `Procesando imagen ${i + 1} de ${imageFiles.length}...`
        const bytes = new Uint8Array(await imageFiles[i].arrayBuffer())
        const isJpg = imageFiles[i].type === 'image/jpeg'

        let image
        try {
          image = isJpg ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes)
        } catch {
          showToast(`Error al procesar ${imageFiles[i].name}`, 'error')
          continue
        }

        const { width, height } = image.scale(1)

        if (pageSize === 'a4') {
          const a4W = 595.28
          const a4H = 841.89
          const scale = Math.min(a4W / width, a4H / height, 1)
          const scaledW = width * scale
          const scaledH = height * scale
          const page = pdfDoc.addPage([a4W, a4H])
          page.drawImage(image, {
            x: (a4W - scaledW) / 2,
            y: (a4H - scaledH) / 2,
            width: scaledW,
            height: scaledH
          })
        } else {
          const page = pdfDoc.addPage([width, height])
          page.drawImage(image, { x: 0, y: 0, width, height })
        }

        progress.value = ((i + 1) / imageFiles.length) * 100
      }

      if (pdfDoc.getPageCount() === 0) {
        showToast('No se pudo procesar ninguna imagen', 'error')
        return
      }

      const pdfBytes = await pdfDoc.save()
      downloadFile(pdfBytes, 'imagenes.pdf', 'application/pdf')
      showToast('PDF creado correctamente', 'success')
    } catch (e) {
      showToast('Error al crear el PDF: ' + e.message, 'error')
    } finally {
      isProcessing.value = false
      progress.value = 0
      progressMessage.value = ''
    }
  }

  // ==========================================
  // PDF TO JPG
  // ==========================================

  const pdfToJpg = async (pdfFile, scale = 2.0, quality = 0.92) => {
    isProcessing.value = true
    progress.value = 0
    progressMessage.value = 'Cargando PDF...'

    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise

      if (pdfJsDoc.numPages === 0) {
        showToast('El PDF no contiene páginas', 'error')
        pdfJsDoc.destroy()
        return []
      }

      const images = []
      for (let i = 1; i <= pdfJsDoc.numPages; i++) {
        progressMessage.value = `Convirtiendo página ${i} de ${pdfJsDoc.numPages}...`
        const page = await pdfJsDoc.getPage(i)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height

        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport }).promise

        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        images.push({ dataUrl, pageNum: i, width: viewport.width, height: viewport.height })
        progress.value = (i / pdfJsDoc.numPages) * 100
      }

      pdfJsDoc.destroy()
      showToast(`${images.length} ${images.length === 1 ? 'imagen extraída' : 'imágenes extraídas'}`, 'success')
      return images
    } catch (e) {
      showToast('Error al procesar el PDF: ' + e.message, 'error')
      return []
    } finally {
      isProcessing.value = false
      progress.value = 0
      progressMessage.value = ''
    }
  }

  const downloadJpgImage = (dataUrl, pageNum, baseName = 'pagina') => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${baseName}_${pageNum}.jpg`
    link.click()
  }

  // ==========================================
  // PDF TO WORD
  // ==========================================

  const pdfToWord = async (pdfFile) => {
    isProcessing.value = true
    progress.value = 0
    progressMessage.value = 'Extrayendo texto del PDF...'

    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const extractedPages = await extractTextFromPdf(arrayBuffer)

      if (extractedPages.every(p => p.lines.length === 0)) {
        showToast('No se encontró texto en el PDF. Puede ser un documento escaneado.', 'error')
        return
      }

      progressMessage.value = 'Generando documento Word...'
      progress.value = 60

      const sections = []

      for (let i = 0; i < extractedPages.length; i++) {
        const page = extractedPages[i]
        const children = []

        // Detect average font size for heading classification
        const fontSizes = page.lines.map(l => l.fontSize)
        const avgFontSize = fontSizes.length > 0 ? fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length : 12

        for (const line of page.lines) {
          if (!line.text.trim()) {
            children.push(new Paragraph({ text: '' }))
            continue
          }

          const isBold = line.fontName.toLowerCase().includes('bold')
          const isHeading = line.fontSize > avgFontSize * 1.3

          const textRun = new TextRun({
            text: line.text,
            bold: isBold,
            size: Math.round(line.fontSize * 2) // docx uses half-points
          })

          if (isHeading && line.fontSize > avgFontSize * 1.6) {
            children.push(new Paragraph({ children: [textRun], heading: HeadingLevel.HEADING_1 }))
          } else if (isHeading) {
            children.push(new Paragraph({ children: [textRun], heading: HeadingLevel.HEADING_2 }))
          } else {
            children.push(new Paragraph({ children: [textRun] }))
          }
        }

        // Add page break between pages (except last)
        if (i < extractedPages.length - 1 && children.length > 0) {
          children.push(new Paragraph({ children: [new PageBreak()] }))
        }

        if (children.length === 0) {
          children.push(new Paragraph({ text: '' }))
        }

        sections.push({ children })
      }

      const doc = new Document({ sections })
      progress.value = 80

      const blob = await Packer.toBlob(doc)
      const name = pdfFile.name.replace(/\.pdf$/i, '') + '.docx'
      downloadFile(blob, name, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

      progress.value = 100
      showToast('Documento Word creado correctamente', 'success')
    } catch (e) {
      showToast('Error al convertir a Word: ' + e.message, 'error')
    } finally {
      isProcessing.value = false
      progress.value = 0
      progressMessage.value = ''
    }
  }

  // ==========================================
  // PDF TO EXCEL
  // ==========================================

  const detectColumns = (allLines) => {
    // Collect all X positions across all lines
    const xPositions = []
    for (const line of allLines) {
      for (const item of line.items) {
        xPositions.push(Math.round(item.transform[4]))
      }
    }
    if (xPositions.length === 0) return []

    // Sort and cluster X positions
    const sorted = [...new Set(xPositions)].sort((a, b) => a - b)
    const clusters = []
    let currentCluster = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] < 15) {
        currentCluster.push(sorted[i])
      } else {
        clusters.push(Math.round(currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length))
        currentCluster = [sorted[i]]
      }
    }
    clusters.push(Math.round(currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length))

    return clusters
  }

  const pdfToExcel = async (pdfFile) => {
    isProcessing.value = true
    progress.value = 0
    progressMessage.value = 'Extrayendo datos del PDF...'

    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const extractedPages = await extractTextFromPdf(arrayBuffer)

      if (extractedPages.every(p => p.lines.length === 0)) {
        showToast('No se encontraron datos en el PDF. Puede ser un documento escaneado.', 'error')
        return
      }

      progressMessage.value = 'Generando archivo Excel...'
      progress.value = 60

      const workbook = new ExcelJS.Workbook()

      for (let i = 0; i < extractedPages.length; i++) {
        const page = extractedPages[i]
        const sheetName = `Página ${page.pageNum}`
        const worksheet = workbook.addWorksheet(sheetName)

        if (page.lines.length === 0) continue

        // Detect column structure
        const columns = detectColumns(page.lines)

        if (columns.length <= 1) {
          // Single column - just dump text
          for (const line of page.lines) {
            worksheet.addRow([line.text])
          }
        } else {
          // Multi-column - assign items to columns
          for (const line of page.lines) {
            const row = new Array(columns.length).fill('')
            for (const item of line.items) {
              const x = Math.round(item.transform[4])
              // Find closest column
              let closestCol = 0
              let minDist = Math.abs(x - columns[0])
              for (let c = 1; c < columns.length; c++) {
                const dist = Math.abs(x - columns[c])
                if (dist < minDist) {
                  minDist = dist
                  closestCol = c
                }
              }
              row[closestCol] = row[closestCol] ? row[closestCol] + ' ' + item.str : item.str
            }
            worksheet.addRow(row)
          }
        }

        // Auto-width columns
        worksheet.columns.forEach(col => {
          let maxLen = 10
          col.eachCell({ includeEmpty: false }, cell => {
            const len = cell.value ? String(cell.value).length : 0
            if (len > maxLen) maxLen = len
          })
          col.width = Math.min(maxLen + 2, 50)
        })

        progress.value = 60 + ((i + 1) / extractedPages.length) * 30
      }

      progress.value = 95
      const buffer = await workbook.xlsx.writeBuffer()
      const name = pdfFile.name.replace(/\.pdf$/i, '') + '.xlsx'
      downloadFile(buffer, name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

      progress.value = 100
      showToast('Archivo Excel creado correctamente', 'success')
    } catch (e) {
      showToast('Error al convertir a Excel: ' + e.message, 'error')
    } finally {
      isProcessing.value = false
      progress.value = 0
      progressMessage.value = ''
    }
  }

  return {
    activeConversion,
    isProcessing,
    progress,
    progressMessage,
    toasts,
    showToast,
    dismissToast,
    selectConversion,
    goBack,
    downloadFile,
    jpgToPdf,
    pdfToJpg,
    downloadJpgImage,
    pdfToWord,
    pdfToExcel,
    extractTextFromPdf
  }
}
