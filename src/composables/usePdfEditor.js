import { ref, computed, shallowRef } from 'vue'
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path for pdf.js - use unpkg which has the correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

export function usePdfEditor() {
  // State
  const pdfDoc = shallowRef(null) // pdf-lib document
  const pdfBytes = shallowRef(null)
  const fileName = ref('')
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const themeColor = ref('#22c55e')

  // Pages state
  const pages = ref([]) // Array of { id, pageIndex, rotation, thumbnail }
  const selectedPages = ref(new Set())
  const pageCount = ref(0)

  // History state (undo/redo)
  const history = ref([])
  const historyIndex = ref(-1)
  const maxHistory = 30

  // Progress state
  const loadingProgress = ref(0)
  const loadingMessage = ref('')

  // Toast state
  const toasts = ref([])

  // Preview state
  const previewPage = ref(null)
  const previewZoom = ref(1)

  // Annotations state
  const annotations = ref([])
  const showAnnotationPanel = ref(false)

  // Computed
  const hasFile = computed(() => !!pdfDoc.value)
  const hasSelection = computed(() => selectedPages.value.size > 0)
  const allSelected = computed(() => selectedPages.value.size === pages.value.length)
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  const undoActionName = computed(() => historyIndex.value > 0 ? history.value[historyIndex.value]?.description : '')
  const redoActionName = computed(() => historyIndex.value < history.value.length - 1 ? history.value[historyIndex.value + 1]?.description : '')

  // Generate thumbnail for a page using pdf.js
  const generateThumbnail = async (pdfJsDoc, pageNum, scale = 0.3) => {
    const page = await pdfJsDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    return canvas.toDataURL('image/jpeg', 0.7)
  }

  // ==========================================
  // TOAST SYSTEM
  // ==========================================
  const showToast = (message, type = 'info', duration = 3000) => {
    const toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      duration,
      dismissable: true
    }
    toasts.value.push(toast)
    if (duration > 0) {
      setTimeout(() => dismissToast(toast.id), duration)
    }
    return toast.id
  }

  const dismissToast = (toastId) => {
    const index = toasts.value.findIndex(t => t.id === toastId)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  // ==========================================
  // HISTORY SYSTEM (UNDO/REDO)
  // ==========================================
  const saveToHistory = (description) => {
    // Truncate future history if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Create snapshot
    const snapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: Date.now(),
      description,
      pages: JSON.parse(JSON.stringify(pages.value)),
      selectedPages: Array.from(selectedPages.value),
      pageCount: pageCount.value
    }

    history.value.push(snapshot)

    // Limit history size
    if (history.value.length > maxHistory) {
      history.value.shift()
    }

    historyIndex.value = history.value.length - 1
  }

  const undo = async () => {
    if (!canUndo.value) return

    isProcessing.value = true

    try {
      historyIndex.value--
      await restoreFromHistory()
      showToast(`Deshacer: ${history.value[historyIndex.value + 1]?.description}`, 'info', 2000)
    } catch (error) {
      showToast('Error al deshacer', 'error')
      console.error('Undo error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  const redo = async () => {
    if (!canRedo.value) return

    isProcessing.value = true

    try {
      historyIndex.value++
      await restoreFromHistory()
      showToast(`Rehacer: ${history.value[historyIndex.value]?.description}`, 'info', 2000)
    } catch (error) {
      showToast('Error al rehacer', 'error')
      console.error('Redo error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  const restoreFromHistory = async () => {
    const snapshot = history.value[historyIndex.value]
    if (!snapshot) return

    // Restore pages and selection
    pages.value = JSON.parse(JSON.stringify(snapshot.pages))
    selectedPages.value = new Set(snapshot.selectedPages)
    pageCount.value = snapshot.pageCount

    // Rebuild PDF from pages
    await rebuildPdfFromPages()
  }

  const rebuildPdfFromPages = async () => {
    if (!pdfBytes.value || pages.value.length === 0) return

    // Reload original PDF
    const originalPdf = await PDFDocument.load(pdfBytes.value)
    const newPdf = await PDFDocument.create()

    // Copy pages in current order with rotations
    for (const page of pages.value) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [page.pageIndex])
      if (page.rotation !== 0) {
        copiedPage.setRotation(degrees(page.rotation))
      }
      newPdf.addPage(copiedPage)
    }

    pdfDoc.value = newPdf
  }

  const clearHistory = () => {
    history.value = []
    historyIndex.value = -1
  }

  // ==========================================
  // PREVIEW
  // ==========================================
  const openPreview = (pageIndex) => {
    previewPage.value = pageIndex
    previewZoom.value = 1
  }

  const closePreview = () => {
    previewPage.value = null
    previewZoom.value = 1
  }

  const setPreviewZoom = (zoom) => {
    previewZoom.value = Math.max(0.25, Math.min(4, zoom))
  }

  // ==========================================
  // ANNOTATIONS
  // ==========================================
  const toggleAnnotationPanel = () => {
    showAnnotationPanel.value = !showAnnotationPanel.value
  }

  const addAnnotation = (annotation) => {
    annotations.value.push(annotation)
    showToast('Anotación añadida', 'success', 2000)
  }

  const removeAnnotation = (annotationId) => {
    const index = annotations.value.findIndex(a => a.id === annotationId)
    if (index !== -1) {
      annotations.value.splice(index, 1)
      showToast('Anotación eliminada', 'info', 2000)
    }
  }

  const updateAnnotation = (updates) => {
    const ann = annotations.value.find(a => a.id === updates.id)
    if (ann) {
      Object.assign(ann, updates)
      showToast('Anotación actualizada', 'success', 2000)
    }
  }

  const clearAnnotations = () => {
    annotations.value = []
    showToast('Todas las anotaciones eliminadas', 'info', 2000)
  }

  // Load PDF file
  const loadFile = async (file) => {
    isLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Leyendo archivo...'
    fileName.value = file.name

    try {
      const arrayBuffer = await file.arrayBuffer()
      pdfBytes.value = new Uint8Array(arrayBuffer)
      loadingProgress.value = 10
      loadingMessage.value = 'Procesando PDF...'

      // Load with pdf-lib for manipulation
      pdfDoc.value = await PDFDocument.load(pdfBytes.value)
      pageCount.value = pdfDoc.value.getPageCount()
      loadingProgress.value = 20
      loadingMessage.value = 'Generando miniaturas...'

      // Load with pdf.js for rendering thumbnails
      const pdfJsDoc = await pdfjsLib.getDocument({ data: pdfBytes.value.slice() }).promise

      // Generate thumbnails for all pages with progress
      const newPages = []
      for (let i = 0; i < pageCount.value; i++) {
        const thumbnail = await generateThumbnail(pdfJsDoc, i + 1)
        newPages.push({
          id: `page-${i}-${Date.now()}`,
          pageIndex: i,
          rotation: 0,
          thumbnail
        })
        // Update progress (20-95%)
        loadingProgress.value = 20 + Math.round((i + 1) / pageCount.value * 75)
        loadingMessage.value = `Página ${i + 1} de ${pageCount.value}`
      }
      pages.value = newPages
      selectedPages.value = new Set()

      pdfJsDoc.destroy()

      // Initialize history with loaded state
      clearHistory()
      saveToHistory('Cargar PDF')

      loadingProgress.value = 100
      loadingMessage.value = 'Completado'
      showToast(`PDF cargado: ${pageCount.value} páginas`, 'success')
    } catch (error) {
      console.error('Error loading PDF:', error)
      showToast('Error al cargar el PDF', 'error')
      throw error
    } finally {
      isLoading.value = false
      loadingProgress.value = 0
      loadingMessage.value = ''
    }
  }

  // Add more PDF files (merge)
  const addFiles = async (files) => {
    if (!pdfDoc.value) {
      // If no document loaded, load the first file
      await loadFile(files[0])
      files = Array.from(files).slice(1)
    }

    if (files.length === 0) return

    isProcessing.value = true

    try {
      const fileCount = files.length
      saveToHistory(`Combinar ${fileCount} PDF${fileCount > 1 ? 's' : ''}`)

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer()
        const srcDoc = await PDFDocument.load(new Uint8Array(arrayBuffer))
        const srcPages = await pdfDoc.value.copyPages(srcDoc, srcDoc.getPageIndices())

        // Get thumbnails for new pages
        const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise

        for (let i = 0; i < srcPages.length; i++) {
          pdfDoc.value.addPage(srcPages[i])
          const thumbnail = await generateThumbnail(pdfJsDoc, i + 1)
          pages.value.push({
            id: `page-${pages.value.length}-${Date.now()}`,
            pageIndex: pages.value.length,
            rotation: 0,
            thumbnail
          })
        }

        pdfJsDoc.destroy()
      }

      pageCount.value = pdfDoc.value.getPageCount()
      await refreshPdfBytes()
      showToast(`${fileCount} PDF${fileCount > 1 ? 's' : ''} combinado${fileCount > 1 ? 's' : ''}`, 'success')
    } catch (error) {
      console.error('Error adding files:', error)
      showToast('Error al combinar PDFs', 'error')
    } finally {
      isProcessing.value = false
    }
  }

  // Refresh PDF bytes after modifications
  const refreshPdfBytes = async () => {
    if (!pdfDoc.value) return
    pdfBytes.value = await pdfDoc.value.save()
  }

  // Select/deselect page
  const togglePageSelection = (pageId) => {
    const newSelection = new Set(selectedPages.value)
    if (newSelection.has(pageId)) {
      newSelection.delete(pageId)
    } else {
      newSelection.add(pageId)
    }
    selectedPages.value = newSelection
  }

  // Select all pages
  const selectAll = () => {
    selectedPages.value = new Set(pages.value.map(p => p.id))
  }

  // Deselect all pages
  const deselectAll = () => {
    selectedPages.value = new Set()
  }

  // Rotate selected pages
  const rotateSelected = async (angle) => {
    if (!hasSelection.value) return

    isProcessing.value = true

    try {
      const count = selectedPages.value.size
      const direction = angle > 0 ? 'derecha' : 'izquierda'
      saveToHistory(`Rotar ${count} página${count > 1 ? 's' : ''} a la ${direction}`)

      const pdfPages = pdfDoc.value.getPages()

      for (const page of pages.value) {
        if (selectedPages.value.has(page.id)) {
          page.rotation = (page.rotation + angle + 360) % 360
          const pdfPage = pdfPages[page.pageIndex]
          const currentRotation = pdfPage.getRotation().angle
          pdfPage.setRotation(degrees(currentRotation + angle))
        }
      }

      await refreshPdfBytes()
      await regenerateThumbnails()
      showToast(`${count} página${count > 1 ? 's' : ''} rotada${count > 1 ? 's' : ''}`, 'success', 2000)
    } catch (error) {
      showToast('Error al rotar páginas', 'error')
      console.error('Rotate error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  // Delete selected pages
  const deleteSelected = async () => {
    if (!hasSelection.value) return
    if (selectedPages.value.size === pages.value.length) {
      showToast('No puedes eliminar todas las páginas', 'warning')
      return
    }

    isProcessing.value = true

    try {
      const count = selectedPages.value.size
      saveToHistory(`Eliminar ${count} página${count > 1 ? 's' : ''}`)

      // Get indices to remove (in reverse order to maintain correct indices)
      const indicesToRemove = pages.value
        .filter(p => selectedPages.value.has(p.id))
        .map(p => p.pageIndex)
        .sort((a, b) => b - a)

      // Remove from pdf-lib document
      for (const index of indicesToRemove) {
        pdfDoc.value.removePage(index)
      }

      // Update pages array
      pages.value = pages.value.filter(p => !selectedPages.value.has(p.id))

      // Re-index remaining pages
      pages.value.forEach((page, index) => {
        page.pageIndex = index
      })

      pageCount.value = pdfDoc.value.getPageCount()
      selectedPages.value = new Set()

      await refreshPdfBytes()
      showToast(`${count} página${count > 1 ? 's' : ''} eliminada${count > 1 ? 's' : ''}`, 'success', 2000)
    } catch (error) {
      showToast('Error al eliminar páginas', 'error')
      console.error('Delete error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  // Reorder pages (drag and drop)
  const reorderPages = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return

    isProcessing.value = true

    try {
      saveToHistory('Reordenar páginas')

      // Reorder in our pages array
      const [movedPage] = pages.value.splice(fromIndex, 1)
      pages.value.splice(toIndex, 0, movedPage)

      // Rebuild PDF with new order
      const newPdf = await PDFDocument.create()

      for (const page of pages.value) {
        const [copiedPage] = await newPdf.copyPages(pdfDoc.value, [page.pageIndex])
        newPdf.addPage(copiedPage)
      }

      pdfDoc.value = newPdf

      // Update page indices
      pages.value.forEach((page, index) => {
        page.pageIndex = index
      })

      await refreshPdfBytes()
    } catch (error) {
      showToast('Error al reordenar páginas', 'error')
      console.error('Reorder error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  // Extract selected pages as new PDF
  const extractSelected = async () => {
    if (!hasSelection.value) return

    isProcessing.value = true

    try {
      const newPdf = await PDFDocument.create()
      const selectedIndices = pages.value
        .filter(p => selectedPages.value.has(p.id))
        .map(p => p.pageIndex)

      const copiedPages = await newPdf.copyPages(pdfDoc.value, selectedIndices)
      copiedPages.forEach(page => newPdf.addPage(page))

      const bytes = await newPdf.save()
      downloadPdf(bytes, `${fileName.value.replace('.pdf', '')}_extracted.pdf`)
    } finally {
      isProcessing.value = false
    }
  }

  // Regenerate thumbnails after rotation
  const regenerateThumbnails = async () => {
    const pdfJsDoc = await pdfjsLib.getDocument({ data: pdfBytes.value.slice() }).promise

    for (let i = 0; i < pages.value.length; i++) {
      pages.value[i].thumbnail = await generateThumbnail(pdfJsDoc, i + 1)
    }

    pdfJsDoc.destroy()
  }

  // Download PDF helper
  const downloadPdf = (bytes, name) => {
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export current PDF
  // Helper: convert hex color to rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      )
    }
    return rgb(0, 0, 0)
  }

  // Apply annotations to PDF
  const applyAnnotations = async (doc) => {
    if (annotations.value.length === 0) return

    const font = await doc.embedFont(StandardFonts.Helvetica)
    const pdfPages = doc.getPages()

    for (const ann of annotations.value) {
      if (ann.pageIndex >= 0 && ann.pageIndex < pdfPages.length) {
        const page = pdfPages[ann.pageIndex]
        const { width, height } = page.getSize()

        // Calculate position from percentages
        // HTML: top is from top edge, PDF: y is from bottom edge (baseline)
        const x = (ann.x / 100) * width
        const y = height * (1 - ann.y / 100) - (ann.size * 1.13) // Adjusted for precise alignment

        // Draw background if enabled
        if (ann.hasBg && ann.bgColor) {
          const textWidth = font.widthOfTextAtSize(ann.content, ann.size)
          const textHeight = ann.size
          const padding = 2

          page.drawRectangle({
            x: x - padding,
            y: y - padding,
            width: textWidth + padding * 2,
            height: textHeight + padding * 2,
            color: hexToRgb(ann.bgColor)
          })
        }

        page.drawText(ann.content, {
          x,
          y,
          size: ann.size,
          font,
          color: hexToRgb(ann.color)
        })
      }
    }
  }

  const exportPdf = async () => {
    if (!pdfDoc.value) return

    isProcessing.value = true

    try {
      // Apply annotations before saving
      await applyAnnotations(pdfDoc.value)

      const bytes = await pdfDoc.value.save()
      const baseName = fileName.value.replace('.pdf', '')
      downloadPdf(bytes, `${baseName}_edited.pdf`)

      const annCount = annotations.value.length
      if (annCount > 0) {
        showToast(`PDF exportado con ${annCount} anotación${annCount > 1 ? 'es' : ''}`, 'success')
      } else {
        showToast('PDF exportado', 'success')
      }
    } catch (error) {
      showToast('Error al exportar PDF', 'error')
      console.error('Export error:', error)
    } finally {
      isProcessing.value = false
    }
  }

  // Split into individual pages
  const splitAll = async () => {
    if (!pdfDoc.value) return

    isProcessing.value = true

    try {
      for (let i = 0; i < pageCount.value; i++) {
        const newPdf = await PDFDocument.create()
        const [page] = await newPdf.copyPages(pdfDoc.value, [i])
        newPdf.addPage(page)
        const bytes = await newPdf.save()
        downloadPdf(bytes, `${fileName.value.replace('.pdf', '')}_page_${i + 1}.pdf`)
      }
    } finally {
      isProcessing.value = false
    }
  }

  // Theme
  const setThemeColor = (color) => {
    themeColor.value = color
  }

  // Clear
  const clearFile = () => {
    pdfDoc.value = null
    pdfBytes.value = null
    fileName.value = ''
    pages.value = []
    selectedPages.value = new Set()
    pageCount.value = 0
  }

  return {
    // State
    pdfDoc,
    pdfBytes,
    fileName,
    isLoading,
    isProcessing,
    themeColor,
    pages,
    selectedPages,
    pageCount,

    // History state
    history,
    historyIndex,

    // Progress state
    loadingProgress,
    loadingMessage,

    // Toast state
    toasts,

    // Preview state
    previewPage,
    previewZoom,

    // Annotations state
    annotations,
    showAnnotationPanel,

    // Computed
    hasFile,
    hasSelection,
    allSelected,
    canUndo,
    canRedo,
    undoActionName,
    redoActionName,

    // Methods
    loadFile,
    addFiles,
    togglePageSelection,
    selectAll,
    deselectAll,
    rotateSelected,
    deleteSelected,
    reorderPages,
    extractSelected,
    exportPdf,
    splitAll,
    setThemeColor,
    clearFile,

    // History methods
    undo,
    redo,
    saveToHistory,
    clearHistory,

    // Toast methods
    showToast,
    dismissToast,

    // Preview methods
    openPreview,
    closePreview,
    setPreviewZoom,

    // Annotation methods
    toggleAnnotationPanel,
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    clearAnnotations
  }
}
