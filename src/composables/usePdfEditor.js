import { ref, computed, shallowRef } from 'vue'
import { PDFDocument, degrees } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

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

  // Computed
  const hasFile = computed(() => !!pdfDoc.value)
  const hasSelection = computed(() => selectedPages.value.size > 0)
  const allSelected = computed(() => selectedPages.value.size === pages.value.length)

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

  // Load PDF file
  const loadFile = async (file) => {
    isLoading.value = true
    fileName.value = file.name

    try {
      const arrayBuffer = await file.arrayBuffer()
      pdfBytes.value = new Uint8Array(arrayBuffer)

      // Load with pdf-lib for manipulation
      pdfDoc.value = await PDFDocument.load(pdfBytes.value)
      pageCount.value = pdfDoc.value.getPageCount()

      // Load with pdf.js for rendering thumbnails
      const pdfJsDoc = await pdfjsLib.getDocument({ data: pdfBytes.value.slice() }).promise

      // Generate thumbnails for all pages
      const newPages = []
      for (let i = 0; i < pageCount.value; i++) {
        const thumbnail = await generateThumbnail(pdfJsDoc, i + 1)
        newPages.push({
          id: `page-${i}-${Date.now()}`,
          pageIndex: i,
          rotation: 0,
          thumbnail
        })
      }
      pages.value = newPages
      selectedPages.value = new Set()

      pdfJsDoc.destroy()
    } catch (error) {
      console.error('Error loading PDF:', error)
      throw error
    } finally {
      isLoading.value = false
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
    } catch (error) {
      console.error('Error adding files:', error)
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
    } finally {
      isProcessing.value = false
    }
  }

  // Delete selected pages
  const deleteSelected = async () => {
    if (!hasSelection.value) return
    if (selectedPages.value.size === pages.value.length) {
      // Can't delete all pages
      return
    }

    isProcessing.value = true

    try {
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
    } finally {
      isProcessing.value = false
    }
  }

  // Reorder pages (drag and drop)
  const reorderPages = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return

    isProcessing.value = true

    try {
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
  const exportPdf = async () => {
    if (!pdfDoc.value) return

    isProcessing.value = true

    try {
      const bytes = await pdfDoc.value.save()
      const baseName = fileName.value.replace('.pdf', '')
      downloadPdf(bytes, `${baseName}_edited.pdf`)
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
    fileName,
    isLoading,
    isProcessing,
    themeColor,
    pages,
    selectedPages,
    pageCount,

    // Computed
    hasFile,
    hasSelection,
    allSelected,

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
    clearFile
  }
}
