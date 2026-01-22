<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useSvgEditor } from '../composables/svg/useSvgEditor'
import SvgToolbar from '../components/svg/SvgToolbar.vue'
import SvgCanvas from '../components/svg/SvgCanvas.vue'
import SvgSidebar from '../components/svg/SvgSidebar.vue'
import SvgLayersList from '../components/svg/SvgLayersList.vue'
import VaultSaveLoad from '../components/common/VaultSaveLoad.vue'

const editor = useSvgEditor()

const getProjectData = () => ({
  elements: JSON.parse(JSON.stringify(editor.elements.value)),
  artboard: {
    width: editor.artboardWidth.value,
    height: editor.artboardHeight.value,
    gridSize: editor.gridSize.value,
    showGrid: editor.showGrid.value,
    snapToGrid: editor.snapToGrid.value
  }
})

const loadProject = (data) => {
  if (data.elements) editor.elements.value = data.elements
  if (data.artboard) {
    editor.artboardWidth.value = data.artboard.width ?? 512
    editor.artboardHeight.value = data.artboard.height ?? 512
    editor.gridSize.value = data.artboard.gridSize ?? 16
    editor.showGrid.value = data.artboard.showGrid ?? true
    editor.snapToGrid.value = data.artboard.snapToGrid ?? true
  }
  editor.clearSelection()
}

const fileInputRef = ref(null)

// Import SVG file
const handleImport = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'image/svg+xml')
    const svg = doc.querySelector('svg')

    if (svg) {
      // Get viewBox or width/height
      const viewBox = svg.getAttribute('viewBox')
      if (viewBox) {
        const [, , w, h] = viewBox.split(' ').map(Number)
        if (w && h) {
          editor.artboardWidth.value = w
          editor.artboardHeight.value = h
        }
      }

      // Parse elements (simplified - just basic shapes)
      svg.querySelectorAll('rect, ellipse, circle, line, polygon, path, text').forEach(el => {
        const type = el.tagName.toLowerCase() === 'circle' ? 'ellipse' : el.tagName.toLowerCase()
        const baseElement = editor.createDefaultElement(type)

        // Common attributes
        baseElement.fill = el.getAttribute('fill') || baseElement.fill
        baseElement.stroke = el.getAttribute('stroke') || baseElement.stroke
        baseElement.strokeWidth = parseFloat(el.getAttribute('stroke-width')) || baseElement.strokeWidth
        baseElement.opacity = parseFloat(el.getAttribute('opacity')) || 1

        // Type-specific attributes
        if (type === 'rect') {
          baseElement.x = parseFloat(el.getAttribute('x')) || 0
          baseElement.y = parseFloat(el.getAttribute('y')) || 0
          baseElement.width = parseFloat(el.getAttribute('width')) || 100
          baseElement.height = parseFloat(el.getAttribute('height')) || 100
          baseElement.rx = parseFloat(el.getAttribute('rx')) || 0
        } else if (type === 'ellipse' || el.tagName.toLowerCase() === 'circle') {
          if (el.tagName.toLowerCase() === 'circle') {
            const r = parseFloat(el.getAttribute('r')) || 50
            baseElement.cx = parseFloat(el.getAttribute('cx')) || 50
            baseElement.cy = parseFloat(el.getAttribute('cy')) || 50
            baseElement.rx = r
            baseElement.ry = r
          } else {
            baseElement.cx = parseFloat(el.getAttribute('cx')) || 50
            baseElement.cy = parseFloat(el.getAttribute('cy')) || 50
            baseElement.rx = parseFloat(el.getAttribute('rx')) || 50
            baseElement.ry = parseFloat(el.getAttribute('ry')) || 50
          }
        } else if (type === 'line') {
          baseElement.x1 = parseFloat(el.getAttribute('x1')) || 0
          baseElement.y1 = parseFloat(el.getAttribute('y1')) || 0
          baseElement.x2 = parseFloat(el.getAttribute('x2')) || 100
          baseElement.y2 = parseFloat(el.getAttribute('y2')) || 100
        } else if (type === 'polygon') {
          baseElement.points = el.getAttribute('points') || ''
        } else if (type === 'path') {
          baseElement.d = el.getAttribute('d') || ''
        } else if (type === 'text') {
          baseElement.x = parseFloat(el.getAttribute('x')) || 0
          baseElement.y = parseFloat(el.getAttribute('y')) || 0
          baseElement.text = el.textContent || 'Text'
          baseElement.fontSize = parseFloat(el.getAttribute('font-size')) || 24
        }

        editor.addElement(baseElement)
      })

      editor.saveToHistory()
    }
  } catch (error) {
    console.error('Error importing SVG:', error)
  }

  event.target.value = ''
}

// Export SVG
const handleExport = () => {
  const svg = generateSvgString()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'drawing.svg'
  a.click()
  URL.revokeObjectURL(url)
}

const generateSvgString = () => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${editor.artboardWidth.value}" height="${editor.artboardHeight.value}" viewBox="0 0 ${editor.artboardWidth.value} ${editor.artboardHeight.value}">\n`

  editor.elements.value.forEach(el => {
    if (!el.visible) return

    const commonAttrs = `fill="${el.fill || 'none'}" stroke="${el.stroke || 'none'}" stroke-width="${el.strokeWidth}"${el.strokeDasharray ? ` stroke-dasharray="${el.strokeDasharray}"` : ''}${el.opacity !== 1 ? ` opacity="${el.opacity}"` : ''}`

    switch (el.type) {
      case 'rect':
        svg += `  <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"${el.rx ? ` rx="${el.rx}"` : ''} ${commonAttrs}${el.rotation ? ` transform="rotate(${el.rotation} ${el.x + el.width/2} ${el.y + el.height/2})"` : ''}/>\n`
        break
      case 'ellipse':
        svg += `  <ellipse cx="${el.cx}" cy="${el.cy}" rx="${el.rx}" ry="${el.ry}" ${commonAttrs}${el.rotation ? ` transform="rotate(${el.rotation} ${el.cx} ${el.cy})"` : ''}/>\n`
        break
      case 'line':
        svg += `  <line x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" ${commonAttrs}/>\n`
        break
      case 'polygon':
        svg += `  <polygon points="${el.points}" ${commonAttrs}/>\n`
        break
      case 'path':
        svg += `  <path d="${el.d}" ${commonAttrs}/>\n`
        break
      case 'text':
        svg += `  <text x="${el.x}" y="${el.y}" font-size="${el.fontSize}" font-family="${el.fontFamily}" ${commonAttrs}>${el.text}</text>\n`
        break
    }
  })

  svg += '</svg>'
  return svg
}

// Keyboard shortcuts
onMounted(() => {
  window.addEventListener('keydown', editor.handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', editor.handleKeydown)
})

// Handle wheel on canvas
const handleWheel = (event) => {
  event.preventDefault()
  if (event.ctrlKey || event.metaKey) {
    if (event.deltaY > 0) {
      editor.zoomOut()
    } else {
      editor.zoomIn()
    }
  } else {
    editor.panX.value -= event.deltaX
    editor.panY.value -= event.deltaY
  }
}

// Handle bring to front/back
const handleBringToFront = () => {
  if (editor.selectedIds.value.length > 0) {
    editor.bringToFront(editor.selectedIds.value[0])
    editor.saveToHistory()
  }
}

const handleSendToBack = () => {
  if (editor.selectedIds.value.length > 0) {
    editor.sendToBack(editor.selectedIds.value[0])
    editor.saveToHistory()
  }
}

// Delete selected
const handleDeleteSelected = () => {
  editor.deleteSelected()
  editor.saveToHistory()
}

// Duplicate selected
const handleDuplicateSelected = () => {
  editor.duplicateSelected()
  editor.saveToHistory()
}

// Update element
const handleUpdateElement = (id, updates) => {
  editor.updateElement(id, updates)
  editor.saveToHistory()
}

// Delete single element
const handleDeleteElement = (id) => {
  editor.deleteElements([id])
  editor.saveToHistory()
}

// Reorder layers
const handleReorder = (fromIndex, toIndex) => {
  editor.reorderElements(fromIndex, toIndex)
  editor.saveToHistory()
}
</script>

<template>
  <div class="h-full flex flex-col bg-neutral-950">
    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".svg"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Toolbar -->
    <SvgToolbar
      :current-tool="editor.currentTool.value"
      :tools="editor.tools"
      :zoom="editor.zoom.value"
      :show-grid="editor.showGrid.value"
      :snap-to-grid="editor.snapToGrid.value"
      :can-undo="editor.canUndo.value"
      :can-redo="editor.canRedo.value"
      :has-selection="editor.hasSelection.value"
      :theme-color="editor.themeColor.value"
      @update:current-tool="editor.currentTool.value = $event"
      @update:show-grid="editor.showGrid.value = $event"
      @update:snap-to-grid="editor.snapToGrid.value = $event"
      @update:theme-color="editor.themeColor.value = $event"
      @zoom-in="editor.zoomIn"
      @zoom-out="editor.zoomOut"
      @reset-zoom="editor.resetZoom"
      @undo="editor.undo"
      @redo="editor.redo"
      @delete-selected="handleDeleteSelected"
      @duplicate-selected="handleDuplicateSelected"
      @bring-to-front="handleBringToFront"
      @send-to-back="handleSendToBack"
      @import="handleImport"
      @export="handleExport"
    />

    <!-- Project Save/Load -->
    <div class="h-9 bg-neutral-900/50 border-b border-neutral-800 flex items-center px-3 shrink-0">
      <span class="text-xs text-neutral-500 mr-2">Proyecto</span>
      <VaultSaveLoad storeName="svg-projects" :getData="getProjectData" label="proyecto" @load="loadProject" />
    </div>

    <!-- Main content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Layers Panel -->
      <SvgLayersList
        :elements="editor.elements.value"
        :selected-ids="editor.selectedIds.value"
        :theme-color="editor.themeColor.value"
        @select-element="editor.selectElement"
        @toggle-visibility="editor.toggleVisibility"
        @toggle-lock="editor.toggleLock"
        @delete-element="handleDeleteElement"
        @reorder="handleReorder"
      />

      <!-- Canvas -->
      <SvgCanvas
        :elements="editor.elements.value"
        :selected-ids="editor.selectedIds.value"
        :current-tool="editor.currentTool.value"
        :artboard-width="editor.artboardWidth.value"
        :artboard-height="editor.artboardHeight.value"
        :zoom="editor.zoom.value"
        :pan-x="editor.panX.value"
        :pan-y="editor.panY.value"
        :show-grid="editor.showGrid.value"
        :grid-size="editor.gridSize.value"
        :theme-color="editor.themeColor.value"
        :is-drawing="editor.isDrawing.value"
        :is-drawing-polygon="editor.isDrawingPolygon.value"
        :is-drawing-path="editor.isDrawingPath.value"
        @start-drawing="editor.startDrawing"
        @continue-drawing="editor.continueDrawing"
        @end-drawing="editor.endDrawing"
        @finish-polygon="editor.finishPolygon"
        @select-element="editor.selectElement"
        @update-element="handleUpdateElement"
        @wheel="handleWheel"
      />

      <!-- Properties Sidebar -->
      <SvgSidebar
        :selected-elements="editor.selectedElements.value"
        :artboard-width="editor.artboardWidth.value"
        :artboard-height="editor.artboardHeight.value"
        :size-presets="editor.sizePresets"
        :theme-color="editor.themeColor.value"
        @update-element="handleUpdateElement"
        @apply-preset="editor.applyPreset"
        @update:artboard-width="editor.artboardWidth.value = $event"
        @update:artboard-height="editor.artboardHeight.value = $event"
      />
    </div>
  </div>
</template>
