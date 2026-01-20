import { ref, computed, watch } from 'vue'
import { useSvgCanvas } from './useSvgCanvas'
import { useSvgElements } from './useSvgElements'

export function useSvgEditor() {
  const canvas = useSvgCanvas()
  const elementsManager = useSvgElements()

  // Drawing state
  const isDrawing = ref(false)
  const drawingElement = ref(null)
  const drawStartPoint = ref({ x: 0, y: 0 })

  // Polygon drawing state
  const polygonPoints = ref([])
  const isDrawingPolygon = ref(false)

  // Path drawing state
  const pathPoints = ref([])
  const isDrawingPath = ref(false)

  // Transform state
  const isTransforming = ref(false)
  const transformType = ref(null) // 'move', 'resize-nw', 'resize-ne', etc., 'rotate'
  const transformStart = ref({ x: 0, y: 0 })
  const transformElementStart = ref(null)

  // UI state
  const showExportModal = ref(false)
  const isProcessing = ref(false)

  // History state (simple implementation)
  const historyStack = ref([])
  const historyIndex = ref(-1)
  const maxHistory = 50

  // Save state to history
  const saveToHistory = () => {
    // Remove any future states if we're not at the end
    if (historyIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
    }

    // Add current state
    const state = JSON.stringify(elementsManager.elements.value)
    historyStack.value.push(state)

    // Limit history size
    if (historyStack.value.length > maxHistory) {
      historyStack.value.shift()
    } else {
      historyIndex.value++
    }
  }

  // Undo
  const undo = () => {
    if (historyIndex.value > 0) {
      historyIndex.value--
      elementsManager.elements.value = JSON.parse(historyStack.value[historyIndex.value])
      elementsManager.deselectAll()
    }
  }

  // Redo
  const redo = () => {
    if (historyIndex.value < historyStack.value.length - 1) {
      historyIndex.value++
      elementsManager.elements.value = JSON.parse(historyStack.value[historyIndex.value])
      elementsManager.deselectAll()
    }
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1)

  // Initialize history
  const initHistory = () => {
    historyStack.value = [JSON.stringify(elementsManager.elements.value)]
    historyIndex.value = 0
  }

  // Start drawing
  const startDrawing = (x, y) => {
    const tool = elementsManager.currentTool.value

    if (tool === 'select') return

    // Snap to grid if enabled
    const snapped = canvas.snapToGridPoint(x, y)
    x = snapped.x
    y = snapped.y

    if (tool === 'polygon') {
      if (!isDrawingPolygon.value) {
        isDrawingPolygon.value = true
        polygonPoints.value = [{ x, y }]
        const element = elementsManager.createDefaultElement('polygon')
        element.points = `${x},${y}`
        drawingElement.value = elementsManager.addElement(element)
      } else {
        // Add point to polygon
        polygonPoints.value.push({ x, y })
        drawingElement.value.points = polygonPoints.value.map(p => `${p.x},${p.y}`).join(' ')
      }
      return
    }

    if (tool === 'path') {
      isDrawing.value = true
      isDrawingPath.value = true
      pathPoints.value = [{ x, y }]
      const element = elementsManager.createDefaultElement('path')
      element.d = `M ${x} ${y}`
      drawingElement.value = elementsManager.addElement(element)
      return
    }

    isDrawing.value = true
    drawStartPoint.value = { x, y }

    // Text tool: drag to define text box area
    if (tool === 'text') {
      const element = elementsManager.createDefaultElement('text')
      element.x = x
      element.y = y + element.fontSize // Position at baseline
      element._boxX = x
      element._boxY = y
      element._boxWidth = 0
      element._boxHeight = 0
      drawingElement.value = elementsManager.addElement(element)
      return
    }

    drawingElement.value = elementsManager.createElementAt(tool, x, y)
  }

  // Continue drawing
  const continueDrawing = (x, y) => {
    if (!isDrawing.value || !drawingElement.value) return

    // Handle path/pen tool
    if (isDrawingPath.value) {
      pathPoints.value.push({ x, y })
      drawingElement.value.d = pathPoints.value.map((p, i) =>
        i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
      ).join(' ')
      return
    }

    const snapped = canvas.snapToGridPoint(x, y)
    x = snapped.x
    y = snapped.y

    const dx = x - drawStartPoint.value.x
    const dy = y - drawStartPoint.value.y
    const tool = elementsManager.currentTool.value

    switch (tool) {
      case 'rect':
        if (dx >= 0) {
          drawingElement.value.x = drawStartPoint.value.x
          drawingElement.value.width = dx
        } else {
          drawingElement.value.x = x
          drawingElement.value.width = -dx
        }
        if (dy >= 0) {
          drawingElement.value.y = drawStartPoint.value.y
          drawingElement.value.height = dy
        } else {
          drawingElement.value.y = y
          drawingElement.value.height = -dy
        }
        break

      case 'ellipse':
        if (dx >= 0) {
          drawingElement.value.cx = drawStartPoint.value.x + dx / 2
          drawingElement.value.rx = dx / 2
        } else {
          drawingElement.value.cx = x - dx / 2
          drawingElement.value.rx = -dx / 2
        }
        if (dy >= 0) {
          drawingElement.value.cy = drawStartPoint.value.y + dy / 2
          drawingElement.value.ry = dy / 2
        } else {
          drawingElement.value.cy = y - dy / 2
          drawingElement.value.ry = -dy / 2
        }
        break

      case 'line':
        drawingElement.value.x2 = x
        drawingElement.value.y2 = y
        break

      case 'text':
        // Update text box bounds
        if (dx >= 0) {
          drawingElement.value._boxX = drawStartPoint.value.x
          drawingElement.value._boxWidth = dx
          drawingElement.value.x = drawStartPoint.value.x
        } else {
          drawingElement.value._boxX = x
          drawingElement.value._boxWidth = -dx
          drawingElement.value.x = x
        }
        if (dy >= 0) {
          drawingElement.value._boxY = drawStartPoint.value.y
          drawingElement.value._boxHeight = dy
          drawingElement.value.y = drawStartPoint.value.y + drawingElement.value.fontSize
        } else {
          drawingElement.value._boxY = y
          drawingElement.value._boxHeight = -dy
          drawingElement.value.y = y + drawingElement.value.fontSize
        }
        break
    }
  }

  // End drawing
  const endDrawing = () => {
    if (!isDrawing.value) return

    isDrawing.value = false

    // Handle path/pen tool
    if (isDrawingPath.value) {
      isDrawingPath.value = false
      if (drawingElement.value && pathPoints.value.length > 2) {
        elementsManager.selectElement(drawingElement.value.id)
        saveToHistory()
      } else if (drawingElement.value) {
        // Too short, remove it
        elementsManager.deleteElements([drawingElement.value.id])
      }
      drawingElement.value = null
      pathPoints.value = []
      return
    }

    if (drawingElement.value) {
      // Remove if too small (accidental click)
      const el = drawingElement.value
      let isValid = true

      if (el.type === 'rect' && (el.width < 5 && el.height < 5)) {
        isValid = false
      } else if (el.type === 'ellipse' && (el.rx < 3 && el.ry < 3)) {
        isValid = false
      } else if (el.type === 'line') {
        const length = Math.sqrt(
          Math.pow(el.x2 - el.x1, 2) + Math.pow(el.y2 - el.y1, 2)
        )
        if (length < 5) isValid = false
      } else if (el.type === 'text' && (el._boxWidth < 20 || el._boxHeight < 20)) {
        isValid = false
      }

      if (!isValid) {
        elementsManager.deleteElements([el.id])
      } else {
        elementsManager.selectElement(el.id)
        saveToHistory()
      }
    }

    drawingElement.value = null
  }

  // Finish polygon
  const finishPolygon = () => {
    if (isDrawingPolygon.value && drawingElement.value) {
      if (polygonPoints.value.length >= 3) {
        elementsManager.selectElement(drawingElement.value.id)
        saveToHistory()
      } else {
        elementsManager.deleteElements([drawingElement.value.id])
      }
      isDrawingPolygon.value = false
      polygonPoints.value = []
      drawingElement.value = null
    }
  }

  // Cancel drawing
  const cancelDrawing = () => {
    if (isDrawing.value && drawingElement.value) {
      elementsManager.deleteElements([drawingElement.value.id])
    }
    if (isDrawingPolygon.value && drawingElement.value) {
      elementsManager.deleteElements([drawingElement.value.id])
    }
    if (isDrawingPath.value && drawingElement.value) {
      elementsManager.deleteElements([drawingElement.value.id])
    }

    isDrawing.value = false
    isDrawingPolygon.value = false
    isDrawingPath.value = false
    drawingElement.value = null
    polygonPoints.value = []
    pathPoints.value = []
  }

  // Handle keyboard shortcuts
  const handleKeydown = (event) => {
    // Escape - cancel or deselect
    if (event.key === 'Escape') {
      if (isDrawing.value || isDrawingPolygon.value || isDrawingPath.value) {
        cancelDrawing()
      } else {
        elementsManager.deselectAll()
      }
      return
    }

    // Delete - delete selected
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (elementsManager.hasSelection.value) {
        elementsManager.deleteSelected()
        saveToHistory()
      }
      return
    }

    // Ctrl/Cmd shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault()
          if (event.shiftKey) {
            redo()
          } else {
            undo()
          }
          break
        case 'y':
          event.preventDefault()
          redo()
          break
        case 'd':
          event.preventDefault()
          if (elementsManager.hasSelection.value) {
            elementsManager.duplicateSelected()
            saveToHistory()
          }
          break
        case 'a':
          event.preventDefault()
          elementsManager.selectAll()
          break
      }
      return
    }

    // Tool shortcuts
    switch (event.key.toLowerCase()) {
      case 'v':
        elementsManager.currentTool.value = 'select'
        break
      case 'r':
        elementsManager.currentTool.value = 'rect'
        break
      case 'e':
        elementsManager.currentTool.value = 'ellipse'
        break
      case 'l':
        elementsManager.currentTool.value = 'line'
        break
      case 'p':
        elementsManager.currentTool.value = 'path'
        break
      case 't':
        elementsManager.currentTool.value = 'text'
        break
    }
  }

  // Initialize
  initHistory()

  return {
    // Canvas
    ...canvas,

    // Elements
    ...elementsManager,

    // Drawing state
    isDrawing,
    drawingElement,
    isDrawingPolygon,
    isDrawingPath,

    // Transform state
    isTransforming,
    transformType,

    // UI state
    showExportModal,
    isProcessing,

    // History
    canUndo,
    canRedo,
    undo,
    redo,
    saveToHistory,

    // Methods
    startDrawing,
    continueDrawing,
    endDrawing,
    finishPolygon,
    cancelDrawing,
    handleKeydown
  }
}
