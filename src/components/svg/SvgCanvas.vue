<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  elements: Array,
  selectedIds: Array,
  currentTool: String,
  artboardWidth: Number,
  artboardHeight: Number,
  zoom: Number,
  panX: Number,
  panY: Number,
  showGrid: Boolean,
  gridSize: Number,
  themeColor: String,
  isDrawing: Boolean,
  isDrawingPolygon: Boolean,
  isDrawingPath: Boolean
})

const emit = defineEmits([
  'start-drawing',
  'continue-drawing',
  'end-drawing',
  'finish-polygon',
  'select-element',
  'update-element',
  'wheel'
])

// Inline text editing state
const editingTextId = ref(null)
const editingTextValue = ref('')
const textInputRef = ref(null)

const canvasRef = ref(null)
const svgRef = ref(null)

// Grid pattern
const gridPatternId = 'svg-editor-grid'

// Get bounding box for selection highlight
const getElementBounds = (el) => {
  switch (el.type) {
    case 'rect':
      return { x: el.x, y: el.y, width: el.width, height: el.height }
    case 'ellipse':
      return {
        x: el.cx - el.rx,
        y: el.cy - el.ry,
        width: el.rx * 2,
        height: el.ry * 2
      }
    case 'line':
      return {
        x: Math.min(el.x1, el.x2),
        y: Math.min(el.y1, el.y2),
        width: Math.abs(el.x2 - el.x1) || 2,
        height: Math.abs(el.y2 - el.y1) || 2
      }
    case 'text':
      // Use defined text box if available, otherwise estimate
      if (el._boxWidth && el._boxHeight) {
        return {
          x: el._boxX,
          y: el._boxY,
          width: el._boxWidth,
          height: el._boxHeight
        }
      }
      // Fallback: estimate based on text
      const estimatedWidth = Math.max(50, el.text.length * el.fontSize * 0.6)
      return {
        x: el.x,
        y: el.y - el.fontSize,
        width: estimatedWidth,
        height: el.fontSize * 1.2
      }
    case 'polygon':
    case 'path':
      // Simplified bounds
      return { x: 0, y: 0, width: props.artboardWidth, height: props.artboardHeight }
    default:
      return { x: 0, y: 0, width: 0, height: 0 }
  }
}

// Transform style for zoom/pan
const transformStyle = computed(() => {
  return {
    transform: `translate(${props.panX}px, ${props.panY}px) scale(${props.zoom})`,
    transformOrigin: 'center center'
  }
})

// Cursor based on tool
const cursorClass = computed(() => {
  if (props.isDrawing || props.isDrawingPolygon || props.isDrawingPath) {
    return 'cursor-crosshair'
  }
  switch (props.currentTool) {
    case 'select':
      return 'cursor-default'
    case 'text':
      return 'cursor-text'
    default:
      return 'cursor-crosshair'
  }
})

// Mouse position to SVG coordinates
const getMouseSvgPosition = (event) => {
  if (!svgRef.value || !canvasRef.value) return { x: 0, y: 0 }

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const centerX = canvasRect.width / 2
  const centerY = canvasRect.height / 2

  const svgX = (event.clientX - canvasRect.left - centerX - props.panX) / props.zoom + props.artboardWidth / 2
  const svgY = (event.clientY - canvasRect.top - centerY - props.panY) / props.zoom + props.artboardHeight / 2

  return { x: svgX, y: svgY }
}

// Event handlers
const handleMouseDown = (event) => {
  if (event.button !== 0) return // Only left click

  // If editing text, finish and don't do anything else
  if (editingTextId.value) {
    finishTextEditing()
    return
  }

  const pos = getMouseSvgPosition(event)

  // Check if clicking on an element when using select tool
  if (props.currentTool === 'select') {
    // Deselect when clicking on empty canvas
    emit('select-element', null, false)
    return
  }

  emit('start-drawing', pos.x, pos.y)
}

const handleMouseMove = (event) => {
  if (!props.isDrawing) return

  const pos = getMouseSvgPosition(event)
  emit('continue-drawing', pos.x, pos.y)
}

const handleMouseUp = () => {
  if (props.isDrawing) {
    emit('end-drawing')
  }
}

const handleDoubleClick = () => {
  if (props.isDrawingPolygon) {
    emit('finish-polygon')
  }
}

const handleElementClick = (element, event) => {
  event.stopPropagation()

  if (props.currentTool !== 'select') return
  if (element.locked) return

  emit('select-element', element.id, event.ctrlKey || event.metaKey)
}

// Click on text element: select + edit
const handleTextClick = async (element, event) => {
  event.stopPropagation()
  if (element.locked) return

  // Select the element
  emit('select-element', element.id, false)

  // Enter edit mode
  editingTextId.value = element.id
  editingTextValue.value = element.text

  await nextTick()
  // textInputRef might be an array due to v-for
  const textarea = Array.isArray(textInputRef.value) ? textInputRef.value[0] : textInputRef.value
  if (textarea) {
    textarea.focus()
    // Put cursor at end
    const len = textarea.value.length
    textarea.setSelectionRange(len, len)
  }
}

// Finish text editing
const finishTextEditing = () => {
  if (editingTextId.value) {
    const newText = editingTextValue.value.trim() || 'Text'
    emit('update-element', editingTextId.value, { text: newText })
  }
  editingTextId.value = null
  editingTextValue.value = ''
}

// Cancel text editing (restore original)
const cancelTextEditing = () => {
  editingTextId.value = null
  editingTextValue.value = ''
}

// Handle text input keydown
const handleTextInputKeydown = (event) => {
  event.stopPropagation()

  // Escape to finish (not cancel, just close)
  if (event.key === 'Escape') {
    finishTextEditing()
  }
}

// Get text input position
const getTextInputStyle = (element) => {
  if (!canvasRef.value) return {}

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const centerX = canvasRect.width / 2
  const centerY = canvasRect.height / 2

  // Use text box if defined
  const boxX = element._boxX ?? element.x
  const boxY = element._boxY ?? (element.y - element.fontSize)
  const boxWidth = element._boxWidth ?? 100
  const boxHeight = element._boxHeight ?? (element.fontSize * 1.2)

  const screenX = centerX + props.panX + (boxX - props.artboardWidth / 2) * props.zoom
  const screenY = centerY + props.panY + (boxY - props.artboardHeight / 2) * props.zoom

  return {
    left: `${screenX}px`,
    top: `${screenY}px`,
    width: `${boxWidth * props.zoom}px`,
    height: `${boxHeight * props.zoom}px`,
    fontSize: `${element.fontSize * props.zoom}px`,
    fontFamily: element.fontFamily,
    color: element.fill,
    padding: '4px'
  }
}

const handleWheel = (event) => {
  emit('wheel', event)
}

// Visible elements (filter hidden)
const visibleElements = computed(() => {
  return props.elements.filter(el => el.visible)
})
</script>

<template>
  <div
    ref="canvasRef"
    class="relative flex-1 overflow-hidden bg-neutral-950"
    :class="cursorClass"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @dblclick="handleDoubleClick"
    @wheel.passive="handleWheel"
  >
    <!-- Checkered background pattern -->
    <div class="absolute inset-0 opacity-30" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22><rect width=%2210%22 height=%2210%22 fill=%22%23333%22/><rect x=%2210%22 y=%2210%22 width=%2210%22 height=%2210%22 fill=%22%23333%22/></svg>');"></div>

    <!-- SVG Artboard Container -->
    <div class="absolute inset-0 flex items-center justify-center">
      <div :style="transformStyle" class="transition-transform duration-75">
        <!-- Artboard shadow -->
        <div
          class="absolute bg-black/30 rounded"
          :style="{
            width: artboardWidth + 'px',
            height: artboardHeight + 'px',
            transform: 'translate(4px, 4px)'
          }"
        ></div>

        <!-- Main SVG -->
        <svg
          ref="svgRef"
          :width="artboardWidth"
          :height="artboardHeight"
          :viewBox="`0 0 ${artboardWidth} ${artboardHeight}`"
          class="bg-white relative"
          style="shape-rendering: geometricPrecision;"
        >
          <!-- Grid pattern definition -->
          <defs>
            <pattern
              :id="gridPatternId"
              :width="gridSize"
              :height="gridSize"
              patternUnits="userSpaceOnUse"
            >
              <path
                :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
                fill="none"
                stroke="#e5e5e5"
                stroke-width="0.5"
              />
            </pattern>
          </defs>

          <!-- Grid overlay -->
          <rect
            v-if="showGrid"
            width="100%"
            height="100%"
            :fill="`url(#${gridPatternId})`"
          />

          <!-- Elements -->
          <template v-for="el in visibleElements" :key="el.id">
            <!-- Rectangle -->
            <rect
              v-if="el.type === 'rect'"
              :x="el.x"
              :y="el.y"
              :width="el.width"
              :height="el.height"
              :rx="el.rx"
              :fill="el.fill || 'none'"
              :stroke="el.stroke"
              :stroke-width="el.strokeWidth"
              :stroke-dasharray="el.strokeDasharray"
              :opacity="el.opacity"
              :transform="el.rotation ? `rotate(${el.rotation} ${el.x + el.width/2} ${el.y + el.height/2})` : undefined"
              class="transition-opacity"
              :class="{ 'opacity-50': el.locked }"
              @mousedown.stop="handleElementClick(el, $event)"
            />

            <!-- Ellipse -->
            <ellipse
              v-if="el.type === 'ellipse'"
              :cx="el.cx"
              :cy="el.cy"
              :rx="el.rx"
              :ry="el.ry"
              :fill="el.fill || 'none'"
              :stroke="el.stroke"
              :stroke-width="el.strokeWidth"
              :stroke-dasharray="el.strokeDasharray"
              :opacity="el.opacity"
              :transform="el.rotation ? `rotate(${el.rotation} ${el.cx} ${el.cy})` : undefined"
              :class="{ 'opacity-50': el.locked }"
              @mousedown.stop="handleElementClick(el, $event)"
            />

            <!-- Line -->
            <line
              v-if="el.type === 'line'"
              :x1="el.x1"
              :y1="el.y1"
              :x2="el.x2"
              :y2="el.y2"
              :stroke="el.stroke"
              :stroke-width="el.strokeWidth"
              :stroke-dasharray="el.strokeDasharray"
              :opacity="el.opacity"
              :class="{ 'opacity-50': el.locked }"
              @mousedown.stop="handleElementClick(el, $event)"
            />

            <!-- Polygon -->
            <polygon
              v-if="el.type === 'polygon'"
              :points="el.points"
              :fill="el.fill || 'none'"
              :stroke="el.stroke"
              :stroke-width="el.strokeWidth"
              :stroke-dasharray="el.strokeDasharray"
              :opacity="el.opacity"
              :class="{ 'opacity-50': el.locked }"
              @mousedown.stop="handleElementClick(el, $event)"
            />

            <!-- Path -->
            <path
              v-if="el.type === 'path'"
              :d="el.d"
              :fill="el.fill || 'none'"
              :stroke="el.stroke"
              :stroke-width="el.strokeWidth"
              :stroke-dasharray="el.strokeDasharray"
              :opacity="el.opacity"
              :class="{ 'opacity-50': el.locked }"
              @mousedown.stop="handleElementClick(el, $event)"
            />

            <!-- Text -->
            <text
              v-if="el.type === 'text' && editingTextId !== el.id"
              :x="el.x"
              :y="el.y"
              :fill="el.fill"
              :stroke="el.stroke"
              :stroke-width="el.strokeWidth"
              :font-size="el.fontSize"
              :font-family="el.fontFamily"
              :opacity="el.opacity"
              class="cursor-text"
              :class="{ 'opacity-50': el.locked }"
              @mousedown.stop="handleTextClick(el, $event)"
            >{{ el.text }}</text>
          </template>

          <!-- Selection highlight -->
          <template v-for="id in selectedIds" :key="'sel-' + id">
            <g v-if="elements.find(e => e.id === id)" class="pointer-events-none">
              <rect
                v-bind="getElementBounds(elements.find(e => e.id === id))"
                fill="none"
                :stroke="themeColor"
                stroke-width="1"
                stroke-dasharray="4 2"
                class="animate-pulse"
              />
              <!-- Resize handles -->
              <template v-if="currentTool === 'select'">
                <rect
                  v-for="(pos, idx) in ['nw', 'ne', 'sw', 'se']"
                  :key="idx"
                  :x="getElementBounds(elements.find(e => e.id === id)).x + (pos.includes('e') ? getElementBounds(elements.find(e => e.id === id)).width : 0) - 4"
                  :y="getElementBounds(elements.find(e => e.id === id)).y + (pos.includes('s') ? getElementBounds(elements.find(e => e.id === id)).height : 0) - 4"
                  width="8"
                  height="8"
                  :fill="themeColor"
                  class="cursor-pointer"
                />
              </template>
            </g>
          </template>
        </svg>
      </div>
    </div>

    <!-- Zoom indicator -->
    <div class="absolute bottom-4 right-4 px-3 py-1.5 bg-neutral-900/90 rounded-lg text-xs text-neutral-400 backdrop-blur-sm">
      {{ Math.round(zoom * 100) }}%
    </div>

    <!-- Inline text editor overlay -->
    <template v-if="editingTextId">
      <template v-for="el in elements" :key="'edit-' + el.id">
        <textarea
          v-if="el.id === editingTextId"
          ref="textInputRef"
          v-model="editingTextValue"
          class="absolute bg-white/95 border-2 outline-none resize-none overflow-auto"
          :style="{
            ...getTextInputStyle(el),
            borderColor: themeColor
          }"
          @keydown="handleTextInputKeydown"
          @mousedown.stop
        ></textarea>
      </template>
    </template>
  </div>
</template>
